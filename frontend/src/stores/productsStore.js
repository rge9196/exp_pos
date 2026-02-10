import { create } from "zustand";

export const useProductsStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  loadProducts: async ({ force = false } = {}) => {
    if (get().loaded && !force) return { ok: true, cached: true };

    set({ loading: true, error: null });

    try {
      const res = await fetch("/api/products", { credentials: "include" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        set({
          items: [],
          loading: false,
          error: data?.error || "Failed to load products",
          loaded: false,
        });
        return { ok: false, status: res.status, data };
      }

      set({
        items: data?.products ?? [],
        loading: false,
        error: null,
        loaded: true,
      });

      return { ok: true, status: res.status, data };
    } catch {
      set({
        items: [],
        loading: false,
        error: "Network error",
        loaded: false,
      });
      return { ok: false, status: 0, data: null };
    }
  },
}));
