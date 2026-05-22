import { useEffect, useRef, useCallback } from 'react';

/**
 * Safely manages timeouts, ensuring they are automatically cleared when the component unmounts.
 */
export function useSafeTimeout() {
  const timeoutIds = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current.clear();
    };
  }, []);

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutIds.current.delete(id);
      callback();
    }, delay);
    timeoutIds.current.add(id);
    return id;
  }, []);

  return setSafeTimeout;
}

/**
 * Safely manages requestAnimationFrame, ensuring frames are automatically cancelled when the component unmounts.
 */
export function useSafeAnimationFrame() {
  const frameIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    return () => {
      frameIds.current.forEach(cancelAnimationFrame);
      frameIds.current.clear();
    };
  }, []);

  const requestSafeAnimationFrame = useCallback((callback: () => void) => {
    const id = requestAnimationFrame(() => {
      frameIds.current.delete(id);
      callback();
    });
    frameIds.current.add(id);
    return id;
  }, []);

  return requestSafeAnimationFrame;
}
