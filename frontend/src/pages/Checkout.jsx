import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "../stores/orderStore";
import { usePaymentMethodsStore } from "../stores/paymentMethodsStore";

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function Checkout() {
  const navigate = useNavigate();

  const lines = useOrderStore((s) => s.lines);
  const totals = useOrderStore((s) => s.totals);
  const payments = useOrderStore((s) => s.payments);
  const addPaymentMethod = useOrderStore((s) => s.addPaymentMethod);
  const setPaymentAmount = useOrderStore((s) => s.setPaymentAmount);
  const removePayment = useOrderStore((s) => s.removePayment);
  const totalPaid = useOrderStore((s) => s.totalPaid);
  const clear = useOrderStore((s) => s.clear);
  const clearPayments = useOrderStore((s) => s.clearPayments);
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  const methods = usePaymentMethodsStore((s) => s.items);
  const methodsLoading = usePaymentMethodsStore((s) => s.loading);
  const methodsError = usePaymentMethodsStore((s) => s.error);
  const loadPaymentMethods = usePaymentMethodsStore((s) => s.loadPaymentMethods);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [amountInputs, setAmountInputs] = useState({});

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  useEffect(() => {
    setAmountInputs((prev) => {
      const next = { ...prev };
      payments.forEach((p) => {
        if (next[p.id] === undefined) {
          next[p.id] = (p.amountCents / 100).toFixed(2);
        }
      });
      return next;
    });
  }, [payments]);

  const { subtotal, qty } = totals();
  const paid = totalPaid();
  const change = Math.max(0, paid - subtotal);
  const due = Math.max(0, subtotal - paid);

  const hasLines = lines.length > 0;

  const methodIdsInUse = useMemo(
    () => new Set(payments.map((p) => p.methodId)),
    [payments],
  );

  const handleAddMethod = (method) => {
    if (methodIdsInUse.has(method.id)) return;
    addPaymentMethod(method);
  };

  const openSummary = () => {
    setSubmitError(null);
    if (!hasLines) {
      setSubmitError("No items in the order.");
      return;
    }
    if (payments.length === 0 || paid <= 0) {
      setSubmitError("Add at least one payment.");
      return;
    }
    if (paid < subtotal) {
      setSubmitError("Payment must cover the subtotal.");
      return;
    }
    setSummaryOpen(true);
  };

  const submitOrder = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lines, payments }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitError(data?.error || "Checkout failed");
        setSubmitting(false);
        return;
      }

      setLastOrder(data?.order ?? null);
      clear();
      clearPayments();
      setSummaryOpen(false);
      navigate(`/ticket/${data?.order?.id ?? ""}`);
    } catch {
      setSubmitError("Network error");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  if (!hasLines) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="border border-zinc-800 rounded-xl p-4 bg-bg">
          <div className="text-lg font-semibold">Checkout</div>
          <p className="mt-2 text-sm text-zinc-400">No items to checkout.</p>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="mt-4 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="border border-zinc-800 rounded-xl p-4 bg-bg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Checkout</div>
            <div className="text-xs text-zinc-400">Items: {qty}</div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Back
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="border border-zinc-800 rounded-lg p-3">
            <div className="text-sm font-medium">Order Lines</div>
            <div className="mt-2 space-y-2">
          {lines.map((l) => (
            <div
              key={l.productId}
              className="flex items-center justify-between border border-zinc-800 rounded-md p-2"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{l.name}</div>
                <div className="text-xs text-zinc-400">
                  {l.qty} × ${formatMoney(l.priceCents)}
                </div>
                {l.comment && (
                  <div className="text-xs text-zinc-500 italic truncate">
                    “{l.comment}”
                  </div>
                )}
              </div>
              <div className="text-sm">${formatMoney(l.lineTotalCents)}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="font-medium">${formatMoney(subtotal)}</span>
        </div>
      </section>

          <section className="border border-zinc-800 rounded-lg p-3 flex flex-col">
            <div className="text-sm font-medium">Payments</div>

            {methodsLoading && (
              <div className="mt-2 text-xs text-zinc-400">Loading methods…</div>
            )}
            {methodsError && (
              <div className="mt-2 text-xs text-red-400">{methodsError}</div>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAddMethod(m)}
                  disabled={methodIdsInUse.has(m.id)}
                  className="px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
                >
                  Add {m.name}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {payments.length === 0 ? (
                <div className="text-xs text-zinc-500">No payments yet.</div>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border border-zinc-800 rounded-md p-2"
                  >
                    <div className="text-sm font-medium">{p.methodName}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={amountInputs[p.id] ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          setAmountInputs((prev) => ({ ...prev, [p.id]: raw }));
                          if (raw === "") {
                            setPaymentAmount(p.id, 0);
                            return;
                          }
                          const num = Number(raw);
                          if (!Number.isFinite(num) || num < 0) return;
                          setPaymentAmount(p.id, Math.round(num * 100));
                        }}
                        onBlur={() => {
                          const raw = (amountInputs[p.id] ?? "").trim();
                          const num = Number(raw);
                          if (!Number.isFinite(num) || num < 0) return;
                          setAmountInputs((prev) => ({
                            ...prev,
                            [p.id]: num.toFixed(2),
                          }));
                        }}
                        className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePayment(p.id)}
                        className="px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto pt-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Paid</span>
                <span>${formatMoney(paid)}</span>
              </div>
              {paid < subtotal && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Remaining</span>
                  <span>${formatMoney(due)}</span>
                </div>
              )}
              {paid > subtotal && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Change</span>
                  <span className="text-emerald-400">${formatMoney(change)}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {submitError && (
          <div className="mt-3 text-sm text-red-400">{submitError}</div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Back
          </button>
          <button
            type="button"
            onClick={openSummary}
            disabled={paid < subtotal}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
          >
            OK
          </button>
        </div>
      </div>

      {summaryOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-[360px]">
            <div className="text-sm font-medium">Confirm Payment</div>

            <div className="mt-2 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span>${formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Paid</span>
                <span>${formatMoney(paid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Change</span>
                <span>${formatMoney(change)}</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-zinc-400">Payments</div>
            <div className="mt-1 space-y-1">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.methodName}</span>
                  <span>${formatMoney(p.amountCents)}</span>
                </div>
              ))}
            </div>

            {submitError && (
              <div className="mt-2 text-xs text-red-400">{submitError}</div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700"
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={submitOrder}
                className="px-3 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
