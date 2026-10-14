use lockfree_slab_allocator::LockFreeSlabArena;

#[test]
fn smoke_test() {
    let arena = LockFreeSlabArena::new(8, 128).unwrap();
    let slot = arena.allocate().expect("expected available allocation");
    assert!(!slot.is_null());
    arena.deallocate(slot);
}
