import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import Ticket from "./pages/Ticket";

export default function App() {
  const me = useAuthStore((s) => s.me);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    me();
  }, [me]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-fg flex justify-center">
        <div className="w-full max-w-225 flex flex-col">
          <nav className="p-4 border-b border-zinc-800 flex items-center justify-between">
            {/* LEFT — Home always visible; Orders only when logged in */}
            <div className="flex items-center gap-4">
              <Link to="/">Home</Link>
              {user && <Link to="/orders">Orders</Link>}
            </div>

            {/* RIGHT — THIS PART CHANGED */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="font-mono text-sm">{user.username}</span>
                  <button
                    onClick={logout}
                    className="cursor-pointer hover:opacity-80"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                </>
              )}
            </div>
          </nav>

          <main className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/ticket/:id" element={<Ticket />} />
            </Routes>
          </main>

          <footer className="p-4 border-t border-zinc-800">FOOTER</footer>
        </div>
      </div>
    </BrowserRouter>
  );
}
