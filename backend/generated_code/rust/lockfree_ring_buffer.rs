//! Lock-Free Single-Producer Single-Consumer Ring Buffer
//! Module: lockfree_ring_buffer_4_228128 | Ring Slots: 25

use std::sync::atomic::{AtomicUsize, Ordering};

pub struct SpscRingBuffer<T> {
    buffer: Vec<Option<T>>,
    capacity: usize,
    head: AtomicUsize,
    tail: AtomicUsize,
}

impl<T> SpscRingBuffer<T> {
    pub fn new(capacity: usize) -> Self {
        let mut buffer = Vec::with_capacity(capacity);
        for _ in 0..capacity {
            buffer.push(None);
        }
        Self {
            buffer,
            capacity,
            head: AtomicUsize::new(0),
            tail: AtomicUsize::new(0),
        }
    }

    pub fn len(&self) -> usize {
        let h = self.head.load(Ordering::Acquire);
        let t = self.tail.load(Ordering::Acquire);
        if t >= h { t - h } else { self.capacity - (h - t) }
    }
}
