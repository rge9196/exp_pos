import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const navigate = useNavigate();   // <-- NEW

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await register({ username, password, confirmation });

    console.log("REGISTER RESULT:", result);

    if (result.ok) {
      // BABY STEP: redirect to home
      navigate("/");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl mb-4">Register</h1>

      {error ? (
        <div className="mb-3 border border-red-700 p-2 text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-transparent border border-zinc-800 p-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent border border-zinc-800 p-2"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="bg-transparent border border-zinc-800 p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 mt-2 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
