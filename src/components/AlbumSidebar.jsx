// components/AlbumSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Card } from "./ui/Card";
import { Primary } from "./ui/Btn";

function CoverThumb({ album }) {
  const src =
    album.cover_url || album.coverUrl || album.cover?.url || album.cover || "";

  if (!src) {
    return (
      <div className="h-11 w-11 md:h-12 md:w-12 rounded-md border bg-zinc-100 grid place-items-center text-[9px] md:text-[10px] text-zinc-500">
        No
        <br />
        Cover
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Cover ${album.title}`}
      loading="lazy"
      className="h-11 w-11 md:h-12 md:w-12 rounded-md border object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export default function AlbumSidebar({ loading, albums, onOpenCreate }) {
  return (
    <section className="w-full space-y-4">
      {/* Header: tombol New hanya tampil di desktop */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Albums</h2>
        <Primary
          onClick={onOpenCreate}
          className="px-2 py-1 hidden md:inline-flex"
        >
          New
        </Primary>
      </div>

      <Card className="p-2">
        {loading && <div className="p-3 text-sm text-zinc-500">Loading…</div>}
        {!loading && albums.length === 0 && (
          <div className="p-3 text-sm text-zinc-500">Belum ada album, buat terlebih dahulu.</div>
        )}

        {/* DESKTOP: compact grid, bukan sidebar */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {albums.map((a) => (
            <NavLink
              key={a.id}
              to={`/dashboard/albums/${a.id}`}
              className={({ isActive }) =>
                [
                  "group relative flex items-center gap-2 rounded-lg border px-2 py-2 transition text-sm",
                  isActive
                    ? "bg-black text-white border-white/20"
                    : "bg-white/5 hover:bg-zinc-100 border-white/10 text-white",
                ].join(" ")
              }
            >
              <CoverThumb album={a} />
              <div className="min-w-0">
                <div className="font-medium truncate">{a.title}</div>
                <span
                  className={
                    "inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5 " +
                    (a.visibility === "public"
                      ? "bg-green-100 text-green-700"
                      : a.visibility === "unlisted"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-zinc-100 text-zinc-600")
                  }
                >
                  {a.visibility === "public"
                    ? "Public"
                    : a.visibility === "unlisted"
                    ? "Unlisted"
                    : "Private"}
                </span>
              </div>
            </NavLink>
          ))}
        </div>

        {/* MOBILE: list vertikal seperti sebelumnya */}
        <div className="md:hidden space-y-1">
          {albums.map((a) => (
            <NavLink
              key={a.id}
              to={`/dashboard/albums/${a.id}`}
              className={({ isActive }) =>
                [
                  "block w-full text-left rounded-lg transition",
                  isActive ? "bg-black text-white" : "hover:bg-white/10",
                ].join(" ")
              }
            >
              <div className="flex items-center gap-3 px-3 py-2">
                <CoverThumb album={a} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <span
                    className={
                      "inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5 " +
                      (a.visibility === "public"
                        ? "bg-green-100 text-green-700"
                        : a.visibility === "unlisted"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-zinc-100 text-zinc-600")
                    }
                  >
                    {a.visibility === "public"
                      ? "Public"
                      : a.visibility === "unlisted"
                      ? "Unlisted"
                      : "Private"}
                  </span>
                </div>
              </div>
            </NavLink>
          ))}
        </div>
      </Card>

      {/* FAB: tombol New mengambang di kanan-bawah, hanya mobile */}
      <button
        onClick={onOpenCreate}
        className="md:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-white text-black border border-white/10 shadow-xl shadow-black/40 flex items-center justify-center active:scale-95 transition will-change-transform"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Tambah album baru"
        title="New album"
      >
        {/* Icon plus */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </section>
  );
}
