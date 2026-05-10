import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook for safe portal rendering with proper cleanup
 */
export const usePortalContainer = (containerId) => {
  const [container, setContainer] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const findContainer = () => {
      if (!isMountedRef.current) return;

      const element = document.getElementById(containerId);
      if (element) {
        setContainer(element);
      } else {
        // Retry after a short delay if element doesn't exist yet
        const timer = setTimeout(findContainer, 50);
        return () => clearTimeout(timer);
      }
    };

    findContainer();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (container) {
        setContainer(null);
      }
    };
  }, [containerId, container]);

  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return container;
};
