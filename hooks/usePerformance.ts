"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const debouncedValue = useRef(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      debouncedValue.current = value;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue.current;
}

export function useThrottle<T>(value: T, interval: number): T {
  const throttledValue = useRef(value);
  const lastUpdate = useRef(0);

  const updateValue = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= interval) {
      throttledValue.current = value;
      lastUpdate.current = now;
    }
  }, [value, interval]);

  useEffect(() => {
    updateValue();
  }, [updateValue]);

  return throttledValue.current;
}

export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerRef: React.RefObject<HTMLElement>,
  overscan = 5,
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [totalHeight, setTotalHeight] = useState(0);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleItems = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
      );

      const visible = items.slice(startIndex, endIndex);
      setVisibleItems(visible);
      setTotalHeight(items.length * itemHeight);
      setOffsetTop(startIndex * itemHeight);
    };

    updateVisibleItems();

    container.addEventListener("scroll", updateVisibleItems, { passive: true });
    return () => {
      container.removeEventListener("scroll", updateVisibleItems);
    };
  }, [items, itemHeight, overscan]);

  return { visibleItems, totalHeight, offsetTop };
}

export function useIntersectionObserver(
  options: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: "50px",
  },
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { elementRef, isIntersecting };
}

export function useRequestIdleCallback(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const scheduleIdleTask = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          callbackRef.current();
        });
      } else {
        setTimeout(() => {
          callbackRef.current();
        }, 1);
      }
    };

    scheduleIdleTask();
  }, []);
}
