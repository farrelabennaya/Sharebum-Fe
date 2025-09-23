import React from "react";

export default function VisibilityControl({ visibility, onSetVisibility }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-zinc-300">Tingkat Akses</label>

      <div className="space-y-2">
        <select
          value={visibility}
          onChange={(e) => onSetVisibility?.(e.target.value)}
          className={[
            "w-full rounded-xl px-4 py-3 text-sm text-white",
            "bg-white/5 focus:bg-zinc-700 border border-white/10",
            "focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/30",
            "outline-none transition-all",
          ].join(" ")}
        >
          <option value="private">Private — Hanya saya</option>
          <option value="unlisted">Unlisted — Siapa saja dengan link</option>
          <option value="public">Public — Dapat ditemukan semua orang</option>
        </select>

        <div className="text-xs text-zinc-400 px-1">
          {visibility === "private" && "Album hanya bisa diakses oleh Anda."}
          {visibility === "unlisted" && "Album bisa diakses siapa saja yang memiliki link."}
          {visibility === "public" && "Album dapat ditemukan dan diakses semua orang."}
        </div>
      </div>
    </div>
  );
}
