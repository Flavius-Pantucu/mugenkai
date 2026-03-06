import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { animeList } from "../data/mock-data";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await register(email, password, username);
      navigate("/home");
    } catch {
      setError("Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center relative overflow-hidden py-12">
      <div className="absolute inset-0">
        <img src={animeList[4].bannerImage} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm" />
      </div>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-white" style={{ fontSize: "16px", fontWeight: 800 }}>M</span>
          </div>
          <span
            className="text-white tracking-wider"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "22px", fontWeight: 700 }}
          >
            MUGENKAI
          </span>
        </Link>

        <div className="bg-[#0f0f14]/80 backdrop-blur-xl border border-purple-500/10 rounded-2xl p-8 shadow-2xl shadow-purple-500/5">
          <h1
            className="text-white text-center mb-2"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "24px", fontWeight: 700 }}
          >
            Create Account
          </h1>
          <p className="text-zinc-500 text-center mb-8" style={{ fontSize: "14px" }}>
            Start your anime & manga adventure
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all pr-12"
                  style={{ fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 mt-0.5 rounded bg-[#14141f] border-purple-500/20 accent-purple-500" />
                <span className="text-zinc-500" style={{ fontSize: "13px", fontWeight: 400 }}>
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontSize: "15px", fontWeight: 600 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-zinc-500" style={{ fontSize: "14px" }}>
            Already have an account?{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors" style={{ fontWeight: 500 }}>
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
