"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(valueRef.current);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);

  return debouncedValue;
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdate = useRef(0);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= interval) {
      setThrottledValue(valueRef.current);
      lastUpdate.current = now;
    }
  }, [interval]);

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
  const containerHeightRef = useRef(0);
  const scrollTopRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateVisibleItems = useCallback(() => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = scrollTopRef.current;
      const viewportHeight = containerHeightRef.current;
      const itemsLen = itemsRef.current.length;

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        itemsLen,
        Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
      );

      const startIndexChanged = startIndex !== lastIndexRef.current;
      if (startIndexChanged) {
        const visible = itemsRef.current.slice(startIndex, endIndex);
        setVisibleItems(visible);
        setTotalHeight(itemsLen * itemHeight);
        setOffsetTop(startIndex * itemHeight);
        lastIndexRef.current = startIndex;
      }

      rafRef.current = null;
    });
  }, [itemHeight, overscan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    containerHeightRef.current = container.clientHeight;
    scrollTopRef.current = container.scrollTop;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      scrollTopRef.current = target.scrollTop;
      containerHeightRef.current = target.clientHeight;
      updateVisibleItems();
    };

    updateVisibleItems();

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef, updateVisibleItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    containerHeightRef.current = container.clientHeight;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const itemsLen = items.length;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemsLen,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
    );

    const visible = items.slice(startIndex, endIndex);
    setVisibleItems(visible);
    setTotalHeight(itemsLen * itemHeight);
    setOffsetTop(startIndex * itemHeight);
    lastIndexRef.current = startIndex;
  }, [items, itemHeight, overscan, containerRef]);

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
