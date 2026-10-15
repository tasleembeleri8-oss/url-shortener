
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      return setError("Please enter your username and password.");
    }

    if (isSignup && username.trim().length < 3) {
      return setError("Username must be at least 3 characters.");
    }

    if (isSignup && password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    setLoading(true);

    try {
      await (isSignup ? signup : login)(username.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left branding panel */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#101124] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12">
        <div className="pointer-events-none absolute -right-28 top-24 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <Link to="/login" className="relative z-10 flex w-fit items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold shadow-lg shadow-violet-600/30">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight">Shortly</span>
        </Link>

        <div className="relative z-10 mx-auto w-full max-w-lg py-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-violet-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            YOUR LINKS, SIMPLIFIED
          </div>

          <h1 className="text-5xl font-bold leading-[1.15] tracking-tight xl:text-6xl">
            Less URL.
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              More impact.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-8 text-slate-400">
            Create shorter links, share them anywhere, and understand how
            people engage with your content.
          </p>

          {/* Decorative link preview */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs text-slate-500">Link preview</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-xs text-slate-500">YOUR SHORT LINK</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-violet-300">
                  shortly / aB12xY
                </span>
                <span className="rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-200">
                  Ready to share ↗
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-slate-400">Total links</p>
                <p className="mt-2 text-2xl font-bold">12</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-slate-400">Total clicks</p>
                <p className="mt-2 text-2xl font-bold">248</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Illustrative preview · not live account data
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          Shorter links. Clearer insights. Built with care.
        </p>
      </section>

      {/* Right authentication panel */}
      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:justify-center lg:px-12 xl:px-20">
        <Link
          to="/login"
          className="flex w-fit items-center gap-3 lg:hidden"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold text-white">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Shortly
          </span>
        </Link>

        <div className="mx-auto my-auto w-full max-w-md py-10 lg:my-0 lg:py-0">
          <div className="mb-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-700 ring-1 ring-violet-100">
              {isSignup ? "✦" : "↗"}
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
              {isSignup ? "GET STARTED" : "WELCOME BACK"}
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {isSignup ? "Create your account" : "Sign in to Shortly"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isSignup
                ? "Create an account and start managing your links."
                : "Your links and insights are waiting for you."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <span className="text-xs text-slate-400">
                  {isSignup ? "8+ characters" : ""}
                </span>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  placeholder={
                    isSignup ? "Create a strong password" : "Enter your password"
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 rounded-r-xl px-4 text-xs font-semibold text-slate-500 transition hover:text-violet-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                <span className="font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
              {!loading && (
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">YOUR WORKSPACE</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-500">
            {isSignup ? "Already have an account?" : "New to Shortly?"}{" "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="font-semibold text-violet-700 transition hover:text-violet-800 hover:underline"
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>

          <p className="mt-10 text-center text-xs leading-6 text-slate-400">
            By continuing, you agree to use Shortly responsibly.
          </p>
        </div>
      </section>
    </div>
  );
}
