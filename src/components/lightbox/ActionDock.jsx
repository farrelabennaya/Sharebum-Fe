// src/components/lightbox/ActionDock.jsx
import React from "react";
import { MessageCircle } from "lucide-react";

export default function ActionDock({
  // state terkontrol
  pickerOpen,
  showComments,
  selectedEmoji,      // string/null
  counts = {},        // { "👍": 12, ... }
  commentsCount = 0,

  // events
  onTogglePicker,     // () => void
  onToggleComments,   // () => void
  onPickTopEmoji,     // (emoji) => void
}) {
  return (
    <div className="absolute inset-x-0 bottom-3 md:bottom-5 z-50 pointer-events-none">
      <div className="mx-auto max-w-[min(95vw,900px)] flex items-center justify-between gap-3 px-1">
        {/* LEFT: React */}
        <div className="relative pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePicker?.(); }}
            className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl
              border-2 transition-all duration-300 backdrop-blur-md shadow-lg
              ${pickerOpen
                ? 'border-white/40 bg-white/20 scale-105'
                : 'border-white/25 bg-white/10 hover:bg-white/20 hover:border-white/35 hover:scale-105'}`}
            title="Kirim reaksi"
          >
            <span className="text-lg">{selectedEmoji || "🙂"}</span>
            <span className="text-sm font-semibold text-white/90 group-hover:text-white">React</span>
          </button>

          {/* Top 3 emoji summary (klik = pilih cepat) */}
          <div className="hidden md:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 gap-2">
            {Object.entries(counts)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .slice(0, 3)
              .map(([e, c]) => (
                <button
                  key={e}
                  onClick={(ev)=>{ ev.stopPropagation(); onPickTopEmoji?.(e); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border-2 backdrop-blur-md
                    ${selectedEmoji === e
                      ? "bg-white/90 text-slate-800 border-white shadow-lg"
                      : "bg-white/15 border-white/25 text-white hover:bg-white/25 hover:border-white/35"}`}
                  title={`${c} ${e}`}
                >
                  <span className="text-base">{e}</span>
                  <span className={`text-xs font-bold ${selectedEmoji === e ? 'text-slate-600' : 'text-white/80'}`}>{c}</span>
                </button>
              ))}
          </div>
        </div>

        {/* RIGHT: Comment */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComments?.(); }}
            className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl
              border-2 transition-all duration-300 backdrop-blur-md shadow-lg
              ${showComments
                ? 'border-white/40 bg-white/20 scale-105'
                : 'border-white/25 bg-white/10 hover:bg-white/20 hover:border-white/35 hover:scale-105'}`}
            aria-expanded={showComments}
            title="Lihat komentar"
          >
            <div className="relative">
              <MessageCircle className="h-5 w-5 text-white/90 group-hover:text-white" />
              {commentsCount > 0 && !showComments && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">
                    {commentsCount > 9 ? '9+' : commentsCount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs font-semibold text-white/90 group-hover:text-white">{commentsCount}</span>
              <span className="text-[10px] text-white/70 group-hover:text-white/80">comments</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
