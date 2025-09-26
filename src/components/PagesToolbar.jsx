import { useState } from "react";
import { Card } from "./ui/Card";
import { BtnPage, Primary } from "./ui/Btn";

export default function PagesToolbar({
  pages,
  pageId,
  setPageId,
  onCreatePage,
  onReorder,
  onAskDeletePage,
}) {
  const stop = (e) => e.stopPropagation();
   const [adding, setAdding] = useState(false);

  async function handleCreatePage() {
    if (adding) return;
    try {
      setAdding(true);
      await onCreatePage(); // asumsi ini Promise
    } finally {
      setAdding(false);
    }
  }
  return (
    <Card className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-white/10 text-white">
      {/* Header */}
       <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-fuchsia-500 to-violet-500 rounded-full" />
        <h3 className="font-semibold text-lg">Pages</h3>
        <div className="px-2 py-0.5 border border-white/10 bg-white/10 text-zinc-200 text-xs font-medium rounded-full">
          {pages.length}
        </div>
      </div>

      <Primary
        onClick={handleCreatePage}
        disabled={adding}
        aria-busy={adding}
        className="inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        title={adding ? "Menambah halaman..." : "Tambah halaman"}
      >
        {adding ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" />
              <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="hidden sm:inline">Menambah…</span>
            <span className="sm:hidden">…</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline items-center gap-1">+ Tambah</span>
            <span className="sm:hidden">+</span>
          </>
        )}
      </Primary>
    </div>

      {/* Scroller */}
      <div
        className="flex gap-3 overflow-x-auto pb-3 pt-1 px-2 sm:px-1 snap-x snap-mandatory scrollbar-hide
              [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
        style={{ scrollPaddingInline: "1rem" }} // biar snap-nya berhenti sebelum nempel tepi
      >
        {pages.map((p, index) => {
          const isActive = p.id === pageId;
          const assetsLen = (p.assets || []).length;
          const thumbs = (p.assets || []).slice(0, 6);

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              aria-pressed={p.id === pageId}
              onClick={() => setPageId(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPageId(p.id);
                }
              }}
              className={[
                "group relative snap-start min-w-[160px] sm:min-w-[220px] rounded-2xl border transition-all duration-300",
                "bg-white/5 border-white/10 hover:bg-white/10",
                isActive
                  ? "ring-1 ring-violet-400/40 border-violet-400/30"
                  : "",
              ].join(" ")}
            >
              {/* Active dot */}
              {/* {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 shadow-sm bg-gradient-to-br from-violet-500 to-fuchsia-500" />
              )} */}

              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPageId(p.id)}
                    className={[
                      "font-semibold truncate text-sm sm:text-base pr-2 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-zinc-300 hover:text-white",
                    ].join(" ")}
                    title={`Buka Page ${p.index != null ? p.index + 1 : p.id}`}
                  >
                    Page {p.index != null ? p.index + 1 : index + 1}
                  </button>

                  {/* Desktop controls */}
                  <div className="hidden sm:flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <BtnPage
                      onClick={() => onReorder(p.id, "up")}
                      className="px-2.5 py-1.5 text-xs border-white/15 bg-white/5 hover:bg-white/10 rounded-lg"
                      aria-label="Geser naik"
                      title="Geser naik"
                    >
                      ↑
                    </BtnPage>
                    <BtnPage
                      onClick={() => onReorder(p.id, "down")}
                      className="px-2.5 py-1.5 text-xs border-white/15 bg-white/5 hover:bg-white/10 rounded-lg"
                      aria-label="Geser turun"
                      title="Geser turun"
                    >
                      ↓
                    </BtnPage>
                    <BtnPage
                      onClick={() => onAskDeletePage(p.id)}
                      className="px-2.5 py-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 rounded-lg"
                      aria-label="Hapus page"
                      title="Hapus page"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 7h16"
                        />
                        <path
                          strokeWidth={2}
                          d="M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"
                        />
                        <path
                          strokeWidth={2}
                          d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                        />
                      </svg>
                    </BtnPage>
                  </div>

                  {/* Mobile controls */}
                  <div className="flex flex-col gap-1 sm:hidden opacity-60 group-hover:opacity-100 transition-opacity">
                    <BtnPage
                      className="w-6 h-6 p-0 text-xs border-white/15 bg-white/5 hover:bg-white/10 rounded-md"
                      onClick={() => onReorder(p.id, "up")}
                    >
                      ↑
                    </BtnPage>
                    <BtnPage
                      className="w-6 h-6 p-0 text-xs border-white/15 bg-white/5 hover:bg-white/10 rounded-md"
                      onClick={() => onReorder(p.id, "down")}
                    >
                      ↓
                    </BtnPage>
                    <BtnPage
                      className="w-6 h-6 p-0 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 rounded-md"
                      onClick={() => onAskDeletePage(p.id)}
                    >
                      ×
                    </BtnPage>
                  </div>
                </div>

                {/* Thumbs grid */}
                <div className="relative">
                  {assetsLen > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {thumbs.map((a, i) => (
                        <div
                          key={a.id}
                          className="relative aspect-square overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10"
                        >
                          <img
                            src={a.variants?.thumb || a.url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          {i === 5 && assetsLen > 6 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                +{assetsLen - 6}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center text-zinc-400 text-xs">
                      <div className="text-center">
                        <svg
                          className="w-6 h-6 mx-auto mb-1 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <div>Kosong</div>
                      </div>
                    </div>
                  )}

                  {/* Badge jumlah */}
                  {assetsLen > 0 && (
                    <div className="absolute -top-1 -left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                      {assetsLen}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Card>
  );
}
