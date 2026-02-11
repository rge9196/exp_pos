import { useOrderStore } from "../../stores/orderStore";
import { useState } from "react";

export default function OrderLine({ line }) {
  const removeOne = useOrderStore((s) => s.removeOne);
  const incrementById = useOrderStore((s) => s.incrementById);
  const deleteLine = useOrderStore((s) => s.deleteLine);
  const setLinePrice = useOrderStore((s) => s.setLinePrice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState(line.price);

  const openModal = () => {
    setTempPrice(line.price);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSavePrice = () => {
    const num = Number(tempPrice);
    if (!Number.isFinite(num) || num < 0) return;
    setLinePrice(line.productId, num);
    closeModal();
  };

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
          {line.qty} ×{" "}
          <button
            onClick={openModal}
            className="underline decoration-dotted hover:text-white"
          >
            ${line.price.toFixed(2)}
          </button>
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

        <div
          className={`ml-1 text-sm transition-colors ${
            line.price !== line.listPrice
              ? "text-emerald-400 font-medium drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]"
              : "text-white"
          }`}
        >
          ${line.lineTotal.toFixed(2)}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-64">
            <h3 className="text-sm font-medium mb-2">Edit Price</h3>

            <input
              type="number"
              step="1"
              min="0"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePrice();
                if (e.key === "Escape") closeModal();
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700"
              >
                Cancel
              </button>

              <button
                onClick={handleSavePrice}
                className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
