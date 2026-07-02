import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Component that resets scroll position on route changes.
 * Replaces the manual $('body').scrollTop(0) logic from router.js.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Standard behavior: scroll to top on page change
    window.scrollTo(0, 0);

    // Specific logic for message details (the 380px offset from router.js)
    if (pathname.match(/\/\d+$/)) {
      // We delay slightly to allow the content to render, matching legacy behavior
      setTimeout(() => window.scrollTo({ top: 380, behavior: "smooth" }), 100);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
