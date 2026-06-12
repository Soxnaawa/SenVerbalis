import React, { createContext, useState, useEffect, useRef } from 'react';
import { api, setClientToken } from '../api/client';

export const AuthContext = createContext(null);

// Inactivity timeout of 15 minutes (conforms to JWT_EXPIRE_MINUTES=15)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const inactivityTimerRef = useRef(null);

  // Initialize and clear inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Only set timer if user is authenticated
    if (token) {
      inactivityTimerRef.current = setTimeout(() => {
        console.warn("Session expirée pour cause d'inactivité (15 minutes).");
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  // Event listeners to detect activity
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    if (token) {
      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      resetInactivityTimer();
    }

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [token]);

  // Handle API unauthorized event (401 interceptor)
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  // Check if token exists on load (e.g. from session memory)
  // For standard React SPA, we check profile on reload, but since token is in memory only,
  // reload will require re-login (standard behavior of this ZK project).
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const authData = await api.login(username, password);
      const jwtToken = authData.access_token;
      
      // Save in memory state
      setToken(jwtToken);
      setClientToken(jwtToken);

      // Fetch user profile
      const userProfile = await api.getMe();
      setUser(userProfile);
      setRole(userProfile.role);
      
      return userProfile;
    } catch (err) {
      setError(err.message || "Erreur de connexion.");
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch (e) {
      console.error("Logout API call error:", e);
    } finally {
      // Clear memory states
      setToken(null);
      setClientToken(null);
      setUser(null);
      setRole(null);
      
      // Clear timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Hard redirect to clear React state & cache completely (anti-XSS / session pollution)
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    role,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
