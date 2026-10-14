/**
 * C++20 Thread-Safe Bounded Concurrent Queue with RAII Guards.
 * Module: bounded_atomic_queue_9_960691 | Capacity: 50
 */
#include <queue>
#include <mutex>
#include <condition_variable>
#include <optional>
#include <cstddef>

template <typename T>
class BoundedQueue {
public:
    explicit BoundedQueue(size_t max_size = 50) : max_size_(max_size) {}

    bool push(T item) {
        std::unique_lock<std::mutex> lock(mutex_);
        cv_push_.wait(lock, [this]() { return queue_.size() < max_size_ || closed_; });
        if (closed_) return false;
        queue_.push(std::move(item));
        cv_pop_.notify_one();
        return true;
    }

    std::optional<T> pop() {
        std::unique_lock<std::mutex> lock(mutex_);
        cv_pop_.wait(lock, [this]() { return !queue_.empty() || closed_; });
        if (queue_.empty()) return std::nullopt;
        T val = std::move(queue_.front());
        queue_.pop();
        cv_push_.notify_one();
        return val;
    }

    void close() {
        std::lock_guard<std::mutex> lock(mutex_);
        closed_ = true;
        cv_push_.notify_all();
        cv_pop_.notify_all();
    }

private:
    size_t max_size_;
    std::queue<T> queue_;
    std::mutex mutex_;
    std::condition_variable cv_push_;
    std::condition_variable cv_pop_;
    bool closed_ = false;
};
