import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return { label: "", pct: 0, color: "bg-gray-300" };
    if (p.length < 6) return { label: "Too short", pct: 20, color: "bg-red-500" };
    if (p.length < 8) return { label: "Weak", pct: 45, color: "bg-orange-500" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && p.length >= 10) return { label: "Strong", pct: 100, color: "bg-emerald-500" };
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) return { label: "Good", pct: 70, color: "bg-sky-500" };
    return { label: "Fair", pct: 55, color: "bg-yellow-500" };
  };
  const strength = passwordStrength();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start planning smarter, AI-powered trips today.">
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
          <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Full name
          </label>
          <input
            id="name"
            required
            autoComplete="name"
            placeholder="e.g. Alex Carter"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all duration-200"
          />
        </div>

        <div className="animate-stagger" style={{ animationDelay: "120ms" }}>
          <label htmlFor="reg-email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Email address
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all duration-200"
          />
        </div>

        <div className="animate-stagger" style={{ animationDelay: "180ms" }}>
          <label htmlFor="reg-password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl px-4 py-3.5 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="h-4 mt-2">
            {form.password && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ease-out ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{strength.label}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/35 hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 animate-stagger"
          style={{ animationDelay: "240ms" }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-8 text-gray-500 dark:text-gray-400 animate-stagger" style={{ animationDelay: "300ms" }}>
        Already have an account?{" "}
        <Link to="/login" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}