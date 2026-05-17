"use client";

import { useRef, useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= interval) {
      setThrottledValue(value);
      lastUpdate.current = now;
    }
  }, [value, interval]);

  return throttledValue;
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
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleItems = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        itemsRef.current.length,
        Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
      );

      const visible = itemsRef.current.slice(startIndex, endIndex);
      setVisibleItems(visible);
      setTotalHeight(itemsRef.current.length * itemHeight);
      setOffsetTop(startIndex * itemHeight);
    };

    updateVisibleItems();

    container.addEventListener("scroll", updateVisibleItems, { passive: true });
    return () => {
      container.removeEventListener("scroll", updateVisibleItems);
    };
  }, [itemHeight, overscan, containerRef, items]);

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
