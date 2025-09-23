import React from "react";

const DEFAULTS = ["❤","👍","🔥","👏","😂","🥰","😮","😢","🎉","✨"];

export default function EmojiPicker({
  open,
  onClose,
  onPick,                 // (emoji) => void
  selected = null,        // emoji yg terpilih
  counts = {},            // { "❤": 3, ... } (opsional)
  emojis = DEFAULTS,
  className = "",
}) {
  if (!open) return null;
  return (
    <div
      className={"absolute right-0 top-full mt-2 w-60 rounded-xl border bg-white shadow-lg p-2 z-50 " + className}
      onClick={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-6 gap-1">
        {emojis.map((e) => {
          const active = selected === e;
          const c = counts?.[e] ?? 0;
          return (
            <button
              key={e}
              onClick={() => onPick?.(e)}
              className={[
                "h-10 rounded-lg border flex flex-col items-center justify-center hover:bg-zinc-50 transition",
                active ? "border-black ring-2 ring-black" : "border-zinc-200",
              ].join(" ")}
              title={active ? `Batalkan ${e}` : `Kirim ${e}`}
            >
              <span className="text-lg leading-none">{e}</span>
              <span className="text-[10px] leading-none">{c}</span>
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-zinc-500 mt-2 text-center">
        Klik emoji untuk pilih / batal
      </div>
      <div className="mt-1 text-right">
        <button onClick={onClose} className="text-xs text-zinc-500 hover:underline">
          Tutup
        </button>
      </div>
    </div>
  );
}
