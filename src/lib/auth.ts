// =============================================================
// src/lib/auth.ts — Centralized auth utilities for the frontend
// All token storage/retrieval MUST go through this module.
// =============================================================

const TOKEN_KEY = 'naree_token';
const USER_KEY = 'naree_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
  phone?: string;
  lastLogin?: string;
}

/** Returns the stored JWT token or null */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Persists the JWT token */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/** Returns the stored user object or null */
export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Persists the user object */
export function setUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Clears all auth state (call on logout) */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Returns true if a token is present */
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

/** Role hierarchy helpers */
export function hasRole(user: AuthUser | null, ...roles: AuthUser['role'][]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function canWrite(user: AuthUser | null): boolean {
  return hasRole(user, 'SUPER_ADMIN', 'ADMIN', 'OPERATOR');
}

export function canAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'SUPER_ADMIN', 'ADMIN');
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'SUPER_ADMIN');
}
