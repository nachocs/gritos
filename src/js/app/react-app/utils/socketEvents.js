import vent from "../../util/vent";

export const onSocketUpdated = (room, handler) => {
  const eventName = `updated_${room}`;
  vent.on(eventName, handler);

  return () => {
    vent.off(eventName, handler);
  };
};

export const onSocketMessage = (room, handler) => {
  const eventName = `msg_${room}`;
  vent.on(eventName, handler);

  return () => {
    vent.off(eventName, handler);
  };
};

export const onNotificaciones = (userId, handler) => {
  const eventName = `notificaciones_${userId}`;
  vent.on(eventName, handler);

  return () => {
    vent.off(eventName, handler);
  };
};

// Ws fires `capture_url_reply_<user>` on vent when the backend returns the
// scraped title/image/description for a requested URL.
export const onCaptureUrlReply = (userId, handler) => {
  const eventName = `capture_url_reply_${userId}`;
  vent.on(eventName, handler);

  return () => {
    vent.off(eventName, handler);
  };
};
