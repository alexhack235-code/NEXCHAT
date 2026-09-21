/**
 * Fast O(1) Linear Bump Arena Memory Allocator in C11.
 * Module: memory_arena_pool_10_e481c3 | Arena Size: 55 * 1024 Bytes
 */
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    uint8_t *buffer;
    size_t capacity;
    size_t offset;
} MemoryArena;

static inline MemoryArena arena_create(size_t capacity) {
    MemoryArena arena;
    arena.buffer = (uint8_t *)malloc(capacity);
    arena.capacity = capacity;
    arena.offset = 0;
    return arena;
}

static inline void *arena_alloc(MemoryArena *arena, size_t size, size_t align) {
    size_t current_ptr = (size_t)(arena->buffer + arena->offset);
    size_t aligned_ptr = (current_ptr + (align - 1)) & ~(align - 1);
    size_t new_offset = (aligned_ptr - (size_t)arena->buffer) + size;

    if (new_offset > arena->capacity) {
        return NULL; // Out of memory in arena
    }
    arena->offset = new_offset;
    return (void *)aligned_ptr;
}

static inline void arena_reset(MemoryArena *arena) {
    arena->offset = 0;
}

static inline void arena_destroy(MemoryArena *arena) {
    if (arena->buffer) {
        free(arena->buffer);
        arena->buffer = NULL;
    }
    arena->capacity = 0;
    arena->offset = 0;
}
