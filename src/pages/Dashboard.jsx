// pages/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api.js";
import { Btn } from "../components/ui/Btn.jsx";
import { Card } from "../components/ui/Card.jsx";
import AlbumSidebar from "../components/AlbumSidebar.jsx";
import CreateAlbumModal from "../components/modals/CreateAlbumModal.jsx";

export default function Dashboard() {
  const navigate = useNavigate();

  const [me, setMe] = React.useState(null);             // ⬅️ user login
  const [albums, setAlbums] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");

  async function loadMe() {
    try {
      const u = await apiGet("/api/me");                // ⬅️ pastikan endpoint tersedia
      setMe(u);
    } catch (e) {
      // kalau token invalid, balikin ke login
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    }
  }

  async function loadAlbums() {
    setLoading(true);
    try {
      const res = await apiGet("/api/albums");
      setAlbums(res?.data || res || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadMe();
    loadAlbums();
  }, []);

  async function createAlbum() {
    if (!newTitle.trim()) return;
    const created = await apiPost("/api/albums", {
      title: newTitle,
      visibility: false,
    });
    setCreating(false);
    setNewTitle("");
    await loadAlbums();
    navigate(`/dashboard/albums/${created.id}`);
  }

  // helper avatar (fallback inisial)
  const avatarUrl = me?.avatar_url || null;
  const initials =
    (me?.name || "")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // menu ⋮
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 text-white">
        <div className="relative max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto,1fr,auto] items-center gap-2">
          {/* Kiri: avatar → ke halaman profil */}
          <button
            onClick={() => navigate("/dashboard/profile")}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Lihat profil"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={me?.name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 grid place-items-center text-xs font-semibold">
                {initials}
              </div>
            )}
            <span className="hidden sm:inline text-sm opacity-80">Profil</span>
          </button>

          {/* Tengah: nama user (ganti "Album Dashboard") */}
          <div className="font-semibold text-center truncate">
            Hi, {me?.name || "Loading…"}
          </div>

          {/* Kanan: menu ⋮ */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Menu"
              title="Menu"
            >
              {/* ikon ⋮ */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-40 rounded-lg border border-white/10 bg-zinc-900/95 backdrop-blur shadow-lg p-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/dashboard/profile");
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10"
                >
                  Profil
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10"
                >
                  Pengaturan
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    localStorage.removeItem("token");
                    location.href = "/";
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded text-red-300 hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20 md:pb-6">
        <AlbumSidebar
          loading={loading}
          albums={albums}
          onOpenCreate={() => setCreating(true)}
        />
      </main>

      <CreateAlbumModal
        open={creating}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        onCreate={createAlbum}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}
