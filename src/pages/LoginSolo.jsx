import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../lib/api.js';

export default function LoginSolo({ embedded = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await apiPost('/api/auth/login', { email, password });
      localStorage.setItem('token', res.token);
      nav('/dashboard');
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const Card = (
    <div className={[
      "relative mx-0 w-full",
      "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
      "shadow-2xl shadow-black/40"
    ].join(" ")}>
      <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
        {/* ... isi form sama seperti sebelumnya ... */}
      </form>
    </div>
  );

  if (embedded) {
    // hanya kartu, no full-screen wrapper, no blobs
    return Card;
  }

  return (
    <div className="relative min-h-svh flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
      {/* animated soft blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse delay-1000" />

      {/* card */}
      <div
        className={[
          "relative mx-4 w-full max-w-md",
          "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
          "shadow-2xl shadow-black/40"
        ].join(" ")}
       >
        {/* focus ring accent */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />

        <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Masuk</h1>
            <p className="text-sm text-zinc-300/80">
              Akses dashboard kamu. Smooth, clean, no drama. ✨
            </p>
          </div>

          {err && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {/* mail icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-3 py-3",
                "text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40",
                "outline-none transition-all duration-200",
                err ? "ring-1 ring-red-500/40" : "focus:ring-1 focus:ring-violet-400/30"
              ].join(" ")}
              autoComplete="email"
            />
            <label
              htmlFor="email"
              className={[
                "pointer-events-none absolute left-10 text-zinc-400 transition-all duration-200",
                "top-1/2 -translate-y-1/2",
                "peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-zinc-300",
                email ? "top-2 -translate-y-0 text-xs text-zinc-300" : ""
              ].join(" ")}
            >
              Email
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {/* lock icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-12 py-3",
                "text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40",
                "outline-none transition-all duration-200",
                err ? "ring-1 ring-red-500/40" : "focus:ring-1 focus:ring-violet-400/30"
              ].join(" ")}
              autoComplete="current-password"
            />
            <label
              htmlFor="password"
              className={[
                "pointer-events-none absolute left-10 text-zinc-400 transition-all duration-200",
                "top-1/2 -translate-y-1/2",
                "peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-zinc-300",
                password ? "top-2 -translate-y-0 text-xs text-zinc-300" : ""
              ].join(" ")}
            >
              Password
            </label>

            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition"
              aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 select-none text-zinc-300">
              <input type="checkbox" className="size-4 rounded border-white/20 bg-white/5" />
              Ingat saya
            </label>
            <Link to="/forgot" className="text-zinc-300 hover:text-white underline underline-offset-4">
              Lupa password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={[
              "group relative w-full overflow-hidden rounded-xl px-4 py-3",
              "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
              "shadow-lg shadow-fuchsia-900/30",
              "transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            ].join(" ")}
          >
            {/* subtle sheen */}
            <span className="pointer-events-none absolute inset-0 translate-y-[-100%] bg-gradient-to-b from-white/20 to-transparent opacity-0 transition group-hover:opacity-100 group-hover:translate-y-0" />
            <span className="inline-flex items-center justify-center gap-2 font-medium">
              {loading && (
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3"></path>
                </svg>
              )}
              {loading ? 'Memproses…' : 'Masuk'}
            </span>
          </button>

          {/* Footer */}
          <p className="text-sm text-zinc-400 text-center">
            Belum punya akun?{' '}
            <Link to="/register" className="text-white underline underline-offset-4 hover:opacity-90">
              Bikin di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
