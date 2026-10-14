use std::alloc::{alloc, dealloc, Layout};
use std::ptr::{null_mut, NonNull};
use std::sync::atomic::{AtomicPtr, AtomicUsize, Ordering};

const CACHE_LINE_SIZE: usize = 64;

#[repr(C, align(64))]
struct SlabBlock {
    next: AtomicPtr<SlabBlock>,
}

pub struct LockFreeSlabArena {
    block_size: usize,
    capacity: usize,
    free_list: AtomicPtr<SlabBlock>,
    allocated_count: AtomicUsize,
    buffer: NonNull<u8>,
    layout: Layout,
}

unsafe impl Send for LockFreeSlabArena {}
unsafe impl Sync for LockFreeSlabArena {}

impl LockFreeSlabArena {
    pub fn new(capacity: usize, block_size: usize) -> Result<Self, &'static str> {
        if capacity == 0 || block_size == 0 {
            return Err("capacity and block_size must be greater than zero");
        }

        let aligned_block_size = (block_size + CACHE_LINE_SIZE - 1) & !(CACHE_LINE_SIZE - 1);
        let total_size = aligned_block_size.saturating_mul(capacity);
        let layout = Layout::from_size_align(total_size, CACHE_LINE_SIZE)
            .map_err(|_| "invalid memory layout")?;

        let raw_ptr = unsafe { alloc(layout) };
        let buffer = NonNull::new(raw_ptr).ok_or("memory allocation failed")?;

        let arena = Self {
            block_size: aligned_block_size,
            capacity,
            free_list: AtomicPtr::new(null_mut()),
            allocated_count: AtomicUsize::new(0),
            buffer,
            layout,
        };

        unsafe {
            arena.init_free_list();
        }

        Ok(arena)
    }

    unsafe fn init_free_list(&self) {
        let base = self.buffer.as_ptr();
        for i in (0..self.capacity).rev() {
            let offset = i * self.block_size;
            let block_ptr = base.add(offset) as *mut SlabBlock;
            let head = self.free_list.load(Ordering::Relaxed);
            (*block_ptr).next.store(head, Ordering::Relaxed);
            self.free_list.store(block_ptr, Ordering::Relaxed);
        }
    }

    pub fn allocate(&self) -> Option<*mut u8> {
        loop {
            let head = self.free_list.load(Ordering::Acquire);
            if head.is_null() {
                return None;
            }

            let next = unsafe { (*head).next.load(Ordering::Relaxed) };
            if self
                .free_list
                .compare_exchange_weak(head, next, Ordering::AcqRel, Ordering::Relaxed)
                .is_ok()
            {
                self.allocated_count.fetch_add(1, Ordering::Relaxed);
                return Some(head as *mut u8);
            }
        }
    }

    pub fn deallocate(&self, ptr: *mut u8) {
        if ptr.is_null() {
            return;
        }

        let block_ptr = ptr as *mut SlabBlock;
        loop {
            let head = self.free_list.load(Ordering::Acquire);
            unsafe {
                (*block_ptr).next.store(head, Ordering::Relaxed);
            }
            if self
                .free_list
                .compare_exchange_weak(head, block_ptr, Ordering::AcqRel, Ordering::Relaxed)
                .is_ok()
            {
                self.allocated_count.fetch_sub(1, Ordering::Relaxed);
                return;
            }
        }
    }

    pub fn allocated_count(&self) -> usize {
        self.allocated_count.load(Ordering::Relaxed)
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }
}

impl Drop for LockFreeSlabArena {
    fn drop(&mut self) {
        unsafe {
            dealloc(self.buffer.as_ptr(), self.layout);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::LockFreeSlabArena;

    #[test]
    fn alloc_and_free_round_trip() {
        let arena = LockFreeSlabArena::new(4, 64).unwrap();
        let ptr = arena.allocate().expect("expected one block");
        assert!(!ptr.is_null());
        assert_eq!(arena.allocated_count(), 1);

        arena.deallocate(ptr);
        assert_eq!(arena.allocated_count(), 0);
    }

    #[test]
    fn full_capacity_is_supported() {
        let arena = LockFreeSlabArena::new(3, 64).unwrap();
        let mut ptrs = Vec::new();

        for _ in 0..3 {
            let ptr = arena.allocate().expect("slot should exist");
            ptrs.push(ptr);
        }

        assert!(arena.allocate().is_none());

        for ptr in ptrs {
            arena.deallocate(ptr);
        }

        assert_eq!(arena.allocated_count(), 0);
    }
}
