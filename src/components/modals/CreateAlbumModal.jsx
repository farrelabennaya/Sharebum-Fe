import React, { useEffect, useRef, useState } from "react";
import { Btn, Ghost, Primary } from "../ui/Btn";

export default function CreateAlbumModal({
  open,
  newTitle,
  setNewTitle,
  onCreate,
  onClose,
}) {
  const [show, setShow] = useState(false);
  const inputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // entry animation + fokus awal + lock scroll
    setShow(true);
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const canSubmit = newTitle.trim().length > 0;

  function handleBackdrop(e) {
    // klik backdrop → tutup
    if (e.currentTarget === e.target) onClose?.();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose?.();
    if (e.key === "Enter" && canSubmit) onCreate?.();
  }

  async function handleCreate() {
    if (submitting || !canSubmit) return;
    try {
      setSubmitting(true);
      // asumsi onCreate mengembalikan Promise
      await onCreate();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onMouseDown={handleBackdrop}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-album-title"
    >
      {/* Overlay */}
      <div
        className={[
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
          show ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* Panel */}
      <div
        className={[
          "relative w-full max-w-md",
          "transition-all duration-200",
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-1",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()} // cegah bubbling ke backdrop
      >
        {/* gradient hairline + glass card */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-violet-400/40 to-fuchsia-500/40 shadow-2xl shadow-black/40">
          <div className="rounded-2xl bg-zinc-900/90 text-white backdrop-blur-xl border border-white/10">
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-400/20">
                  {/* small icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-violet-300"
                  >
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="14"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3 14l4-4 5 5 3-3 6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    id="create-album-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    Buat Album
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Kasih judul yang jelas biar gampang dicari nanti.
                  </p>
                </div>
              </div>

              {/* Input: floating label */}
              <div className="relative">
                <input
                  ref={inputRef}
                  className={[
                    "peer w-full rounded-xl bg-white/5 text-white placeholder-transparent",
                    "border border-white/10 focus:border-violet-400/40 outline-none transition-all duration-200",
                    "pl-3 pr-16 pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                  ].join(" ")}
                  placeholder=" "
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={120}
                />
                <label
                  className={[
                    "pointer-events-none absolute left-3 transition-all duration-200",
                    "top-2 text-xs text-zinc-300",
                    "peer-placeholder-shown:top-[0.85rem] peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                    "peer-focus:top-2 peer-focus:-translate-y-0",
                    "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
                  ].join(" ")}
                >
                  Judul album
                </label>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                  {/* <span>
                    {newTitle.trim().length < 3
                      ? "Minimal 3 karakter"
                      : "\u00A0"}
                  </span> */}
                  <span></span>
                  <span>{newTitle.length}/120</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Ghost onClick={onClose} className="hover:bg-white/5">
                  Batal
                </Ghost>

                <Primary
                  onClick={handleCreate}
                  disabled={!canSubmit || submitting}
                  aria-busy={submitting}
                  className="disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
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
                      Membuat…
                    </>
                  ) : (
                    "Buat"
                  )}
                </Primary>
              </div>
            </div>
          </div>
        </div>

        {/* close X (opsional) */}
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 border border-white/10 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Tutup"
        >
          ×
        </button>
      </div>
    </div>
  );
}
