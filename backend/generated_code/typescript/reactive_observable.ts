/**
 * Reactive Observable Pattern with Functional Pipeline Operators.
 * Module: reactive_observable_6_3b8b44 | Stream Capacity: 35
 */

export type Observer<T> = (value: T) => void;
export type Unsubscribe = () => void;

export class Observable<T> {
    private subscribers: Set<Observer<T>> = new Set();

    subscribe(observer: Observer<T>): Unsubscribe {
        this.subscribers.add(observer);
        return () => this.subscribers.delete(observer);
    }

    next(value: T): void {
        for (const sub of this.subscribers) {
            sub(value);
        }
    }

    map<U>(fn: (val: T) => U): Observable<U> {
        const mapped = new Observable<U>();
        this.subscribe((val) => mapped.next(fn(val)));
        return mapped;
    }

    filter(predicate: (val: T) => boolean): Observable<T> {
        const filtered = new Observable<T>();
        this.subscribe((val) => {
            if (predicate(val)) {
                filtered.next(val);
            }
        });
        return filtered;
    }
}
