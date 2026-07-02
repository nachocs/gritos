import { createContext, useCallback, useState } from "react";

export const GlobalContext = createContext({
  currentForo: "foroscomun",
  currentMessage: null,
  isGallery: false,
  isVotaciones: false,
  setCurrentForo: () => {},
  setCurrentMessage: () => {},
  setIsGallery: () => {},
  setIsVotaciones: () => {},
  changeForo: () => {},
});

export const GlobalProvider = ({ children }) => {
  const [currentForo, setCurrentForo] = useState("foroscomun");
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isGallery, setIsGallery] = useState(false);
  const [isVotaciones, setIsVotaciones] = useState(false);

  const changeForo = useCallback((foro, msg, gallery, votaciones) => {
    setCurrentForo(foro);
    setCurrentMessage(msg);
    setIsGallery(gallery || false);
    setIsVotaciones(votaciones || false);
  }, []);

  const value = {
    currentForo,
    currentMessage,
    isGallery,
    isVotaciones,
    setCurrentForo,
    setCurrentMessage,
    setIsGallery,
    setIsVotaciones,
    changeForo,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
