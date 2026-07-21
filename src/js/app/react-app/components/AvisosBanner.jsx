import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAviso } from "../utils/avisosEvents";

/**
 * Port of legacy avisosView: a small pill showing how many new top-level
 * entries have arrived (via socket) in a room since it started being
 * watched. Per-room baselines are ID-diff based, not an event count —
 * `counters[room]` is set to `entry.ID - 1` the first time a room is seen,
 * so the immediate next arrival always reads as "1 new". Only the most
 * recently updated room is shown (legacy overwrites, doesn't accumulate
 * across rooms); thread rooms (containing "/") are ignored. Clicking
 * navigates to the room and clears the count.
 */
const AvisosBanner = () => {
  const countersRef = useRef({});
  const [state, setState] = useState({ room: null, nuevos: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleAviso = (data) => {
      if (!data?.room || data.room.includes("/") || !data.entry) {
        return;
      }
      const room = data.room.replace(/collection:/, "");
      const entryId = Number(data.entry.ID);
      if (countersRef.current[room] === undefined) {
        countersRef.current[room] = entryId - 1;
      }
      const nuevos = entryId - countersRef.current[room];
      setState({ room, nuevos });
    };

    return onAviso(handleAviso);
  }, []);

  const closeAndGo = useCallback(() => {
    setState((current) => ({ ...current, nuevos: 0 }));
    if (state.room) {
      navigate(`/${state.room}`);
    }
  }, [navigate, state.room]);

  if (!state.nuevos) {
    return null;
  }

  return (
    <div
      className="avisos-main"
      onClick={closeAndGo}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && closeAndGo()}
    >
      <span>
        {state.nuevos} nuevo{state.nuevos > 1 ? "s" : ""} grito
        {state.nuevos > 1 ? "s" : ""} en #{state.room}
      </span>
    </div>
  );
};

export default AvisosBanner;
