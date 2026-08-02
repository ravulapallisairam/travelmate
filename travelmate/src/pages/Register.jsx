import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="glass rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold text-center mb-6">Create Account</h1>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required placeholder="Full Name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700"
          />
          <input
            type="email" required placeholder="Email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700"
          />
          <input
            type="password" required placeholder="Password" minLength={6}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700"
          />
          <button type="submit" className="btn-primary w-full">Register</button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-500">
          Already have an account? <Link to="/login" className="text-sky-500 font-semibold">Log In</Link>
        </p>
      </div>
    </div>
  );
}