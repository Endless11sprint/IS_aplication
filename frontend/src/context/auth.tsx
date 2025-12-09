import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface UserBrief { id?: string; name?: string; avatarUrl?: string; }
export interface AuthContextValue {
  user: UserBrief | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn(profile: UserBrief): void | Promise<void>;
  signOut(): void | Promise<void>;
  update(patch: Partial<UserBrief>): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "rb:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user, loading]);

  const signIn = (profile: UserBrief) => setUser(profile);
  const signOut = () => setUser(null);
  const update = (p: Partial<UserBrief>) => setUser((u) => ({ ...(u ?? {}), ...p }));

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, loading, signIn, signOut, update }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}