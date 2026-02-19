import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Navigate } from "react-router-dom";

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function ProductReport() {
  const user = useAuthStore((s) => s.user);
  const authChecked = useAuthStore((s) => s.authChecked);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const loadReport = async (s = startDate, e = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (s) params.set("start_date", s);
      if (e) params.set("end_date", e);
      const res = await fetch(`/api/reports/products?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to load report");
        setLoading(false);
        return;
      }
      setRows(data?.rows ?? []);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReport(today, today);
  }, []);

  if (!authChecked) {
    return (
      <div className="h-full p-4 bg-bg text-fg">
        <div className="h-[calc(100vh-140px)] rounded-xl border border-zinc-800 bg-bg p-4">
          Checking session...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="border border-zinc-800 rounded-xl p-4 bg-bg">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Product Sales Report</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-zinc-400">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-zinc-400">End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => loadReport()}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
          >
            Run Report
          </button>
        </div>

        {loading && <div className="mt-3 text-sm text-zinc-400">Loading…</div>}
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

        <div className="mt-4 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 text-xs text-zinc-400 bg-zinc-900 px-3 py-2">
            <div>Product</div>
            <div className="text-right">Price</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Total</div>
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-3 text-sm text-zinc-500">No sales in range.</div>
          ) : (
            rows.map((r, idx) => (
              <div
                key={`${r.product_id}-${r.unit_price_cents}-${idx}`}
                className="grid grid-cols-4 px-3 py-2 border-t border-zinc-800 text-sm"
              >
                <div className="truncate">{r.name}</div>
                <div className="text-right">${formatMoney(r.unit_price_cents)}</div>
                <div className="text-right">{r.qty}</div>
                <div className="text-right">${formatMoney(r.total_cents)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
