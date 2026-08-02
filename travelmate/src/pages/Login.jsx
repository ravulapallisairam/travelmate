import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="glass rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold text-center mb-6">Welcome Back</h1>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required placeholder="Email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700"
          />
          <input
            type="password" required placeholder="Password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700"
          />
          <button type="submit" className="btn-primary w-full">Log In</button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-500">
          Don't have an account? <Link to="/register" className="text-sky-500 font-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
}