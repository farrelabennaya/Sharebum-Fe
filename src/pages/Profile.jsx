// src/pages/Profile.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiPost, apiDelete } from "../lib/api.js";
import { Btn } from "../components/ui/Btn.jsx";
import { Card } from "../components/ui/Card.jsx";

/** util inisial untuk avatar fallback */
function getInitials(name) {
  return (
    (name || "")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

/** Avatar reusable (fallback ke inisial jika url kosong/404) */
function Avatar({ name, url, size = 80, className = "" }) {
  const [err, setErr] = React.useState(false);
  const showImg = !!url && !err;
  if (showImg) {
    return (
      <img
        src={url}
        alt={name || "User"}
        width={size}
        height={size}
        className={`rounded-2xl object-cover ring-1 ring-white/10 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      className={`grid place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: Math.max(12, Math.floor(size / 3)) }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  // state dasar
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [me, setMe] = React.useState(null);

  // form fields
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState(""); // muncul kalau backend kirim
  const [bio, setBio] = React.useState(""); // muncul kalau backend kirim
  const [email, setEmail] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");

  // avatar: mode dan progress
  const [tab, setTab] = React.useState("upload"); // 'upload' | 'url'
  const [avatarUploading, setAvatarUploading] = React.useState(false);

  // toast kecil
  const [msg, setMsg] = React.useState(null); // { type: 'ok'|'error', text: string }

  React.useEffect(() => {
    (async () => {
      try {
        const u = await apiGet("/api/me");
        setMe(u);
        setName(u?.name ?? "");
        setEmail(u?.email ?? "");
        setAvatarUrl(u?.avatar_url ?? "");
        if (typeof u?.username !== "undefined") setUsername(u.username ?? "");
        if (typeof u?.bio !== "undefined") setBio(u.bio ?? "");
      } catch (e) {
        localStorage.removeItem("token");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const hasUsername = typeof me?.username !== "undefined";
  const hasBio = typeof me?.bio !== "undefined";

  function showToast(t, text) {
    setMsg({ type: t, text });
    // auto close
    setTimeout(() => setMsg(null), 2500);
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    if (!me) return;

    if (!name.trim()) {
      showToast("error", "Nama tidak boleh kosong.");
      return;
    }
    if (avatarUploading) {
      showToast("error", "Tunggu upload avatar selesai.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name, avatar_url: avatarUrl };
      if (hasUsername) payload.username = username;
      if (hasBio) payload.bio = bio;

      const updated = await apiPatch("/api/me", payload);
      setMe((prev) => ({ ...(prev || {}), ...(updated || payload) }));
      showToast("ok", "Profil berhasil disimpan.");
    } catch (e) {
      showToast("error", e?.message || "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  // helper: upload file ke server
  async function uploadAvatarFile(file) {
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await apiPost("/api/me/avatar", fd);
      const url = res?.url || res?.avatar_url;
      if (!url) throw new Error("Server tidak mengembalikan URL avatar.");

      setAvatarUrl(url);
      setMe((prev) => ({ ...(prev || {}), avatar_url: url }));
      showToast("ok", "Avatar berhasil diunggah.");
    } catch (err) {
      showToast("error", err?.errors?.avatar?.[0] || err.message || "Gagal upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  // Upload avatar otomatis saat file dipilih
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatarFile(file);
    e.target.value = ""; // reset supaya bisa pilih file yang sama lagi
  }

  // Drag & drop ke area upload
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAvatarFile(file);
  }

  async function handleRemoveAvatar() {
    try {
      await apiDelete("/api/me/avatar");
      setAvatarUrl("");
      setMe((prev) => ({ ...(prev || {}), avatar_url: null }));
      showToast("ok", "Avatar dihapus.");
    } catch (e) {
      showToast("error", e?.message || "Gagal menghapus avatar.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      {/* ornaments */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto,1fr,auto] items-center gap-2">
          {/* kiri: back */}
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Kembali"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polyline
                points="15 18 9 12 15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* tengah: breadcrumb mini */}
          <div className="text-center truncate">
            <div className="text-[11px] text-zinc-400">Akun</div>
            <div className="font-semibold">Profil</div>
          </div>

          {/* kanan: placeholder biar grid seimbang */}
          <div className="w-9 h-9" />
        </div>
        {/* garis tipis aksen */}
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-6 space-y-6 supports-[content-visibility:auto]:[content-visibility:auto] supports-[content-visibility:auto]:[contain-intrinsic-size:1px_900px]">
        {loading ? (
          <Card className="overflow-hidden">
            {/* skeleton ringan */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-[320px,1fr] gap-6">
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-56 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-6">
            {/* LEFT: avatar & akun */}
            <Card className="bg-white/[0.06] border-white/10 overflow-hidden">
              <div className="p-5 md:p-6 space-y-5">
                {/* header kecil */}
                <div className="text-sm font-medium text-zinc-300">Foto Profil</div>

                {/* avatar preview */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar name={name} url={avatarUrl} size={80} />
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-2xl bg-black/40 grid place-items-center">
                        <svg
                          className="w-5 h-5 animate-spin text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                          <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400">Masuk sebagai</div>
                    <div className="font-medium">{name || "User"}</div>
                    <div className="text-xs text-zinc-400">{email}</div>
                  </div>
                </div>

                {/* avatar controls — tabs */}
                <div className="space-y-3">
                  <div className="flex gap-2 rounded-xl p-1 bg-white/5 border border-white/10 w-max">
                    <button
                      type="button"
                      onClick={() => setTab("upload")}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm transition",
                        tab === "upload" ? "bg-white/10" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      Upload
                    </button>
                    {/* <button
                      type="button"
                      onClick={() => setTab("url")}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm transition",
                        tab === "url" ? "bg-white/10" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      Pakai URL
                    </button> */}
                  </div>

                  {tab === "upload" ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                      }}
                      onDrop={onDrop}
                      className="rounded-xl border border-dashed border-white/15 bg-zinc-900/50 p-3"
                    >
                      <label className="block">
                        <span className="text-xs text-zinc-400">
                          JPG/PNG/WebP • Maks 2MB. <em>Tarik & lepas</em> file atau klik untuk memilih. Mengunggah otomatis saat dipilih.
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          disabled={avatarUploading}
                          className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/20 cursor-pointer disabled:opacity-60"
                        />
                      </label>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={!avatarUrl || avatarUploading}
                          className="px-3 py-1.5 rounded-lg text-xs border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40"
                          title="Hapus avatar"
                        >
                          Hapus Avatar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-zinc-400">Avatar URL</label>
                      <input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://…/avatar.jpg"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/40"
                      />
                      <div className="mt-1 text-[11px] text-zinc-400">
                        URL disimpan saat menekan tombol <span className="text-zinc-200">Simpan Perubahan</span>.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* RIGHT: form profil */}
            <Card className="bg-white/[0.06] border-white/10 overflow-hidden">
              <div className="p-5 md:p-6 space-y-7">
                {/* Bagian: Identitas */}
                <div>
                  <div className="text-sm font-medium text-zinc-300">Identitas</div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Nama */}
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Nama</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama lengkap"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/40"
                      />
                      <div className="mt-1 text-[11px] text-zinc-400">
                        Nama ini tampil di komentar & aktivitas publik.
                      </div>
                    </div>

                    {/* Username (opsional) */}
                    {hasUsername && (
                      <div>
                        <label className="text-sm font-medium text-zinc-300">Username</label>
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/40"
                        />
                        <div className="mt-1 text-[11px] text-zinc-400">
                          Dipakai untuk URL profil jika fitur publik diaktifkan.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bagian: Kontak */}
                <div>
                  <div className="text-sm font-medium text-zinc-300">Kontak</div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-zinc-300">Email</label>
                    <input
                      value={email}
                      readOnly
                      className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-300 outline-none"
                    />
                    <div className="mt-1 text-[11px] text-zinc-400">
                      Email digunakan untuk otentikasi & notifikasi.
                    </div>
                  </div>
                </div>

                {/* Bagian: Tentang kamu */}
                {hasBio && (
                  <div>
                    <div className="text-sm font-medium text-zinc-300">Tentang Kamu</div>
                    <div className="mt-3">
                      <label className="text-sm font-medium text-zinc-300">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={280}
                        placeholder="Ceritakan sedikit tentangmu…"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/40 resize-y"
                      />
                      <div className="mt-1 text-[11px] text-zinc-400">{bio.length}/280</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Btn
                    onClick={handleSave}
                    disabled={saving || avatarUploading}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 disabled:opacity-60"
                  >
                    {saving ? "Menyimpan…" : "Simpan Perubahan"}
                  </Btn>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </Card>
          </form>
        )}

        {/* Toast mini mengambang */}
        {msg && (
          <div
            role="status"
            aria-live="polite"
            className={[
              "fixed bottom-6 right-6 z-50 rounded-xl px-4 py-2 text-sm shadow-lg backdrop-blur",
              msg.type === "ok"
                ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-200"
                : "bg-rose-500/20 border border-rose-400/30 text-rose-200",
            ].join(" ")}
          >
            {msg.text}
          </div>
        )}
      </main>
    </div>
  );
}
