import { useOrderStore } from "../../stores/orderStore";
import OrderLine from "./OrderLine";

export default function OrderLinesPanel() {
  const lines = useOrderStore((s) => s.lines);
  const totals = useOrderStore((s) => s.totals);

  const { subtotal, qty } = totals();
  console.log(lines, subtotal, qty);

  return (
    <section className="h-full bg-bg text-fg rounded-xl border border-zinc-800 p-4">
      <h2 className="text-lg font-semibold">Order</h2>

      <div className="mt-2 text-sm text-zinc-400">
        Items: {qty} • Subtotal: ${subtotal.toFixed(2)}
      </div>

      <div className="mt-4 space-y-2">
        {lines.length === 0 ? (
          <p className="text-sm text-zinc-500">No items yet.</p>
        ) : (
          lines.map((l) => <OrderLine key={l.productId} line={l} />)
        )}
      </div>
    </section>
  );
}
