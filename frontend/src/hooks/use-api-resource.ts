"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetch-json";

type UseApiResourceOptions<T> = {
  enabled?: boolean;
  initialData: T;
  keepPreviousData?: boolean;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const resourceCache = new Map<string, { value: unknown; cachedAt: number }>();

function getCachedResource<T>(requestKey: string): T | undefined {
  const cachedEntry = resourceCache.get(requestKey);
  if (!cachedEntry) {
    return undefined;
  }

  const isExpired = Date.now() - cachedEntry.cachedAt > CACHE_TTL_MS;
  if (isExpired) {
    resourceCache.delete(requestKey);
    return undefined;
  }

  return cachedEntry.value as T;
}

export function useApiResource<T>(
  requestKey: string,
  path: string,
  {
    enabled = true,
    initialData,
    keepPreviousData = false,
  }: UseApiResourceOptions<T>,
) {
  const cachedValue = enabled ? getCachedResource<T>(requestKey) : undefined;
  const hasCachedValue = cachedValue !== undefined;
  const [refreshToken, setRefreshToken] = useState(0);

  const [data, setData] = useState<T>(() =>
    hasCachedValue ? cachedValue : initialData,
  );
  const [isLoading, setIsLoading] = useState(enabled && !hasCachedValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    async function loadResource() {
      const latestCachedValue = getCachedResource<T>(requestKey);
      if (latestCachedValue !== undefined) {
        setData(latestCachedValue);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      if (!keepPreviousData) {
        setData(initialData);
      }

      try {
        const response = await fetchJson<T>(path, {
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        resourceCache.set(requestKey, {
          value: response,
          cachedAt: Date.now(),
        });
        setData(response);
      } catch (loadError) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Something went wrong while loading data.";

        setError(message);

        if (!keepPreviousData) {
          setData(initialData);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadResource();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [enabled, initialData, keepPreviousData, path, requestKey, refreshToken]);

  const refresh = useCallback(
    (force = true) => {
      if (force) {
        resourceCache.delete(requestKey);
      }
      setRefreshToken((currentValue) => currentValue + 1);
    },
    [requestKey],
  );

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
