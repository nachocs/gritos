import { useEffect } from "react";
import lazyImages from "../../util/lazyImages";

/**
 * Hook to initialize lazy loading for images with the '.js-lazy-image' class.
 * @param {Array} dependencies - Array of dependencies to re-trigger the check (e.g., when a list updates).
 */
const useLazyLoading = (dependencies = []) => {
  useEffect(() => {
    const images = document.querySelectorAll(".js-lazy-image");
    if (images.length > 0) {
      const disconnect = lazyImages.apply(images);
      return () => disconnect();
    }
  }, dependencies);
};

export default useLazyLoading;
