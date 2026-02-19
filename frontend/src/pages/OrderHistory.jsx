import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Navigate, useNavigate } from "react-router-dom";

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function OrderHistory() {
  const user = useAuthStore((s) => s.user);
  const authChecked = useAuthStore((s) => s.authChecked);
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);

  const loadOrders = async (s = startDate, e = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (s) params.set("start_date", s);
      if (e) params.set("end_date", e);
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/orders?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to load orders");
        setLoading(false);
        return;
      }
      setOrders(data?.orders ?? []);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders(today, today);
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
        <div className="text-lg font-semibold">Order History</div>

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
          <div className="flex flex-col">
            <label className="text-xs text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-zinc-400">Search</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order # or username"
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => loadOrders()}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
          >
            Run
          </button>
        </div>

        {loading && <div className="mt-3 text-sm text-zinc-400">Loading…</div>}
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right tabular-nums">Subtotal</th>
                <th className="px-3 py-2 text-right tabular-nums">Paid</th>
                <th className="px-3 py-2 text-right">Cashier</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-3 text-sm text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="underline-offset-2 hover:underline"
                      >
                        #{o.id}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {o.created_at?.slice(11, 16)}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {o.status || "paid"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${formatMoney(o.subtotal_cents)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${formatMoney(o.total_paid_cents)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {o.user?.username || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
