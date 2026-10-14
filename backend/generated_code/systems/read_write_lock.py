"""
Fair Reader-Writer Synchronization Primitive with Writer Priority.
Module: read_write_lock_19_c181bc | Max Concurrent Readers: 100
"""
import threading

class ReadWriteLock:
    def __init__(self):
        self._readers = 0
        self._writers_waiting = 0
        self._writing = False
        self._lock = threading.Lock()
        self._read_ok = threading.Condition(self._lock)
        self._write_ok = threading.Condition(self._lock)

    def acquire_read(self):
        with self._lock:
            while self._writing or self._writers_waiting > 0:
                self._read_ok.wait()
            self._readers += 1

    def release_read(self):
        with self._lock:
            self._readers -= 1
            if self._readers == 0:
                self._write_ok.notify()

    def acquire_write(self):
        with self._lock:
            self._writers_waiting += 1
            while self._writing or self._readers > 0:
                self._write_ok.wait()
            self._writers_waiting -= 1
            self._writing = True

    def release_write(self):
        with self._lock:
            self._writing = False
            if self._writers_waiting > 0:
                self._write_ok.notify()
            else:
                self._read_ok.notify_all()

def test_rwlock():
    rw = ReadWriteLock()
    rw.acquire_read()
    rw.release_read()
    rw.acquire_write()
    rw.release_write()
