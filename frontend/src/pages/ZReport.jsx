import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Navigate } from "react-router-dom";

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function ZReport() {
  const user = useAuthStore((s) => s.user);
  const authChecked = useAuthStore((s) => s.authChecked);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const loadReport = async (s = startDate, e = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (s) params.set("start_date", s);
      if (e) params.set("end_date", e);
      const res = await fetch(`/api/reports/z?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to load report");
        setLoading(false);
        return;
      }
      setReport(data);
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
    <div className="max-w-4xl mx-auto">
      <div className="border border-zinc-800 rounded-xl p-4 bg-bg">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Z Report</div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            Print
          </button>
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

        {report && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-zinc-800 rounded-lg p-3">
              <div className="text-sm font-medium">Summary</div>
              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Orders</span>
                  <span>{report.totals.orders_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${formatMoney(report.totals.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid</span>
                  <span>${formatMoney(report.totals.paid_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change Given</span>
                  <span>${formatMoney(report.totals.change_cents)}</span>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg p-3">
              <div className="text-sm font-medium">Payments</div>
              <div className="mt-2 text-sm space-y-1">
                {report.payments_by_method.length === 0 ? (
                  <div className="text-zinc-500">No payments in range.</div>
                ) : (
                  report.payments_by_method.map((p) => (
                    <div key={p.method} className="flex justify-between">
                      <span>{p.method}</span>
                      <span>${formatMoney(p.amount_cents)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
