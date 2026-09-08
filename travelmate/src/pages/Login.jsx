import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";


export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue planning your next trip.">
      {location.state?.registered && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm px-4 py-3 mb-6 animate-banner"
        >
          <span>✅</span> Account created successfully. Please log in.
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 text-sm px-4 py-3 mb-6 animate-banner"
        >
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-5 ${shake ? "animate-shake" : ""}`} noValidate>
        <div className="animate-stagger" style={{ animationDelay: "60ms" }}>
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all duration-200"
          />
        </div>

        <div className="animate-stagger" style={{ animationDelay: "120ms" }}>
          <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl px-4 py-3.5 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/35 hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 animate-stagger"
          style={{ animationDelay: "180ms" }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            "Log In"
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-8 text-gray-500 dark:text-gray-400 animate-stagger" style={{ animationDelay: "240ms" }}>
        Don't have an account?{" "}
        <Link to="/register" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
          Create one for free
        </Link>
      </p>
    </AuthLayout>
  );
}