import React, { useEffect, useRef, useState } from "react";
import { Ghost, Primary } from "../ui/Btn";

export default function PasswordModal({
  open,
  onClose,
  passwordProtected,
  onSetPassword,
}) {
  const [show, setShow] = useState(false);
  const [passInp, setPassInp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setShow(true);
    setPassInp("");           // reset tiap dibuka
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e) => e.key === "Escape" && onClose?.();
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

  const onBackdrop = (e) => {
    if (e.currentTarget === e.target) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-pass-title"
    >
      {/* Overlay */}
      <div className={`absolute inset-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity ${show ? "opacity-100" : "opacity-0"}`} />

      {/* Panel */}
      <div
        className={`relative z-20 w-full max-w-sm transition-all duration-200 ${show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-violet-400/40 to-fuchsia-500/40 shadow-2xl shadow-black/40">
          <div className="rounded-2xl bg-zinc-900/90 text-white border border-white/10">
            <div className="p-5 md:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300">
                  {/* lock icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <h3 id="set-pass-title" className="font-semibold text-lg leading-tight">
                    Set Password Album
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Password diminta saat halaman <b>unlisted/public</b> dibuka.
                    Kosongkan lalu simpan untuk menghapus password.
                  </p>
                </div>
              </div>

              {/* Input + floating label + toggle */}
              <div className="relative">
                <input
                  ref={inputRef}
                  value={passInp}
                  onChange={(e) => setPassInp(e.target.value)}
                  placeholder=" "
                  type={showPass ? "text" : "password"}
                  className={[
                    "peer w-full rounded-xl bg-white/5 text-white placeholder-transparent",
                    "border border-white/10 focus:border-violet-400/40 outline-none transition-all duration-200",
                    "pl-3 pr-16 pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                  ].join(" ")}
                  autoComplete="new-password"
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
                  {passwordProtected ? "Ganti password" : "Set password"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-[0.8rem] transition-all duration-200 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 peer-focus:top-[1.05rem] peer-[&:not(:placeholder-shown)]:top-[1.05rem]"
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!passwordProtected) return onClose?.();
                    if (!confirm("Hapus password album?")) return;
                    await onSetPassword?.("");
                    onClose?.();
                  }}
                  className={[
                    "px-3 py-2 rounded-lg border text-sm transition",
                    passwordProtected
                      ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
                      : "border-white/10 text-zinc-500 cursor-not-allowed",
                  ].join(" ")}
                  disabled={!passwordProtected}
                  title={passwordProtected ? "Hapus password" : "Tidak ada password"}
                >
                  Hapus Password
                </button>

                <div className="flex gap-2">
                  <Ghost
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 transition"
                  >
                    Batal
                  </Ghost>
                  <Primary
                    type="button"
                    onClick={async () => {
                      await onSetPassword?.(passInp.trim()); // "" juga = hapus
                      onClose?.();
                    }}
                    className=""
                  >
                    Simpan
                  </Primary>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
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
