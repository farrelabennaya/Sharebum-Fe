import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";

export default function AlbumPublicHeader({
  title,
  photoCount,
  counts = {},
  selectedEmoji = null,
  onToggleReact,      // (emoji) => Promise|void
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  // tutup popover saat klik luar/ESC
  useEffect(() => {
    const onDoc = (e) => {
      if (!pickerOpen) return;
      const within = popRef.current?.contains(e.target) || btnRef.current?.contains(e.target);
      if (!within) setPickerOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setPickerOpen(false);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  return (
    <header className="max-w-6xl mx-auto p-4 md:p-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-sm text-zinc-500">{photoCount} foto</p>
      </div>

      <div className="relative">
        {/* <button
          ref={btnRef}
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-zinc-50"
          title="Kirim reaksi"
        >
          <span>{selectedEmoji || "🙂"}</span>
          <span className="text-sm">React</span>
        </button> */}

        {/* Ringkasan 3 emoji teratas */}
        <div className="hidden md:inline-flex ml-2 align-middle gap-1">
          {Object.entries(counts)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .slice(0, 3)
            .map(([e, c]) => (
              <span
                key={e}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${
                  selectedEmoji === e ? "bg-black text-white border-black" : "bg-white"
                }`}
                title={`${c} ${e}`}
              >
                <span>{e}</span>
                <span className="text-xs">{c ?? 0}</span>
              </span>
            ))}
        </div>

        <div ref={popRef} className="relative">
          <EmojiPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onPick={async (e) => {
              await onToggleReact?.(e);
              setPickerOpen(false);
            }}
            selected={selectedEmoji}
            counts={counts}
          />
        </div>
      </div>
    </header>
  );
}
