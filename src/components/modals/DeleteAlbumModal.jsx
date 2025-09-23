import React, { useEffect, useRef, useState } from "react";
import { Btn, Danger, Ghost } from "../ui/Btn";

export default function DeleteAlbumModal({
  open,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [show, setShow] = useState(false);
  const [ack, setAck] = useState(false);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setShow(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      setShow(false);
      setAck(false); // reset hanya ketika modal benar2 ditutup
    };
  }, [open]);

  if (!open) return null;
  const canDelete = ack && !busy;

  function onBackdrop(e) {
    if (e.currentTarget === e.target && !busy) onCancel?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onMouseDown={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-md transition-all duration-200 ${
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-1"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
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
                    id="delete-title"
                    className="font-semibold text-lg leading-tight"
                  >
                    Hapus album?
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Semua halaman & foto akan dipindah ke folder{" "}
                    <code className="text-zinc-200">trash/</code> di R2. Jika
                    ada Lifecycle Rule, objek akan dipurge otomatis setelah
                    beberapa hari.
                  </p>
                </div>
              </div>

              {/* Konfirmasi */}
              <label className="flex items-start gap-3 text-sm text-zinc-200 select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-white/20 bg-white/5"
                  checked={ack}
                  disabled={busy}
                  onChange={(e) => setAck(e.target.checked)}
                />
                <span>Saya paham konsekuensinya dan ingin melanjutkan.</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Ghost
                  ref={cancelRef}
                  onClick={onCancel}
                  disabled={busy}
                  className="hover:bg-white/5 disabled:opacity-60"
                >
                  Batal
                </Ghost>
                <Danger
                  onClick={onConfirm}
                  disabled={!canDelete} // contoh: !selectedCount
                  loading={busy} // tampilkan spinner + ubah teks
                  loadingText="Menghapus…"
                >
                  Hapus
                </Danger>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol close */}
        <button
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
