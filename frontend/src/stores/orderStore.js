import { create } from "zustand";

export const useOrderStore = create((set, get) => ({
  lines: [], // [{ productId, name, price, qty, lineTotal, imageUrl, category, alias }]

  addProduct: (p) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.productId === p.id);

    if (existing) {
      const next = lines.map((l) =>
        l.productId === p.id
          ? {
              ...l,
              qty: l.qty + 1,
              lineTotal: (l.qty + 1) * l.price, // uses SALE price
            }
          : l,
      );
      set({ lines: next });
      return;
    }

    const listPrice = Number(p.listPrice);

    set({
      lines: [
        ...lines,
        {
          productId: p.id,
          name: p.name,
          alias: p.alias,
          category: p.category,
          imageUrl: p.imageUrl,

          listPrice, // ORIGINAL
          price: listPrice, // SALE (editable)

          qty: 1,
          comment: "",

          lineTotal: listPrice,
        },
      ],
    });
  },

  removeOne: (productId) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.productId === productId);
    if (!existing) return;

    if (existing.qty <= 1) {
      set({ lines: lines.filter((l) => l.productId !== productId) });
      return;
    }

    set({
      lines: lines.map((l) =>
        l.productId === productId
          ? { ...l, qty: l.qty - 1, lineTotal: (l.qty - 1) * l.price }
          : l,
      ),
    });
  },

  clear: () => set({ lines: [] }),

  totals: () => {
    const subtotal = get().lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const qty = get().lines.reduce((sum, l) => sum + l.qty, 0);
    return { subtotal, qty };
  },

  setLinePrice: (productId, newPrice) => {
    const price = Number(newPrice);
    if (!Number.isFinite(price) || price < 0) return;

    set({
      lines: get().lines.map((l) =>
        l.productId === productId
          ? { ...l, price, lineTotal: l.qty * price }
          : l,
      ),
    });
  },

  setLineComment: (productId, comment) => {
    set({
      lines: get().lines.map((l) =>
        l.productId === productId ? { ...l, comment } : l,
      ),
    });
  },

  incrementById: (productId) => {
    const line = get().lines.find((l) => l.productId === productId);
    if (!line) return;

    set({
      lines: get().lines.map((l) =>
        l.productId === productId
          ? {
              ...l,
              qty: l.qty + 1,
              lineTotal: (l.qty + 1) * l.price,
            }
          : l,
      ),
    });
  },

  deleteLine: (productId) => {
    set({
      lines: get().lines.filter((l) => l.productId !== productId),
    });
  },
}));
