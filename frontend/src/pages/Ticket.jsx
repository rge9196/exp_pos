import { useEffect } from "react";
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

      <div className="ticket border border-zinc-800 rounded-xl p-4 bg-bg">
        <div className="text-center text-sm font-semibold">POS Receipt</div>
        <div className="text-center text-xs text-zinc-400">
          Order #{order?.id}
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
    </div>
  );
}
