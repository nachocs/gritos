import { useEffect, useRef } from "react";

// Cloudflare Turnstile for the sign-up form (2026-11-21). Same widget as the
// dreamers.es newsletter and sign-up page; registro.cgi checks the token with
// action "registro" and hostname gritos.com (admin/altas.pl). The script is
// loaded only when the sign-up modal opens, and in "interaction-only" mode the
// widget stays invisible unless Cloudflare wants a click.
export const TURNSTILE_SITEKEY = "0x4AAAAAAGASveSMM39dfd9k";
const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading = null;
export const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        loading = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
};

/**
 * Renders the widget and reports the token through onToken ("" when it
 * expires or fails). Tokens are single use: bump resetKey after every submit
 * to get a fresh one.
 */
const TurnstileWidget = ({ onToken, onError, resetKey = 0 }) => {
  const box = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let alive = true;
    loadTurnstile()
      .then((turnstile) => {
        if (!alive || !box.current || !turnstile) return;
        widgetId.current = turnstile.render(box.current, {
          sitekey: TURNSTILE_SITEKEY,
          action: "registro",
          appearance: "interaction-only",
          language: "es",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            if (onError) onError();
          },
        });
      })
      .catch(() => {
        if (alive && onError) onError();
      });
    return () => {
      alive = false;
      if (widgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // already gone
        }
      }
      widgetId.current = null;
    };
    // onToken/onError are state setters or stable callbacks: render once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey && widgetId.current !== null && window.turnstile) {
      onToken("");
      window.turnstile.reset(widgetId.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return <div className="signup-turnstile" ref={box} />;
};

export default TurnstileWidget;
