import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, getCurrentUser } from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("knowra_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("knowra_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("knowra_token");
      if (storedToken) {
        try {
          const res = await getCurrentUser();
          const fetchedUser = res?.data?.user || res?.data;
          if (fetchedUser && fetchedUser._id) {
            setUser(fetchedUser);
            localStorage.setItem("knowra_user", JSON.stringify(fetchedUser));
          }
        } catch (err) {
          console.error("Auth verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res?.data?.accessToken && res?.data?.user) {
      localStorage.setItem("knowra_token", res.data.accessToken);
      localStorage.setItem("knowra_user", JSON.stringify(res.data.user));
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res?.message || "Login failed");
  };

  const register = async (fullNameOrData, username, email, password) => {
    let payload = {};
    if (typeof fullNameOrData === "object" && fullNameOrData !== null) {
      payload = fullNameOrData;
    } else if (password !== undefined) {
      payload = { fullName: fullNameOrData, username, email, password };
    } else {
      // Fallback if called as register(username, email, password)
      payload = { fullName: fullNameOrData, username: fullNameOrData, email: username, password: email };
    }

    const res = await registerUser(payload);
    // Attempt auto-login after registration
    try {
      return await login(payload.email, payload.password);
    } catch {
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem("knowra_token");
    localStorage.removeItem("knowra_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

