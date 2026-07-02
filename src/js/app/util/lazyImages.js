/**
 * Intersection Observer configuration.
 */
const CONFIG = {
  rootMargin: "50px 0px",
  threshold: 0.01,
};

/**
 * Fetches an image and returns a promise that resolves when it's loaded.
 * @param {string} url
 * @returns {Promise}
 */
const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = resolve;
    image.onerror = reject;
  });
};

/**
 * Preloads an image and applies it to the DOM element.
 * @param {HTMLImageElement} image
 */
const preloadImage = async (image) => {
  const src = image.dataset.src;
  if (!src) return;

  try {
    await fetchImage(src);
    // Prevent this from being lazy loaded a second time.
    image.classList.add("js-lazy-image--handled");
    image.src = src;
    image.classList.add("fade-in");
  } catch (err) {
    console.error("Failed to preload image:", src, err);
  }
};

/**
 * Intersection observer callback.
 */
const onIntersection = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting || entry.intersectionRatio > 0) {
      observer.unobserve(entry.target);
      preloadImage(entry.target);
    }
  });
};

/**
 * Modern functional utility to lazy load images.
 */
const lazyImages = {
  /**
   * Observes a collection of images for lazy loading.
   * @param {NodeList|Array} images
   * @returns {Function} Cleanup function to disconnect the observer.
   */
  apply(images) {
    if (!("IntersectionObserver" in window)) {
      Array.from(images).forEach(preloadImage);
      return () => {};
    }

    const observer = new IntersectionObserver(onIntersection, CONFIG);
    Array.from(images).forEach((image) => {
      if (!image.classList.contains("js-lazy-image--handled")) {
        observer.observe(image);
      }
    });

    return () => observer.disconnect();
  },
};

export default lazyImages;
