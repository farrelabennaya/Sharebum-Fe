// src/pages/Verified.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Verified() {
  const nav = useNavigate();

  // status: loading | success | error
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("Memverifikasi…");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("ok");
    const hasToken = !!p.get("token"); // kita abaikan token, jangan auto-login

    if (ok === "1") {
      // bersihkan token dari URL (privasi)
      const clean = new URL(window.location.href);
      clean.searchParams.delete("token");
      window.history.replaceState({}, "", clean.toString());

      setStatus("success");
      setMsg("Email kamu sudah terverifikasi. Silakan masuk untuk melanjutkan.");
    } else {
      setStatus("error");
      setMsg("Verifikasi gagal atau link kedaluwarsa.");
    }
  }, []);

  const Icon = useMemo(() => {
    if (status === "loading") {
      return (
        <div className="relative grid place-items-center w-16 h-16">
          <svg className="w-12 h-12 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
      );
    }
    if (status === "success") {
      return (
        <div className="relative grid place-items-center w-16 h-16">
          <span className="absolute inline-block w-16 h-16 rounded-full border border-emerald-400/30 animate-ping" />
          <div className="relative grid place-items-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/40">
            <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden>
              <path
                d="M20 7 9 18l-5-5"
                fill="none"
                stroke="rgb(52, 211, 153)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-path"
              />
            </svg>
          </div>
        </div>
      );
    }
    return (
      <div className="relative grid place-items-center w-16 h-16">
        <div className="relative grid place-items-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-400/40">
          <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(248, 113, 113)" strokeWidth="1.8" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="rgb(248, 113, 113)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }, [status]);

  return (
    <div className="min-h-svh grid place-items-center bg-black text-white">
      <div
        className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          {Icon}
          <div className="flex-1">
            <h1 className="text-xl font-semibold mb-1">
              {status === "loading" && "Memverifikasi"}
              {status === "success" && "Berhasil Diverifikasi"}
              {status === "error" && "Verifikasi Gagal"}
            </h1>
            <p className="text-zinc-300">{msg}</p>
          </div>
        </div>

        {/* Aksi lanjutan */}
        {status === "success" && (
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => nav("/")}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 transition"
            >
              Masuk
            </button>
            <button
              onClick={() => nav("/")}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Ke Halaman Login
            </button>
          </div>
        )}

        {status === "error" && (
          <>
            <form
              className="mt-5 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const email = new FormData(e.currentTarget).get("email");
                try {
                  const res = await fetch("/api/email/verification-notification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  if (!res.ok) throw new Error();
                  alert("Jika email terdaftar, tautan verifikasi dikirim ulang.");
                } catch {
                  alert("Gagal mengirim ulang.");
                }
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="Email kamu"
                required
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/15"
              />
              <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 transition">
                Kirim ulang
              </button>
            </form>

            <p className="mt-3 text-xs text-zinc-400">
              Pastikan kamu membuka tautan dari perangkat yang sama dan link belum kedaluwarsa.
            </p>
          </>
        )}
      </div>

      {/* CSS animasi check-path (stroke draw) */}
      <style>{`
        .check-path {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: draw 600ms ease forwards 120ms;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
