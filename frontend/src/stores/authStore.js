import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,
  authChecked: false,

  me: async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        set({ user: null, authChecked: true });
        return { ok: false, status: res.status, data };
      }

      set({ user: data?.user ?? null, authChecked: true });
      return { ok: true, status: res.status, data };
    } catch {
      set({ user: null, authChecked: true });
      return { ok: false, status: 0, data: null };
    }
  },

  register: async ({ username, password, confirmation }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, confirmation }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        set({ loading: false, error: data?.error || "Register failed" });
        return { ok: false, status: res.status, data };
      }

      set({ loading: false, error: null });
      await useAuthStore.getState().me();
      return { ok: true, status: res.status, data };
    } catch {
      set({ loading: false, error: "Network error" });
      return { ok: false, status: 0, data: null };
    }
  },

  login: async ({ username, password }) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        set({ loading: false, error: data?.error || "Login failed" });
        return { ok: false, status: res.status, data };
      }

      set({ loading: false, error: null });
      await useAuthStore.getState().me();
      return { ok: true, status: res.status, data };
    } catch {
      set({ loading: false, error: "Network error" });
      return { ok: false, status: 0, data: null };
    }
  },

  logout: async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    set({ user: null });
  },
}));
