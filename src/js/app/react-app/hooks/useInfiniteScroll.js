import { useEffect } from "react";

/**
 * Fire `nextPage` as the viewport nears the bottom of the document. Extracted
 * from ForoPage so the secondary views (votaciones, gallery) share one
 * implementation. Disabled while there's nothing more to load or an initial/
 * incremental fetch is in flight.
 */
const useInfiniteScroll = (nextPage, { disabled, fetchingMore } = {}) => {
  useEffect(() => {
    if (disabled) {
      return undefined;
    }

    const handleScroll = () => {
      if (fetchingMore) {
        return;
      }
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        nextPage();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nextPage, disabled, fetchingMore]);
};

export default useInfiniteScroll;
