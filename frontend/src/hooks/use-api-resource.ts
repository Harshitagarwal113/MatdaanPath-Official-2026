"use client";

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetch-json";

type UseApiResourceOptions<T> = {
  enabled?: boolean;
  initialData: T;
  keepPreviousData?: boolean;
};

const resourceCache = new Map<string, unknown>();

export function useApiResource<T>(
  requestKey: string,
  path: string,
  {
    enabled = true,
    initialData,
    keepPreviousData = false,
  }: UseApiResourceOptions<T>,
) {
  const hasCachedValue = enabled && resourceCache.has(requestKey);

  const [data, setData] = useState<T>(() =>
    hasCachedValue ? (resourceCache.get(requestKey) as T) : initialData,
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
      const cachedValue = resourceCache.get(requestKey) as T | undefined;
      if (cachedValue !== undefined) {
        setData(cachedValue);
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

        resourceCache.set(requestKey, response);
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
  }, [enabled, initialData, keepPreviousData, path, requestKey]);

  return {
    data,
    isLoading,
    error,
  };
}
