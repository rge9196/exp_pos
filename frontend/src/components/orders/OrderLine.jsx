import { useOrderStore } from "../../stores/orderStore";

export default function OrderLine({ line }) {
  const removeOne = useOrderStore((s) => s.removeOne);
  const incrementById = useOrderStore((s) => s.incrementById);
  const deleteLine = useOrderStore((s) => s.deleteLine);

  return (
    <div className="relative flex items-center justify-between border border-zinc-800 rounded-lg p-2">
      {/* DELETE X (top-right) */}
      <button
        onClick={() => deleteLine(line.productId)}
        className="absolute top-1 right-1 text-xs text-zinc-500 hover:text-red-400"
      >
        ×
      </button>

      {/* LEFT: INFO */}
      <div className="min-w-0 pr-6">
        <div className="truncate font-medium">{line.name}</div>

        <div className="text-xs text-zinc-500">
          {line.qty} × ${line.price.toFixed(2)}
          {line.price !== line.listPrice && (
            <span className="ml-2 line-through">
              ${line.listPrice.toFixed(2)}
            </span>
          )}
        </div>

        {line.comment && (
          <div className="mt-1 text-xs text-zinc-400 italic">
            “{line.comment}”
          </div>
        )}
      </div>

      {/* RIGHT: +/- and total */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => removeOne(line.productId)}
          className="h-4 w-4 flex items-center justify-center border border-zinc-700 rounded text-sm hover:bg-zinc-800"
        >
          −
        </button>

        <span className="w-6 text-center text-sm">{line.qty}</span>

        <button
          onClick={() => incrementById(line.productId)}
          className="h-4 w-4 flex items-center justify-center border border-zinc-700 rounded text-sm hover:bg-zinc-800"
        >
          +
        </button>

        <div className="ml-1 text-sm">${line.lineTotal.toFixed(2)}</div>
      </div>
    </div>
  );
}
