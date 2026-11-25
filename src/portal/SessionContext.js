import { createContext, useContext } from "react";

/** The session context object. The provider lives in SessionProvider.jsx so this module exports only values. */
export const SessionContext = createContext(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside SessionProvider.");
  }
  return value;
}
