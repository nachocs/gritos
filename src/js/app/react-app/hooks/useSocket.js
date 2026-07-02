import { useContext, useEffect } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { onSocketMessage, onSocketUpdated } from "../utils/socketEvents";

/**
 * Custom hook to subscribe to a socket room and listen for specific events.
 * @param {string} room - The room to subscribe to (e.g., 'collection:foroscomun').
 * @param {string} type - 'updated' or 'msg'.
 * @param {function} callback - Function to execute when an event is received.
 */
const useSocket = (room, type, callback) => {
  const ws = useContext(SocketContext);

  useEffect(() => {
    if (!room || !callback) return;

    // Extract room name without prefix if necessary for subscription
    const rawRoom = room.replace(/^(collection|msg):/, "");

    // Handle subscription
    ws.subscribe(rawRoom);

    // Set up the listener based on event type
    let unsubscribe;
    if (type === "updated") {
      unsubscribe = onSocketUpdated(rawRoom, callback);
    } else {
      unsubscribe = onSocketMessage(rawRoom, callback);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      ws.unsubscribe(rawRoom);
    };
  }, [room, type, callback, ws]);
};

export default useSocket;
