import { useState, useEffect, useCallback } from "react";
import { login, getAuthToken, clearAuthToken } from "../services/api";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const MAX_RETRIES = 5;

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    const token = getAuthToken();
    return {
      isAuthenticated: !!token,
      isLoading: !token,
      error: null,
    };
  });

  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await login("react@hipster-inc.com", "React@123", "07ba959153fe7eec778361bf42079439");
      retryCount = 0;
      setState({ isAuthenticated: true, isLoading: false, error: null });
      console.log("[Auth] Login successful");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      console.error("[Auth] Login failed", msg);
      retryCount += 1;
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(2000 * retryCount, 10000);
        console.log(`[Auth] Retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`);
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => signIn(), delay);
        setState({ isAuthenticated: false, isLoading: true, error: null });
      } else {
        setState({ isAuthenticated: false, isLoading: false, error: msg });
      }
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      signIn();
    }
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };
  }, []);

  const signOut = useCallback(() => {
    clearAuthToken();
    retryCount = 0;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    setState({ isAuthenticated: false, isLoading: false, error: null });
  }, []);

  return { ...state, signIn, signOut };
}
