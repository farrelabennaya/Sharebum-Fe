import React, { useEffect, useRef, useState } from "react";
import { Btn, Danger, Ghost } from "../ui/Btn";

export default function DeletePageModal({
  pageId,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const open = !!pageId;
  const [show, setShow] = useState(false);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setShow(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel?.();
      if ((e.key === "Enter" || e.key === "NumpadEnter") && !busy)
        onConfirm?.(pageId);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      setShow(false);
    };
  }, [open, busy, onCancel, onConfirm, pageId]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (e.currentTarget === e.target && !busy) onCancel?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-page-title"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`relative z-20 w-full max-w-md transition-all duration-200 ${
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-1"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-red-400/40 to-red-600/40 shadow-2xl shadow-black/40">
          <div className="rounded-2xl bg-zinc-900/90 text-white border border-white/10">
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 border border-red-400/30 text-red-300">
                  {/* danger icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8v6m0 3.5h.01"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 3 2.7 20.5a1.2 1.2 0 0 0 1.05 1.8h16.5a1.2 1.2 0 0 0 1.05-1.8L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    id="del-page-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    Hapus page ini?
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Semua foto di page ini akan dipindah ke folder{" "}
                    <code className="text-zinc-200">trash/</code> di R2.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Ghost
                  ref={cancelRef}
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="hover:bg-white/5 disabled:opacity-60"
                >
                  Batal
                </Ghost>
                <Danger
                  type="button"
                  onClick={() => onConfirm?.(pageId)}
                  disabled={busy} // contoh: !selectedCount
                  loading={busy} // tampilkan spinner + ubah teks
                  loadingText="Menghapus…"
                >
                  Hapus
                </Danger>
              </div>
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 border border-white/10 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
          aria-label="Tutup"
        >
          ×
        </button>
      </div>
    </div>
  );
}
