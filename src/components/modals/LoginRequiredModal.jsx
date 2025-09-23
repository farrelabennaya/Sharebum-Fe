import React, { useEffect, useRef, useState } from "react";
import { Ghost, Primary } from "../ui/Btn";

export default function LoginRequiredModal({ open, onClose, loginHref = "/" }) {
  const [show, setShow] = useState(false);
  const loginRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setShow(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => loginRef.current?.focus(), 0);
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      setShow(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (e.currentTarget === e.target) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-need-title"
    >
      {/* overlay */}
      <div
        className={`absolute inset-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* panel */}
      <div
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
                    id="login-need-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    Login diperlukan
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Silakan login untuk memberi like atau berkomentar.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Ghost
                  type="button"
                  onClick={onClose}
                  className="hover:bg-white/5"
                  //px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 transition
                >
                  Batal
                </Ghost>
                <Primary
                  ref={loginRef}
                  href={loginHref}
                  className="inline-flex items-center gap-2
                             "
                >
                  {/* arrow icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Login
                </Primary>
              </div>
            </div>
          </div>
        </div>

        {/* close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full
                     bg-zinc-900/80 text-zinc-300 border border-white/10 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Tutup"
        >
          ×
        </button>
      </div>
    </div>
  );
}
