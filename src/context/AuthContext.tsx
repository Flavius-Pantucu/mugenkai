"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LoginSchema, ProfileSettingsSchema, RegisterSchema, type LoginInput, type ProfileSettingsInput, type RegisterInput, type UserProfile } from "@/data/schema";
import { api, setRemote } from "@/lib/api";
import { clearLocalList, syncListWithAccount } from "@/lib/list";
import { clearLocalProgress, syncProgressWithAccount } from "@/lib/progress";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True once /api/auth/me answered; false = demo mode (no database configured). */
  backend: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileSettingsInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo mode only: any credentials sign in as this user.
const DEMO_USER: UserProfile = {
  id: "demo",
  username: "ShadowBlade99",
  email: "shadow@mugenkai.dev",
  avatarUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-2fhDFPCuMNiz.jpg",
  bio: "Just a wanderer seeking the next great story.",
  role: "ADMIN",
  matureContent: false,
  notifications: true,
};

const fakeLatency = () => new Promise((r) => setTimeout(r, 600));

/**
 * After signing in to a real backend: merge this browser's progress and list into the account.
 * Runs in the background; the UI already reads the browser store, which these calls refresh when they land.
 */
function adoptAccount() {
  setRemote(true);
  void Promise.all([syncProgressWithAccount(), syncListWithAccount()]).catch((err) => console.warn("account sync failed", err));
}

type Me = { backend: boolean; user: UserProfile | null };
// Started once per page load; sign-in waits for it so it never takes the demo path before the backend answered.
let mePromise: Promise<Me> | undefined;
const loadMe = () => (mePromise ??= api<Me>("/api/auth/me").catch((err) => {
  console.warn("session check failed", err);
  return { backend: false, user: null };
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [backend, setBackend] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    void loadMe().then((me) => {
      setBackend(me.backend);
      setUser(me.user);
      if (me.backend && me.user) adoptAccount();
    });
  }, []);

  const signIn = useCallback(
    async (path: string, body: unknown, demo: () => UserProfile) => {
      setLoading(true);
      try {
        if (!(await loadMe()).backend) {
          await fakeLatency();
          setUser(demo());
          return;
        }
        const { user: u } = await api<{ user: UserProfile }>(path, { body });
        setUser(u);
        adoptAccount();
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const login = useCallback(
    (input: LoginInput) => signIn("/api/auth/login", LoginSchema.parse(input), () => DEMO_USER),
    [signIn],
  );

  const register = useCallback(
    (input: RegisterInput) => {
      const valid = RegisterSchema.parse(input);
      return signIn("/api/auth/register", valid, () => ({ ...DEMO_USER, username: valid.username, email: valid.email }));
    },
    [signIn],
  );

  const logout = useCallback(async () => {
    if (backend) {
      await api("/api/auth/logout", { body: {} }).catch(() => {});
      setRemote(false);
      clearLocalProgress(); // the next person on this device shouldn't see this account's history
      clearLocalList();
    }
    setUser(null);
  }, [backend]);

  const updateProfile = useCallback(
    async (input: ProfileSettingsInput) => {
      const valid = ProfileSettingsSchema.parse(input);
      if (!backend) {
        setUser((u) => (u ? { ...u, ...valid } : u));
        return;
      }
      const { user: u } = await api<{ user: UserProfile }>("/api/me", { method: "PATCH", body: valid });
      setUser(u);
    },
    [backend],
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, backend, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
