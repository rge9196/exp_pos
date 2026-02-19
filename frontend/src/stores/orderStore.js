import { create } from "zustand";

export const useOrderStore = create((set, get) => ({
  lines: [], // [{ productId, name, priceCents, qty, lineTotalCents, imageUrl, category, alias }]
  payments: [], // [{ id, methodId, methodName, amountCents }]
  lastOrder: null,

  addProduct: (p) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.productId === p.id);

    if (existing) {
      const next = lines.map((l) =>
        l.productId === p.id
          ? {
              ...l,
              qty: l.qty + 1,
              lineTotalCents: (l.qty + 1) * l.priceCents,
            }
          : l,
      );
      set({ lines: next });
      return;
    }

    const listPriceCents = Math.round(Number(p.listPrice) * 100);

    set({
      lines: [
        ...lines,
        {
          productId: p.id,
          name: p.name,
          alias: p.alias,
          category: p.category,
          imageUrl: p.imageUrl,

          listPriceCents,
          priceCents: listPriceCents,

          qty: 1,
          comment: "",

          lineTotalCents: listPriceCents,
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
          ? { ...l, qty: l.qty - 1, lineTotalCents: (l.qty - 1) * l.priceCents }
          : l,
      ),
    });
  },

  clear: () => set({ lines: [] }),

  totals: () => {
    const subtotal = get().lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
    const qty = get().lines.reduce((sum, l) => sum + l.qty, 0);
    return { subtotal, qty };
  },

  setLinePrice: (productId, newPriceCents) => {
    const price = Number(newPriceCents);
    if (!Number.isFinite(price) || price < 0) return;

    set({
      lines: get().lines.map((l) =>
        l.productId === productId
          ? { ...l, priceCents: price, lineTotalCents: l.qty * price }
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
              lineTotalCents: (l.qty + 1) * l.priceCents,
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

  clearPayments: () => set({ payments: [] }),

  addPaymentMethod: (method) => {
    const payments = get().payments;
    const id = crypto.randomUUID();
    set({
      payments: [
        ...payments,
        {
          id,
          methodId: method.id,
          methodName: method.name,
          amountCents: 0,
        },
      ],
    });
  },

  setPaymentAmount: (paymentId, amountCents) => {
    const num = Number(amountCents);
    if (!Number.isFinite(num) || num < 0) return;
    set({
      payments: get().payments.map((p) =>
        p.id === paymentId ? { ...p, amountCents: num } : p,
      ),
    });
  },

  removePayment: (paymentId) => {
    set({ payments: get().payments.filter((p) => p.id !== paymentId) });
  },

  totalPaid: () => {
    return get().payments.reduce((sum, p) => sum + p.amountCents, 0);
  },

  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
