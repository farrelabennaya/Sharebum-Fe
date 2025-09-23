import React from "react";

export default function TitleEditor({
  rename,
  onTitleChange,
  onSaveRename,
  titleRef,
}) {
  const len = (rename || "").trim().length;
  const canSave = len > 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">Judul Album</label>

      <div className="flex gap-2">
        <div className="flex-1 relative group">
          <input
            ref={titleRef}
            value={rename}
            onChange={onTitleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) onSaveRename?.();
            }}
            aria-invalid={!canSave}
            aria-describedby="title-help"
            placeholder="Masukkan nama album…"
            maxLength={120}
            title={rename}
            className={[
              "w-full rounded-xl px-3.5 py-2.5 pr-16 text-sm text-white",
              +"truncate", // ← ellipsis saat kepanjangan
              "bg-white/5 border border-white/10",
              "focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/30",
              "outline-none transition-all duration-200",
              "group-hover:border-white/20",
              !canSave ? "ring-1 ring-rose-500/25" : "",
            ].join(" ")}
          />

          {/* counter + status */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
            {len}/120
          </div>
        </div>

        <button
          onClick={onSaveRename}
          disabled={!canSave}
          className={[
            "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
            "shadow-lg shadow-fuchsia-900/30 hover:opacity-95 active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          <span className="hidden sm:inline">Simpan</span>
          <span className="sm:hidden">✓</span>
        </button>
      </div>

      <p
        id="title-help"
        className={[
          "text-xs",
          canSave ? "text-zinc-500" : "text-rose-300",
        ].join(" ")}
      >
        {canSave
          ? "Tekan Enter untuk cepat menyimpan."
          : "Judul tidak boleh kosong."}
      </p>
    </div>
  );
}
