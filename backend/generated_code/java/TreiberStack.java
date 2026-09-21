/**
 * Non-Blocking Lock-Free Treiber Stack using AtomicReference.
 * Module: TreiberStack_11_0a5b70 | Initial Nodes: 60
 */
package com.nexium.ai.systems;

import java.util.concurrent.atomic.AtomicReference;
import java.util.Optional;

public class TreiberStack<E> {
    private static class Node<E> {
        final E item;
        Node<E> next;
        Node(E item) { this.item = item; }
    }

    private final AtomicReference<Node<E>> top = new AtomicReference<>(null);

    public void push(E item) {
        Node<E> newHead = new Node<>(item);
        Node<E> oldHead;
        do {
            oldHead = top.get();
            newHead.next = oldHead;
        } while (!top.compareAndSet(oldHead, newHead));
    }

    public Optional<E> pop() {
        Node<E> oldHead;
        Node<E> newHead;
        do {
            oldHead = top.get();
            if (oldHead == null) {
                return Optional.empty();
            }
            newHead = oldHead.next;
        } while (!top.compareAndSet(oldHead, newHead));
        return Optional.of(oldHead.item);
    }

    public boolean isEmpty() {
        return top.get() == null;
    }
}
