import React from "react";
export default function FilterBar({
  tags = [],
  selected = [],
  onChangeSelected,
  advanced = {},
  onChangeAdvanced,
}) {
  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChangeSelected?.(next);
  };

  const clearAll = () => onChangeSelected?.([]);
  const isSelected = (id) => selected.includes(id);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl text-white">
      {/* Chips (scroll-x + soft edge mask) */}
      <div className="relative flex-1 min-w-[240px]">
        {/* Soft masks (hiasan) */}
        {/* <div className="pointer-events-none absolute inset-y-0 left-0 w-6 rounded-l-2xl bg-gradient-to-r from-black/0 to-black/40 z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-2xl bg-gradient-to-l from-black/0 to-black/40 z-10" /> */}

        <div className="flex gap-2 overflow-x-auto pr-6 py-1 scroll-smooth snap-x snap-mandatory">
          {tags.length === 0 ? (
            <span className="text-xs text-white/50 px-1">Belum ada tag</span>
          ) : (
            tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                aria-pressed={isSelected(t.id)}
                className={[
                  "snap-start select-none rounded-full px-3 py-1.5 text-sm transition-all active:scale-[.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40",
                  isSelected(t.id)
                    ? "bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-white border border-violet-400/40 ring-2 ring-violet-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:border-white/20",
                ].join(" ")}
              >
                #{t.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Kontrol kanan */}
      <div className="ml-auto flex items-center gap-3 text-sm">
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-white/70 hover:text-white underline-offset-4 hover:underline transition"
          >
            Hapus ({selected.length})
          </button>
        )}

        {/* Toggle: Ada caption */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <span className="text-white/80">Ada caption</span>
          <input
            type="checkbox"
            className="peer sr-only"
            checked={!!advanced.hasCaption}
            onChange={(e) =>
              onChangeAdvanced?.({ ...advanced, hasCaption: e.target.checked })
            }
          />
          <span
            className={[
              "h-5 w-9 rounded-full transition-colors relative",
              "bg-white/10 peer-checked:bg-violet-500",
              "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4",
              "focus-within:ring-2 focus-within:ring-violet-400/40",
            ].join(" ")}
            aria-hidden="true"
          />
        </label>
      </div>
    </div>
  );
}
