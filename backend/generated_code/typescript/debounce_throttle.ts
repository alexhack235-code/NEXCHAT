/**
 * Microsecond Resolution Debounce & Throttle High-Order Functions.
 * Module: debounce_throttle_7_38c28a | Default Delay: 40ms
 */

export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delayMs: number = 40
): (...args: Parameters<T>) => void {
    let timer: any = null;
    return (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delayMs);
    };
}

export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limitMs: number = 40
): (...args: Parameters<T>) => void {
    let lastRun = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastRun >= limitMs) {
            lastRun = now;
            fn(...args);
        }
    };
}
