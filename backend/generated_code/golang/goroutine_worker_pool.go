// Package pool provides a high-throughput worker pool with graceful shutdown.
// Module: goroutine_worker_pool_8_82bbad | Max Workers: 45
package main

import (
	"context"
	"fmt"
	"sync"
)

type Task func(ctx context.Context) error

type WorkerPool struct {
	maxWorkers int
	taskQueue  chan Task
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
}

func NewWorkerPool(workers int, queueSize int) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	p := &WorkerPool{
		maxWorkers: workers,
		taskQueue:  make(chan Task, queueSize),
		ctx:        ctx,
		cancel:     cancel,
	}
	p.start()
	return p
}

func (p *WorkerPool) start() {
	for i := 0; i < p.maxWorkers; i++ {
		p.wg.Add(1)
		go func(id int) {
			defer p.wg.Done()
			for {
				select {
				case <-p.ctx.Done():
					return
				case task, ok := <-p.taskQueue:
					if !ok {
						return
					}
					_ = task(p.ctx)
				}
			}
		}(i)
	}
}

func (p *WorkerPool) Submit(t Task) bool {
	select {
	case p.taskQueue <- t:
		return true
	default:
		return false // Queue full
	}
}

func (p *WorkerPool) Shutdown() {
	close(p.taskQueue)
	p.wg.Wait()
	p.cancel()
}

func main() {
	pool := NewWorkerPool(4, 100)
	pool.Submit(func(ctx context.Context) error {
		fmt.Println("NEXIUM Task executed")
		return nil
	})
	pool.Shutdown()
}
