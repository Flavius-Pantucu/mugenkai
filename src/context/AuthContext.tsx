"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { mockUser } from "@/data/mock-data";
import { LoginSchema, RegisterSchema, UserProfileSchema, type LoginInput, type RegisterInput, type UserProfile } from "@/data/schema";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fakeLatency = () => new Promise((r) => setTimeout(r, 800));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: false });

  // Inputs are re-validated here: this is the boundary the real API will replace.
  const login = useCallback(async (input: LoginInput) => {
    LoginSchema.parse(input);
    setState((s) => ({ ...s, isLoading: true }));
    await fakeLatency();
    setState({ user: mockUser, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { username, email } = RegisterSchema.parse(input);
    setState((s) => ({ ...s, isLoading: true }));
    await fakeLatency();
    setState({ user: UserProfileSchema.parse({ ...mockUser, username, email }), isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => setState({ user: null, isAuthenticated: false, isLoading: false }), []);

  return <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
