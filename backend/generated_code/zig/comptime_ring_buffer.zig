//! Comptime Generic Circular Ring Buffer in Zig
//! Module: comptime_ring_buffer_14_42b78b | Fixed Capacity: 75

const std = @import("std");

pub fn RingBuffer(comptime T: type, comptime capacity: usize) type {
    return struct {
        const Self = @This();
        data: [capacity]T = undefined,
        head: usize = 0,
        tail: usize = 0,
        count: usize = 0,

        pub fn init() Self {
            return Self{};
        }

        pub fn push(self: *Self, item: T) bool {
            if (self.count == capacity) return false;
            self.data[self.tail] = item;
            self.tail = (self.tail + 1) % capacity;
            self.count += 1;
            return true;
        }

        pub fn pop(self: *Self) ?T {
            if (self.count == 0) return null;
            const item = self.data[self.head];
            self.head = (self.head + 1) % capacity;
            self.count -= 1;
            return item;
        }

        pub fn isFull(self: Self) bool {
            return self.count == capacity;
        }
    };
}
