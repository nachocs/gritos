import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import { useForm } from "./useContexts";

/**
 * Hook to replace legacy Util.checkForms logic.
 * Prevents navigation if the user has unsaved changes in the form.
 */
const useNavGuard = () => {
  const { isDirty } = useForm();

  // React Router v6 blocker
  const blocker = useBlocker(
    ({ currentValue, nextLocation }) =>
      isDirty && currentValue.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const proceed = window.confirm(
        "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?",
      );
      if (proceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
};

export default useNavGuard;
