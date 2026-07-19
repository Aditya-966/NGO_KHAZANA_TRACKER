import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { role: 'CENTRAL' } | { role: 'BRANCH', branch: {...} }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ngo_token");
    const rawSession = localStorage.getItem("ngo_session");
    if (token && rawSession) {
      try {
        setSession(JSON.parse(rawSession));
      } catch {
        localStorage.removeItem("ngo_token");
        localStorage.removeItem("ngo_session");
      }
    }
    setReady(true);
  }, []);

  function login(token, sessionData) {
    localStorage.setItem("ngo_token", token);
    localStorage.setItem("ngo_session", JSON.stringify(sessionData));
    setSession(sessionData);
  }

  function logout() {
    localStorage.removeItem("ngo_token");
    localStorage.removeItem("ngo_session");
    setSession(null);
  }

  return <AuthContext.Provider value={{ session, login, logout, ready }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
