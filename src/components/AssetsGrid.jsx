import React, { useMemo, useState } from "react";
import { Card } from "./ui/Card";
import { apiPatch } from "../lib/api";
import DeleteSelectedModal from "./modals/DeleteSelectModal";

// helper
function makeOrderPayload(list) {
  return { order: Object.fromEntries(list.map((a, i) => [a.id, i])) };
}
function arrayMoveLocal(arr, from, to) {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export default function AssetsGrid_NoDrag({
  assets = [],
  albumId,
  pageId,
  filterActive = false,

  // pilih massal (tetep didukung)
  selectMode = false,
  selected,
  onToggleSelect,
  onToggleSelectMode,
  onClearSelect,
  onBulkDelete,

  // interaksi
  onOpenViewer,

  // sinkron UI
  onOptimisticReorder,
  onNeedRefresh,
}) {
  const [reorderMode, setReorderMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openDelSel, setOpenDelSel] = useState(false);
  const [busyDelSel, setBusyDelSel] = useState(false);

  const orderedAssets = useMemo(() => {
    const arr = [...assets];
    arr.sort((a, b) => {
      if (a.index != null && b.index != null) return a.index - b.index;
      const ad = a.created_at ? +new Date(a.created_at) : 0;
      const bd = b.created_at ? +new Date(b.created_at) : 0;
      return bd - ad;
    });
    return arr;
  }, [assets]);

  const ids = useMemo(
    () => orderedAssets.map((a) => String(a.id)),
    [orderedAssets]
  );
  const selectedCount = selected?.size || 0;

  async function persistReorder(nextList) {
    try {
      await apiPatch(
        `/api/pages/${pageId}/assets/reorder`,
        makeOrderPayload(nextList)
      );
    } catch {
      onNeedRefresh?.();
    }
  }

  function moveBy(id, delta) {
    if (filterActive) return;
    const from = ids.indexOf(String(id));
    if (from === -1) return;
    const to = Math.min(Math.max(from + delta, 0), ids.length - 1);
    if (to === from) return;
    const next = arrayMoveLocal(orderedAssets, from, to);
    onOptimisticReorder?.(next.map((a, i) => ({ ...a, index: i })));
    persistReorder(next);
  }

  function moveToIndex(id, targetIndexOneBased) {
    if (filterActive) return;
    const from = ids.indexOf(String(id));
    if (from === -1) return;
    let to = Number(targetIndexOneBased) - 1;
    if (!Number.isFinite(to)) return;
    to = Math.min(Math.max(to, 0), ids.length - 1);
    if (to === from) return;
    const next = arrayMoveLocal(orderedAssets, from, to);
    onOptimisticReorder?.(next.map((a, i) => ({ ...a, index: i })));
    persistReorder(next);
  }

  function askMoveTo(id) {
    if (filterActive) return;
    const current = ids.indexOf(String(id));
    const input = window.prompt(
      `Pindah ke posisi ke-berapa? (1 – ${ids.length})`,
      String(current + 1)
    );
    if (input == null) return;
    moveToIndex(id, parseInt(input, 10));
  }

  React.useEffect(() => {
    if (selectMode && reorderMode) setReorderMode(false);
  }, [selectMode, reorderMode]);

  React.useEffect(() => {
    if (filterActive && reorderMode) setReorderMode(false);
  }, [filterActive, reorderMode]);

  return (
    <>
      <Card>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Assets</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-600">
              {assets.length} foto
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Select Mode */}
            <button
              type="button"
              onClick={() => {
                // jika sedang reorder, matikan dulu
                if (reorderMode) setReorderMode(false);

                // toggle select (sesuai perilaku lama)
                onToggleSelectMode?.();

                // kalau sebelumnya sedang selectMode (artinya sekarang dimatikan), bersihkan pilihan
                if (selectMode) onClearSelect?.();
              }}
              className={[
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all",
                "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 ring-zinc-200 text-black",
                selectMode
                  ? "bg-zinc-400 text-white border-zinc-900 shadow-sm"
                  : "bg-white border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50",
              ].join(" ")}
            >
              {selectMode ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M4 12h16M12 4v16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {selectMode ? "" : "Pilih"}
            </button>

            {/* Toggle Reorder Mode */}

            <button
              type="button"
              onClick={() => {
                if (filterActive) return; // cegah toggle saat filter aktif

                // kalau mau menyalakan reorder saat select aktif -> matikan select dulu
                if (!reorderMode && selectMode) {
                  onClearSelect?.();
                  onToggleSelectMode?.(); // bikin selectMode = false
                }

                setReorderMode((v) => !v); // ✅ cukup sekali
              }}
              disabled={filterActive}
              className={[
                selectMode ? "hidden md:inline-flex" : "inline-flex",
                "items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all",
                "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 ring-violet-200",
                reorderMode
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-black",
                filterActive ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
              title={
                filterActive
                  ? "Nonaktif saat filter aktif"
                  : "Mode atur urutan tanpa drag"
              }
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M8 6h13M3 6h1m4 6h13M3 12h1m4 6h13M3 18h1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {reorderMode ? "Selesai" : "Reorder"}
            </button>

            {/* Hapus terpilih (hanya saat selectMode) */}
            {selectMode && (
              <>
                <span className="hidden sm:inline text-sm text-zinc-500">
                  Terpilih: {selectedCount}
                </span>
                <button
                  type="button"
                  disabled={selectedCount === 0 || busyDelSel}
                  onClick={() => setOpenDelSel(true)}
                  className={[
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all",
                    selectedCount === 0
                      ? "bg-white/95 text-red-400 border-red-200 cursor-not-allowed"
                      : "bg-red-600 text-white border-red-600 hover:opacity-90",
                  ].join(" ")}
                  title={
                    selectedCount === 0
                      ? "Pilih minimal 1 foto"
                      : "Hapus foto terpilih"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>

        {/* Grid TANPA DnD */}
        {assets.length === 0 ? (
          <div className="text-sm text-zinc-500">
            Belum ada foto. Upload terlebih dahulu.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {orderedAssets.map((a, i) => (
              <div
                key={a.id}
                className="group relative rounded-xl border overflow-hidden bg-white"
              >
                {/* tombol reorder overlay (muncul hanya saat reorderMode) */}
                {reorderMode && !filterActive && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/80 backdrop-blur-xl px-1.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,.25)]">
                    {/* Naik */}
                    <button
                      type="button"
                      onClick={() => moveBy(a.id, -1)}
                      title="Geser naik"
                      aria-label="Geser naik"
                      className="inline-grid place-items-center w-8 h-8 rounded-lg border border-violet-500 text-violet-500 hover:text-violet-400 hover:bg-white/15 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400/40 active:scale-95 transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </button>

                    {/* Turun */}
                    <button
                      type="button"
                      onClick={() => moveBy(a.id, +1)}
                      title="Geser turun"
                      aria-label="Geser turun"
                      className="inline-grid place-items-center w-8 h-8 rounded-lg border border-violet-500 text-violet-500 hover:text-violet-400 hover:bg-white/15 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400/40 active:scale-95 transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>

                    {/* Pindah ke posisi… */}
                    <button
                      type="button"
                      onClick={() => askMoveTo(a.id)}
                      title="Pindah ke posisi…"
                      aria-label="Pindah ke posisi…"
                      className="inline-flex items-center justify-center px-2 h-8 rounded-lg border border-violet-500 text-violet-500 text-xs font-medium hover:text-violet-400 hover:bg-white/15 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400/40 active:scale-95 transition"
                    >
                      #
                    </button>
                  </div>
                )}

                {/* checkbox pilih (kalau selectMode) */}
                {selectMode && (
                  <label className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs bg-white/85 backdrop-blur shadow-sm">
                    <input
                      type="checkbox"
                      checked={selected?.has?.(a.id)}
                      onChange={() => onToggleSelect?.(a.id)}
                      className="sr-only"
                    />
                    <span
                      className={[
                        "inline-grid h-4 w-4 place-items-center rounded border",
                        selected?.has?.(a.id)
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-white border-zinc-300 text-transparent",
                      ].join(" ")}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3">
                        <path
                          d="M5 12l4 4L19 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="hidden sm:inline">
                      {selected?.has?.(a.id) ? "Dipilih" : "Pilih"}
                    </span>
                  </label>
                )}

                {/* konten kartu */}
                <button
                  type="button"
                  onClick={() => onOpenViewer(a.id)}
                  className="block w-full"
                  title="Lihat lebih besar"
                >
                  <img
                    src={a.variants?.md || a.url}
                    alt={a.caption || ""}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="w-full h-44 object-cover rounded-xl border-0"
                  />
                </button>

                {/* badge index (biar kelihatan urutan sekarang) */}
                {reorderMode && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      <DeleteSelectedModal
        open={openDelSel}
        count={selectedCount}
        busy={busyDelSel}
        onCancel={() => setOpenDelSel(false)}
        onConfirm={async () => {
          try {
            setBusyDelSel(true);
            await onBulkDelete?.(); // aksi hapus massal kamu
            onClearSelect?.(); // kosongkan pilihan
            setOpenDelSel(false); // tutup modal
          } catch (e) {
            console.error(e);
            // optional: tampilkan toast error
          } finally {
            setBusyDelSel(false);
          }
        }}
      />
    </>
  );
}
