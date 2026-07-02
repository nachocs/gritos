import PropTypes from "prop-types";
import { createContext, useMemo } from "react";
import ws from "../../util/Ws";

export const SocketContext = createContext(null);

/**
 * Provides the WebSocket service instance to the application.
 */
export const SocketProvider = ({ children }) => {
  // Using useMemo to ensure the ws instance is treated as a singleton within the provider
  const value = useMemo(() => ws, []);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
