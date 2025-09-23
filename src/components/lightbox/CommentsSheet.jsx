// src/components/lightbox/CommentsSheet.jsx
import React, { useState } from "react";

export default function CommentsSheet({
  open,
  comments = [],
  onSubmit, // async (text)
}) {
  const [text, setText] = useState("");
  if (!open) return null;

  return (
    <div className="absolute inset-x-0 bottom-16 md:bottom-24 z-40" onClick={(e)=>e.stopPropagation()}>
      <div className="mx-auto max-w-[min(95vw,900px)]">
        <div className="rounded-2xl border border-white/20 shadow-2xl bg-white/10 backdrop-blur-md overflow-hidden">
          {/* list */}
          <div className="max-h-56 md:max-h-72 overflow-auto p-2 md:p-3 space-y-2 pr-1">
            {comments.length === 0 && (
              <div className="text-sm opacity-80 px-2 py-1">Belum ada komentar.</div>
            )}
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="text-xs opacity-80">
                  <span className="font-medium">{c.user_name}</span>{" "}
                  <span className="opacity-60">• {new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{c.body}</div>
              </div>
            ))}
          </div>

          {/* form sticky */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const t = text.trim();
              if (!t) return;
              await onSubmit?.(t);
              setText("");
            }}
            className="sticky top-0 z-10 p-2 md:p-3 border-b border-white/10 bg-white/10 backdrop-blur-md flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis komentar foto…"
              className="flex-1 rounded-lg px-3 py-2 bg-white/10 border border-white/20 placeholder:text-zinc-300 focus:outline-none focus:border-white/40"
            />
            <button className="px-3 py-2 rounded-lg bg-white text-black disabled:opacity-50" disabled={!text.trim()}>
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
