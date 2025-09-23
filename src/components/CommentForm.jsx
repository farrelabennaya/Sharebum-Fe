import React, { useState } from "react";

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const t = text.trim();
        if (!t) return;
        setBusy(true);
        try {
          await onSubmit?.(t);
          setText("");
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Tulis komentar…"
        className="w-full border rounded-lg px-3 py-2"
      />
      <div className="flex justify-end">
        <button
          disabled={busy || !text.trim()}
          className="px-3 py-1.5 rounded-lg border bg-black text-white disabled:opacity-50"
        >
          Kirim
        </button>
      </div>
    </form>
  );
}
