import { useEffect } from "react";
import { useProductsStore } from "../../stores/productsStore";
import { useOrderStore } from "../../stores/orderStore";
import ProductCard from "./ProductCard";

export default function ProductsPanel() {
  const items = useProductsStore((s) => s.items);
  const loading = useProductsStore((s) => s.loading);
  const error = useProductsStore((s) => s.error);
  const loadProducts = useProductsStore((s) => s.loadProducts);
  const addProduct = useOrderStore((s) => s.addProduct);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAdd = (p) => {
    console.log("ADD", p);
    addProduct(p);
  };

  return (
    <section className="h-full bg-bg text-fg rounded-xl border border-zinc-800 p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-zinc-400">Loading…</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-1 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </section>
  );
}
