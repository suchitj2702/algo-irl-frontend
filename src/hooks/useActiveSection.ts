import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for tracking the currently active section based on scroll position.
 * Uses IntersectionObserver API for efficient scroll tracking.
 *
 * @param headingIds - Array of heading IDs to track
 * @param options - Configuration options
 * @returns The currently active section ID
 */
export function useActiveSection(
  headingIds: string[],
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const { rootMargin = '-80px 0px -60% 0px', threshold = 0 } = options;

  useEffect(() => {
    if (headingIds.length === 0) return;

    const callback: IntersectionObserverCallback = (entries) => {
      // Update our map of heading elements
      entries.forEach((entry) => {
        headingElementsRef.current.set(entry.target.id, entry);
      });

      // Find all visible headings
      const visibleHeadings: IntersectionObserverEntry[] = [];
      headingElementsRef.current.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleHeadings.push(entry);
        }
      });

      if (visibleHeadings.length === 0) {
        // If no headings are visible, find the one closest to the top
        // that we've scrolled past
        const scrollY = window.scrollY;
        let closestAbove: { id: string; top: number } | null = null;

        headingIds.forEach((id) => {
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            const absoluteTop = rect.top + scrollY;

            if (absoluteTop <= scrollY + 100) {
              if (!closestAbove || absoluteTop > closestAbove.top) {
                closestAbove = { id, top: absoluteTop };
              }
            }
          }
        });

        if (closestAbove) {
          setActiveId(closestAbove.id);
        }
      } else {
        // Get the topmost visible heading
        const sortedHeadings = visibleHeadings.sort((a, b) => {
          const aTop = a.boundingClientRect.top;
          const bTop = b.boundingClientRect.top;
          return aTop - bTop;
        });

        setActiveId(sortedHeadings[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin,
      threshold,
    });

    // Observe all heading elements
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    // Set initial active section
    const firstElement = document.getElementById(headingIds[0]);
    if (firstElement) {
      const rect = firstElement.getBoundingClientRect();
      if (rect.top <= 100) {
        setActiveId(headingIds[0]);
      }
    }

    return () => {
      observerRef.current?.disconnect();
      headingElementsRef.current.clear();
    };
  }, [headingIds, rootMargin, threshold]);

  return activeId;
}
