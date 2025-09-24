// src/pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api.js";
import useGoogleId from "../hooks/useGoogleId.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function validateLogin({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = "Email wajib diisi.";
  else if (!EMAIL_RE.test(email)) errors.email = "Format email tidak valid.";
  if (!password) errors.password = "Password wajib diisi.";
  return errors;
}

export default function Login({ embedded = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrs, setFieldErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const nav = useNavigate();

  // === GOOGLE LOGIN SETUP ===
  const googleBtnRef = useRef(null);
  const { ready, renderButton } = useGoogleId({
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    onCredential: async (idToken) => {
      setErr(null);
      setGLoading(true);
      try {
        // Kirim ID Token ke backend untuk diverifikasi
        const res = await apiPost("/api/auth/google", { id_token: idToken });
        // backend membalas token app-mu
        if (res?.token) {
          localStorage.setItem("token", res.token);
          nav("/dashboard");
        } else {
          throw new Error("Login Google gagal: token tidak ditemukan.");
        }
      } catch (e) {
        setErr(
          e?.status === 401
            ? "Login Google ditolak."
            : String(e?.message || "Gagal login Google")
        );
      } finally {
        setGLoading(false);
      }
    },
  });

  useEffect(() => {
    if (ready && googleBtnRef.current) {
      renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "left",
        width: "100%", // penting biar area klik/DOM pas
      });
    }
  }, [ready, renderButton]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    const fe = validateLogin({ email, password });
    setFieldErrs(fe);
    if (Object.keys(fe).length) {
      setErr("Periksa kembali data yang diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost("/api/auth/login", { email, password });
      localStorage.setItem("token", res.token);
      nav("/dashboard");
    } catch (e) {
      if (e?.status === 401) setErr("Email atau password salah.");
      else if (e?.status === 422 && e?.data?.errors) {
        setFieldErrs(e.data.errors || {});
        setErr("Periksa kembali data yang diisi.");
      } else setErr(String(e?.message || e || "Gagal masuk"));
    } finally {
      setLoading(false);
    }
  }

  const Card = (
    <div
      className={[
        "relative mx-0 w-full",
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-2xl shadow-black/40",
      ].join(" ")}
    >
      <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6" noValidate>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Masuk
          </h1>
          <p className="text-sm text-zinc-300/80">Ayo login sekarang mantap.</p>
        </div>

        {err && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {err}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrs.email)
                  setFieldErrs((s) => ({ ...s, email: undefined }));
              }}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-3",
                "pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                "text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40",
                "outline-none transition-all duration-200",
                fieldErrs.email
                  ? "ring-1 ring-red-500/40"
                  : "focus:ring-1 focus:ring-violet-400/30",
              ].join(" ")}
              autoComplete="email"
              aria-invalid={!!fieldErrs.email}
              aria-describedby={fieldErrs.email ? "email-err" : undefined}
            />
            <span
              className={[
                "pointer-events-none absolute left-3 text-zinc-400 opacity-80",
                "top-[0.9rem] transition-all duration-200",
                "peer-focus:top-[1.15rem] peer-[&:not(:placeholder-shown)]:top-[1.15rem]",
              ].join(" ")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16v12H4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            <label
              htmlFor="email"
              className={[
                "pointer-events-none absolute left-10 transition-all duration-200",
                "top-2 -translate-y-0 text-xs text-zinc-300",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                "peer-focus:top-2 peer-focus:-translate-y-0",
                "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
              ].join(" ")}
            >
              Email
            </label>
          </div>
          {fieldErrs.email && (
            <p id="email-err" className="mt-1 text-xs text-red-400">
              {fieldErrs.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrs.password)
                  setFieldErrs((s) => ({ ...s, password: undefined }));
              }}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-16",
                "pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                "text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40",
                "outline-none transition-all duration-200",
                fieldErrs.password
                  ? "ring-1 ring-red-500/40"
                  : "focus:ring-1 focus:ring-violet-400/30",
              ].join(" ")}
              autoComplete="current-password"
              aria-invalid={!!fieldErrs.password}
              aria-describedby={fieldErrs.password ? "pass-err" : undefined}
            />
            <span
              className={[
                "pointer-events-none absolute left-3 text-zinc-400 opacity-80",
                "top-[0.9rem] transition-all duration-200",
                "peer-focus:top-[1.15rem] peer-[&:not(:placeholder-shown)]:top-[1.15rem]",
              ].join(" ")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect
                  x="5"
                  y="11"
                  width="14"
                  height="9"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 11V8a4 4 0 0 1 8 0v3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            <label
              htmlFor="password"
              className={[
                "pointer-events-none absolute left-10 transition-all duration-200",
                "top-2 -translate-y-0 text-xs text-zinc-300",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                "peer-focus:top-2 peer-focus:-translate-y-0",
                "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
              ].join(" ")}
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2 top-[0.8rem] transition-all duration-200 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 peer-focus:top-[1.05rem] peer-[&:not(:placeholder-shown)]:top-[1.05rem]"
              aria-label={
                showPass ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          {fieldErrs.password && (
            <p id="pass-err" className="text-xs text-red-400">
              {fieldErrs.password}
            </p>
          )}
        </div>

        {/* Options + Submit */}
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 select-none text-zinc-300">
            <input
              type="checkbox"
              className="size-4 rounded border-white/20 bg-white/5"
            />
            Ingat saya
          </label>
          <Link
            to="/forgot"
            className="text-zinc-300 hover:text-white underline underline-offset-4"
          >
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={[
            "group relative w-full overflow-hidden rounded-xl px-4 py-3",
            "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
            "shadow-lg shadow-fuchsia-900/30",
            "transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          <span className="pointer-events-none absolute inset-0 translate-y-[-100%] bg-gradient-to-b from-white/20 to-transparent opacity-0 transition group-hover:opacity-100 group-hover:translate-y-0" />
          <span className="inline-flex items-center justify-center gap-2 font-medium">
            {loading && (
              <svg
                className="size-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                ></circle>
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 0 1 8-8"
                  stroke="currentColor"
                  strokeWidth="3"
                ></path>
              </svg>
            )}
            {loading ? "Memproses…" : "Masuk"}
          </span>
        </button>

        {/* --- Separator + Google Button --- */}
        <div className="relative my-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1
                   text-[11px] font-medium text-zinc-300 backdrop-blur"
          >
            atau
          </span>
        </div>

        {/* Wrapper relatif: simpan tombol GIS tak terlihat + tombol custom terlihat */}
        <div className="relative">
          {/* 1) Tombol GIS (ID token) disembunyikan tapi tetap ada di DOM */}
          <div
            ref={googleBtnRef}
            className={[
              "absolute inset-0 opacity-0 pointer-events-none",
              // pastikan ukurannya full biar area kliknya sinkron kalau dibutuhkan
              "[&>div]:w-full [&>div>div]:w-full",
            ].join(" ")}
          />

          {/* 2) Tombol custom yang tampil — klik ini memicu klik tombol GIS */}
          <button
            type="button"
            onClick={() => {
              // cari elemen tombol dari GIS dan trigger click
              const btn =
                googleBtnRef.current?.querySelector('div[role="button"]') ||
                googleBtnRef.current?.firstElementChild;
              btn?.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );
            }}
            disabled={gLoading || !ready}
            className={[
              "w-full inline-flex items-center justify-center gap-3 rounded-xl px-4 py-3",
              "bg-zinc-900 hover:bg-zinc-800 border border-white/10",
              "text-zinc-100 text-sm transition",
              "shadow-lg shadow-black/20",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-[0.99]",
            ].join(" ")}
          >
            <span className="inline-grid place-items-center w-6 h-6 rounded-md bg-white">
              <img
                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
                alt=""
                className="w-4 h-4"
              />
            </span>
            <span className="font-medium">Login dengan Google</span>

            {gLoading && (
              <svg
                className="ml-auto size-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity=".25"
                />
                <path
                  d="M4 12a8 8 0 0 1 8-8"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
            )}
          </button>
        </div>

        <p className="text-sm text-zinc-400 text-center">
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="text-white underline underline-offset-4 hover:opacity-90"
          >
            Bikin di sini
          </Link>
        </p>
      </form>
    </div>
  );

  if (embedded) return Card;

  return (
    <div className="relative min-h-svh flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="mx-4 w-full max-w-md">{Card}</div>
    </div>
  );
}
