import vent from "../../util/vent";

// Ws fires `capture_url_reply_<user>` on vent when the backend returns the
// scraped title/image/description for a requested URL.
export const onCaptureUrlReply = (userId, handler) => {
  const eventName = `capture_url_reply_${userId}`;
  vent.on(eventName, handler);

  return () => {
    vent.off(eventName, handler);
  };
};
