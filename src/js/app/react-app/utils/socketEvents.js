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
