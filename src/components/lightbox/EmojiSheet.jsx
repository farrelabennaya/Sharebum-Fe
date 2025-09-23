// src/components/lightbox/EmojiSheet.jsx
import React from "react";

export default function EmojiSheet({
  open,
  selectedEmoji,
  counts = {},
  onPick,      // (emoji) => void
  onClose,     // () => void
}) {
  if (!open) return null;
  const EMOJIS = ['👍','❤️','😍','🔥','😊','👏','🎉','😮','😢','😡','😁','🤯','😎','🤔','🙏','🥳','🫶','💯','👀','✨'];

  return (
    <div
      className="fixed left-0 right-0
        bottom-[calc(env(safe-area-inset-bottom)+64px)]
        md:bottom-[calc(env(safe-area-inset-bottom)+88px)]
        z-[55] px-3"
      onClick={(e)=>e.stopPropagation()}
    >
      <div className="mx-auto max-w-[min(95vw,900px)]">
        <div className="rounded-2xl border border-white/20 shadow-2xl bg-white/10 backdrop-blur-md overflow-hidden">
          {/* header sticky */}
          <div className="sticky top-0 z-10 px-3 py-2 md:px-4 md:py-3 border-b border-white/10 bg-white/10 backdrop-blur-md flex items-center justify-between">
            <div className="text-sm font-medium">Pilih reaksi</div>
            <button onClick={onClose} className="px-2 py-1 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-sm">
              Tutup
            </button>
          </div>

          {/* grid scrollable */}
          <div className="max-h-56 md:max-h-72 overflow-auto p-2 md:p-3">
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 md:gap-2">
              {EMOJIS.map((e) => {
                const active = selectedEmoji === e;
                const c = counts?.[e] ?? 0;
                return (
                  <button
                    key={e}
                    onClick={()=>onPick?.(e)}
                    className={`h-10 md:h-12 rounded-lg border flex flex-col items-center justify-center transition hover:bg-white/15
                      ${active ? 'border-white ring-2 ring-white' : 'border-white/20'}`}
                    title={active ? `Batalkan ${e}` : `Kirim ${e}`}
                  >
                    <span className="text-lg md:text-xl leading-none">{e}</span>
                    <span className="text-[10px] leading-none opacity-80">{c}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
