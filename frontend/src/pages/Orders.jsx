import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import OrderLinesPanel from "../components/orders/OrderLinesPanel";
import ProductsPanel from "../components/orders/ProductsPanel";

export default function Orders() {
  const user = useAuthStore((s) => s.user);
  const authChecked = useAuthStore((s) => s.authChecked);

  // 1) Don’t decide yet — we're still asking the backend /api/me
  if (!authChecked) {
    return (
      <div className="h-full p-4 bg-bg text-fg">
        <div className="h-[calc(100vh-140px)] rounded-xl border border-zinc-800 bg-bg p-4">
          Checking session...
        </div>
      </div>
    );
  }

  // 2) Now we can safely redirect if truly not logged in
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="h-full p-4 bg-bg text-fg">
      <div className="h-[calc(100vh-140px)] flex gap-4">
        <div className="w-2/5 h-full">
          <OrderLinesPanel />
        </div>
        <div className="w-3/5 h-full">
          <ProductsPanel />
        </div>
      </div>
    </div>
  );
}
