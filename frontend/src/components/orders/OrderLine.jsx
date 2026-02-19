import { useState } from "react";
import { useOrderStore } from "../../stores/orderStore";
import { MessageSquare, Trash2, Plus, Minus } from "lucide-react";

export default function OrderLine({ line }) {
  const removeOne = useOrderStore((s) => s.removeOne);
  const incrementById = useOrderStore((s) => s.incrementById);
  const deleteLine = useOrderStore((s) => s.deleteLine);

  const setLinePrice = useOrderStore((s) => s.setLinePrice);
  const setLineComment = useOrderStore((s) => s.setLineComment);

  // ----- Price modal state
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState(line.priceCents / 100);

  const openPrice = () => {
    setTempPrice(line.priceCents / 100);
    setIsPriceOpen(true);
  };
  const closePrice = () => setIsPriceOpen(false);
  const savePrice = () => {
    const num = Number(tempPrice);
    if (!Number.isFinite(num) || num < 0) return;
    const cents = Math.round(num * 100);
    setLinePrice(line.productId, cents);
    closePrice();
  };

  // ----- Comment modal state
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [tempComment, setTempComment] = useState(line.comment ?? "");

  const openComment = () => {
    setTempComment(line.comment ?? "");
    setIsCommentOpen(true);
  };
  const closeComment = () => setIsCommentOpen(false);
  const saveComment = () => {
    setLineComment(line.productId, tempComment);
    closeComment();
  };

  const priceChanged = line.priceCents !== line.listPriceCents;

  return (
    <div className="relative flex items-center justify-between border border-zinc-800 rounded-lg p-2">
      {/* DELETE (top-right) */}
      <button
        onClick={() => deleteLine(line.productId)}
        className="absolute top-1 right-1 text-zinc-500 hover:text-red-400"
        aria-label="Delete line"
        type="button"
      >
        <Trash2 size={14} />
      </button>

      {/* LEFT: INFO */}
      <div className="min-w-0 pr-6">
        <div className="truncate font-medium">{line.name}</div>

        {/* qty × price + comment button */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>
            {line.qty} ×{" "}
            <button
              onClick={openPrice}
              className="underline decoration-dotted hover:text-white"
              aria-label="Edit price"
              type="button"
            >
              ${(line.priceCents / 100).toFixed(2)}
            </button>
          </span>

          {/* comment button */}
          <button
            onClick={openComment}
            className={`p-1 rounded hover:bg-zinc-800 ${
              line.comment
                ? "text-emerald-400"
                : "text-zinc-400 hover:text-white"
            }`}
            aria-label="Add comment"
            type="button"
          >
            <MessageSquare size={14} />
          </button>
        </div>

        {line.comment && (
          <div className="mt-1 text-xs text-zinc-400 italic truncate">
            “{line.comment}”
          </div>
        )}
      </div>

      {/* RIGHT: +/- and total */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => removeOne(line.productId)}
          className="h-5 w-5 flex items-center justify-center border border-zinc-700 rounded hover:bg-zinc-800"
          aria-label="Decrease qty"
          type="button"
        >
          <Minus size={12} />
        </button>

        <span className="w-6 text-center text-sm">{line.qty}</span>

        <button
          onClick={() => incrementById(line.productId)}
          className="h-5 w-5 flex items-center justify-center border border-zinc-700 rounded hover:bg-zinc-800"
          aria-label="Increase qty"
          type="button"
        >
          <Plus size={12} />
        </button>

        {/* highlighted total when price changed */}
        <div
          className={`ml-1 text-sm transition-colors ${
            priceChanged
              ? "text-emerald-400 font-medium drop-shadow-[0_0_6px_rgba(52,211,153,0.35)]"
              : "text-white"
          }`}
        >
          ${(line.lineTotalCents / 100).toFixed(2)}
        </div>
      </div>

      {/* PRICE MODAL */}
      {isPriceOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-64">
            <h3 className="text-sm font-medium mb-2">Edit Price</h3>

            <input
              type="number"
              step="0.01"
              min="0"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") savePrice();
                if (e.key === "Escape") closePrice();
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closePrice}
                className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={savePrice}
                className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENT MODAL */}
      {isCommentOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-72">
            <h3 className="text-sm font-medium mb-2">Comment</h3>

            <input
              type="text"
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveComment();
                if (e.key === "Escape") closeComment();
              }}
              placeholder="e.g. Happy birthday Aunt Jemima"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closeComment}
                className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={saveComment}
                className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500"
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
