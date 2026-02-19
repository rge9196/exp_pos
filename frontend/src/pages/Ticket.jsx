import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrderStore } from "../stores/orderStore";

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function Ticket() {
  const navigate = useNavigate();
  const { id } = useParams();

  const lastOrder = useOrderStore((s) => s.lastOrder);
  const clearLastOrder = useOrderStore((s) => s.clearLastOrder);

  const [actionError, setActionError] = useState(null);
  const [voiding, setVoiding] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPayments, setRefundPayments] = useState([]);

  useEffect(() => {
    if (!lastOrder) return;
  }, [lastOrder]);

  if (!lastOrder) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-zinc-800 rounded-xl p-4 bg-bg">
          <div className="text-lg font-semibold">Ticket</div>
          <p className="mt-2 text-sm text-zinc-400">
            No order loaded. #{id}
          </p>
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

  const order = lastOrder;
  const lines = order?.lines ?? [];
  const payments = order?.payments ?? [];

  const handleFinish = () => {
    clearLastOrder();
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3 no-print">
        <div className="text-lg font-semibold">Ticket</div>
        <div className="flex items-center gap-2">
          {order?.status === "paid" && (
            <button
              type="button"
              onClick={() => {
                setRefundPayments(
                  (order?.payments ?? []).map((p) => ({
                    payment_method_id: p.methodId,
                    amount_cents: Math.abs(p.amountCents),
                    methodName: p.methodName,
                  })),
                );
                setRefundOpen(true);
              }}
              className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
            >
              Refund
            </button>
          )}
          {order?.status === "paid" && (
            <button
              type="button"
              onClick={async () => {
                const reason = window.prompt("Void reason (optional):") || "";
                setVoiding(true);
                setActionError(null);
                try {
                  const res = await fetch(`/api/orders/${order.id}/void`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ reason }),
                  });
                  const data = await res.json().catch(() => null);
                  if (!res.ok) {
                    setActionError(data?.error || "Failed to void");
                  } else {
                    useOrderStore.getState().setLastOrder({
                      ...order,
                      status: "void",
                      voided_at: data?.order?.voided_at,
                      void_reason: data?.order?.void_reason,
                    });
                  }
                } catch {
                  setActionError("Network error");
                }
                setVoiding(false);
              }}
              className="px-3 py-2 rounded bg-red-600 hover:bg-red-500"
              disabled={voiding}
            >
              {voiding ? "Voiding..." : "Void"}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
          >
            Finish
          </button>
        </div>
      </div>
      {actionError && <div className="mb-2 text-sm text-red-400">{actionError}</div>}

      <div className="ticket border border-zinc-800 rounded-xl p-4 bg-bg">
        <div className="text-center text-sm font-semibold">POS Receipt</div>
        <div className="text-center text-xs text-zinc-400">
          Order #{order?.id} {order?.status ? `(${order.status})` : ""}
        </div>
        <div className="mt-2 text-xs text-zinc-400 text-center">
          {order?.createdAt}
        </div>

        <div className="mt-3 border-t border-dashed border-zinc-700" />

        <div className="mt-2 space-y-1 text-sm">
          {lines.map((l) => (
            <div key={l.id} className="flex justify-between">
              <div className="min-w-0">
                <div className="truncate">{l.name}</div>
                <div className="text-xs text-zinc-500">
                  {l.qty} × ${formatMoney(l.unitPriceCents)}
                </div>
                {l.comment && (
                  <div className="text-xs text-zinc-500 italic truncate">
                    “{l.comment}”
                  </div>
                )}
              </div>
              <div>${formatMoney(l.lineTotalCents)}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-dashed border-zinc-700" />

        <div className="mt-2 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${formatMoney(order?.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Paid</span>
            <span>${formatMoney(order?.totalPaidCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change</span>
            <span>${formatMoney(order?.changeCents)}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-dashed border-zinc-700" />

        <div className="mt-2 text-sm space-y-1">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{p.methodName}</span>
              <span>${formatMoney(p.amountCents)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">Thank you</div>
      </div>

      {refundOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-[360px]">
            <div className="text-sm font-medium">Full Refund</div>
            <div className="mt-2 text-xs text-zinc-400">
              Refund must match subtotal.
            </div>

            <div className="mt-3 space-y-2">
              {refundPayments.map((p, i) => (
                <div key={`${p.payment_method_id}-${i}`} className="flex items-center justify-between">
                  <span className="text-sm">{p.methodName}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={(p.amount_cents / 100).toFixed(2)}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (!Number.isFinite(num) || num < 0) return;
                      const next = [...refundPayments];
                      next[i] = { ...next[i], amount_cents: Math.round(num * 100) };
                      setRefundPayments(next);
                    }}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-right"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRefunding(true);
                  setActionError(null);
                  try {
                    const res = await fetch(`/api/orders/${order.id}/refund`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        payments: refundPayments.map((p) => ({
                          payment_method_id: p.payment_method_id,
                          amount_cents: p.amount_cents,
                        })),
                      }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok) {
                      setActionError(data?.error || "Refund failed");
                    } else {
                      setRefundOpen(false);
                    }
                  } catch {
                    setActionError("Network error");
                  }
                  setRefunding(false);
                }}
                className="px-3 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                disabled={refunding}
              >
                {refunding ? "Refunding..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
