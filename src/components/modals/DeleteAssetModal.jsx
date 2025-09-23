import React, { useEffect, useRef, useState } from "react";
import { Btn, Danger, Ghost } from "../ui/Btn";

export default function DeleteAssetModal({
  askDelAsset,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const open = !!askDelAsset;
  const [show, setShow] = useState(false);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setShow(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // fokus awal ke tombol Batal
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      setShow(false);
    };
  }, [open]);

  // ESC untuk tutup
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel?.();
      if ((e.key === "Enter" || e.key === "NumpadEnter") && !busy)
        onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel, onConfirm]);

  if (!open) return null;

  function onBackdrop(e) {
    if (e.currentTarget === e.target && !busy) onCancel?.();
  }

  const url = askDelAsset?.url;
  const caption = askDelAsset?.caption || "Tanpa caption";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-asset-title"
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
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-red-400/40 to-red-600/40 shadow-2xl shadow-black/40">
          <div className="rounded-2xl bg-zinc-900/90 text-white border border-white/10">
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 border border-red-400/30 text-red-300">
                  {/* trash icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7h16"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    id="del-asset-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    Hapus foto?
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Foto akan dihapus dari album. Tindakan ini tidak bisa
                    dibatalkan.
                  </p>
                </div>
              </div>

              {/* preview */}
              <div className="flex items-center gap-3">
                {url ? (
                  <img
                    src={url}
                    alt={caption}
                    className="size-16 rounded-lg border border-white/10 object-cover bg-white/5"
                    onError={(e) => {
                      e.currentTarget.style.opacity = 0.3;
                    }}
                  />
                ) : (
                  <div className="size-16 rounded-lg border border-white/10 bg-white/5" />
                )}
                <div className="text-sm text-zinc-300 line-clamp-2">
                  {caption}
                </div>
              </div>

              {/* actions */}
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
                  onClick={onConfirm}
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

        {/* close button */}
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
