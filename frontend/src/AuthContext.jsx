import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    const onLogout = () => setToken(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const saveToken = (t) => {
    localStorage.setItem("token", t);
    setToken(t);
  };

  const login = async (username, password) => {
    const data = await api.login(username, password);
    saveToken(data.access_token);
  };

  const signup = async (username, password) => {
    const data = await api.signup(username, password);
    saveToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);