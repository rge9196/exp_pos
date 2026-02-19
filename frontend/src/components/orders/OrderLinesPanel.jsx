import { useOrderStore } from "../../stores/orderStore";
import OrderLine from "./OrderLine";
import { useNavigate } from "react-router-dom";

export default function OrderLinesPanel() {
  const lines = useOrderStore((s) => s.lines);
  const totals = useOrderStore((s) => s.totals);
  const navigate = useNavigate();

  const { subtotal, qty } = totals();
  return (
    <section className="h-full bg-bg text-fg rounded-xl border border-zinc-800 p-4 flex flex-col">
      <h2 className="text-lg font-semibold">Order</h2>

      <div className="mt-2 text-sm text-zinc-400">
        Items: {qty} • Subtotal: ${(subtotal / 100).toFixed(2)}
      </div>

      <div className="mt-4 space-y-2">
        {lines.length === 0 ? (
          <p className="text-sm text-zinc-500">No items yet.</p>
        ) : (
          lines.map((l) => <OrderLine key={l.productId} line={l} />)
        )}
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => navigate("/checkout")}
          disabled={lines.length === 0}
          className="w-full bg-emerald-600 text-white p-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Checkout
        </button>
      </div>
    </section>
  );
}
