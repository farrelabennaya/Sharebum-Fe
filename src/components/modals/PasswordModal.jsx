import React, { useEffect, useRef, useState } from "react";
import { Primary } from "../ui/Btn";

export default function PasswordModal({
  open,
  pass,
  onChange,
  onSubmit,
  onClose, // opsional: biar bisa tutup via ESC/klik luar
}) {
  const [show, setShow] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setShow(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      setShow(false);
      setShowPass(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (e.currentTarget === e.target) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pw-title"
    >
      {/* overlay */}
      <div
        className={`absolute inset-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* panel */}
      <form
        noValidate
        onSubmit={onSubmit}
        className={`relative z-20 w-full max-w-sm transition-all duration-200 ${
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-1"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-violet-400/40 to-fuchsia-500/40 shadow-2xl shadow-black/40">
          <div className="rounded-2xl bg-zinc-900/90 text-white border border-white/10">
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300">
                  {/* lock icon */}
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
                </div>
                <div>
                  <h3
                    id="pw-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    Masukkan password
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Diperlukan untuk membuka konten.
                  </p>
                </div>
              </div>

              {/* input + floating label + toggle */}
              <div className="relative">
                <input
                  ref={inputRef}
                  value={pass}
                  onChange={(e) => onChange?.(e.target.value)}
                  type={showPass ? "text" : "password"}
                  className={[
                    "peer w-full rounded-xl bg-white/5 text-white placeholder-transparent",
                    "border border-white/10 focus:border-violet-400/40 outline-none transition-all duration-200",
                    "pl-3 pr-16 pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                  ].join(" ")}
                  placeholder=" "
                  autoComplete="current-password"
                />
                <label
                  className={[
                    "pointer-events-none absolute left-3 transition-all duration-200",
                    "top-2 text-xs text-zinc-300",
                    "peer-placeholder-shown:top-[0.85rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
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

              {/* actions */}
              <div className="flex justify-end gap-2 pt-2">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 transition"
                  >
                    Batal
                  </button>
                )}
                <Primary
                  type="submit"
                  className=""
                  //inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/30 hover:opacity-95 transition
                >
                  Buka
                </Primary>
              </div>
            </div>
          </div>
        </div>

        {/* close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 border border-white/10 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Tutup"
          >
            ×
          </button>
        )}
      </form>
    </div>
  );
}
