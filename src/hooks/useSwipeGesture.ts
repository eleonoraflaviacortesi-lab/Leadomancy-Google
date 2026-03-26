import { useEffect, useRef } from 'react';

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50
) {
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStart.current === null) return;

      const touchEnd = e.changedTouches[0].clientX;
      const deltaX = touchStart.current - touchEnd;

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
      }

      touchStart.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, threshold]);
}
