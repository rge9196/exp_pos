export default function ProductCard({ product, onAdd }) {
  return (
    <button
      type="button"
      onClick={() => onAdd?.(product)}
      className="w-full bg-bg text-fg rounded-xl border border-zinc-800 hover:border-zinc-600 transition"
    >
      <div className="flex flex-col items-center text-center gap-1">
        {/* IMAGE (little square) */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-20 w-20 rounded-lg object-cover border border-zinc-800"
          loading="lazy"
        />

        {/* NAME */}
        <div className="font-medium truncate w-full">
          {product.name}
        </div>

        {/* PRICE */}
        <div className="text-sm text-zinc-400">
          ${Number(product.listPrice).toFixed(2)}
        </div>
      </div>
    </button>
  );
}
