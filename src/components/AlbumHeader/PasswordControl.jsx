import React from "react";

export default function PasswordControl({ passwordProtected, onOpenModal }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-zinc-300">Proteksi Password</label>

      <div className="flex items-center gap-3">
        {/* Status */}
        <div
          className={[
            "px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 flex-1",
            "border",
            passwordProtected
              ? "bg-amber-500/10 text-amber-300 border-amber-400/30"
              : "bg-white/5 text-zinc-200 border-white/10",
          ].join(" ")}
        >
          <span className="text-sm">{passwordProtected ? "🔒" : "🔓"}</span>
          <span>{passwordProtected ? "Password aktif" : "Tanpa password"}</span>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={onOpenModal}
          className={[
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
            "shadow-lg shadow-fuchsia-900/30 hover:opacity-95 active:scale-[0.98]",
          ].join(" ")}
        >
          {passwordProtected ? "Ubah" : "Atur"}
        </button>
      </div>
    </div>
  );
}
