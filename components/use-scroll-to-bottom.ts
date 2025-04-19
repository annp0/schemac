import { useEffect, useRef, useState, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const [shouldScroll, setShouldScroll] = useState(true);

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    const end = endRef.current;
    if (end) {
      end.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Check if user is already near bottom before scrolling
      const isNearBottom = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        return scrollHeight - scrollTop - clientHeight < 100;
      };

      // Handle scroll events to determine if auto-scroll should continue
      const handleScroll = () => {
        setShouldScroll(isNearBottom());
      };

      container.addEventListener('scroll', handleScroll, { passive: true });

      // Only observe childList changes (not attributes/characterData)
      const observer = new MutationObserver((mutations) => {
        // Only scroll if content was actually added (not just attributes changed)
        const hasAddedNodes = mutations.some(mutation =>
          mutation.type === 'childList' && mutation.addedNodes.length > 0
        );

        if (hasAddedNodes && shouldScroll) {
          // Use requestAnimationFrame to debounce multiple rapid changes
          requestAnimationFrame(() => {
            end.scrollIntoView({ behavior: 'instant', block: 'end' });
          });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: false, // Don't trigger on attribute changes
        characterData: false, // Don't trigger on text changes
      });

      return () => {
        observer.disconnect();
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [shouldScroll]);

  return [containerRef, endRef];
}
