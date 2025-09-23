import React from "react";
import { Btn } from "../ui/Btn";

export default function MetaBar({ createdAt, onAskDelete }) {
  return (
    <div className="w-full sm:w-auto grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
      {createdAt && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                     bg-white/5 border border-white/10 text-zinc-200
                     text-xs sm:text-sm"
          title="Tanggal dibuat"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M7 3v2M17 3v2M4 8h16M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-medium">
            {new Date(createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      )}

      <Btn
        onClick={onAskDelete}
        className="px-4 py-2 text-sm rounded-lg
                  bg-rose-600/90 text-white border border-rose-500
                  hover:bg-rose-600 shadow-lg shadow-rose-900/30
                  transition"
      >
        Hapus Album
      </Btn>
    </div>
  );
}
