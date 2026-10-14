# Lock-Free Slab Allocator

This scaffold implements a production-oriented Rust arena for fixed-size allocation with a lock-free free list. It is designed as a reusable building block for high-performance systems code.

## Core ideas

- fixed-size block allocation
- atomic free-list management
- CAS-style push/pop for reuse
- simple smoke tests to verify correctness

## Run

```bash
cargo test
```

## Example

```rust
use lockfree_slab_allocator::LockFreeSlabArena;

let arena = LockFreeSlabArena::new(16, 64).unwrap();
let ptr = arena.allocate().expect("slot should be available");
unsafe {
    std::ptr::write(ptr, 42u8);
}
arena.deallocate(ptr);
```
