import threading
import time
from collections import OrderedDict
from typing import Callable, TypeVar

from app.core.settings import get_settings

T = TypeVar("T")


class _CacheEntry:
    def __init__(self, value: object, expires_at: float) -> None:
        self.value = value
        self.expires_at = expires_at


_cache_lock = threading.Lock()
_cache_store: "OrderedDict[str, _CacheEntry]" = OrderedDict()


def _evict_if_needed() -> None:
    max_entries = get_settings().api_cache_max_entries
    while len(_cache_store) > max_entries:
        _cache_store.popitem(last=False)


def clear_cache(prefix: str | None = None) -> None:
    with _cache_lock:
        if prefix is None:
            _cache_store.clear()
            return

        stale_keys = [key for key in _cache_store if key.startswith(prefix)]
        for key in stale_keys:
            _cache_store.pop(key, None)


def get_or_set_cache(key: str, resolver: Callable[[], T], ttl_seconds: int | None = None) -> T:
    ttl = ttl_seconds if ttl_seconds is not None else get_settings().api_cache_ttl_seconds
    now = time.monotonic()

    with _cache_lock:
        cached = _cache_store.get(key)
        if cached and cached.expires_at >= now:
            _cache_store.move_to_end(key)
            return cached.value  # type: ignore[return-value]

        if cached and cached.expires_at < now:
            _cache_store.pop(key, None)

    fresh_value = resolver()
    expires_at = time.monotonic() + ttl
    with _cache_lock:
        _cache_store[key] = _CacheEntry(fresh_value, expires_at)
        _cache_store.move_to_end(key)
        _evict_if_needed()
    return fresh_value
