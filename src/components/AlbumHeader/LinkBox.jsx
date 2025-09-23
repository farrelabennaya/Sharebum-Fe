import React from "react";

export default function LinkBox({ slug }) {
  const href = slug ? `/album/${slug}` : null;

  async function copyLink(e) {
    e.preventDefault();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = origin + (href || "");
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = href ? origin + href : "";

  return (
    <div className="p-3 rounded-xl border bg-white/5 border-white/10">
      <div className="text-xs font-medium text-zinc-300 mb-1">Link Album</div>

      {href ? (
        <div className="flex items-center gap-2 min-w-0">
          <a
            className="flex-1 truncate text-sm text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={fullUrl}     // tooltip full link
          >
            {fullUrl}           {/* akan terpotong … jika kepanjangan */}
          </a>

          <button
            onClick={copyLink}
            className="ml-2 shrink-0 px-2.5 py-1.5 rounded-lg text-xs border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 transition"
            title="Salin link"
          >
            Salin
          </button>
        </div>
      ) : (
        <span className="text-sm text-zinc-400 italic">Slug belum tersedia</span>
      )}
    </div>
  );
}
