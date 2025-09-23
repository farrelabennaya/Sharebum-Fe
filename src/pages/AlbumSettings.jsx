// pages/AlbumSettings.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";
import PasswordModal from "../components/AlbumHeader/PasswordModal.jsx";
import DeleteAlbumModal from "../components/modals/DeleteAlbumModal.jsx";

export default function AlbumSettings() {
  const { albumId } = useParams();
  const navigate = useNavigate();

  // ===== state dasar =====
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  // judul
  const [rename, setRename] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef(null);

  // password modal
  const [pwdOpen, setPwdOpen] = useState(false);
  const [removingPwd, setRemovingPwd] = React.useState(false);
  // const [pwdVal, setPwdVal] = useState("");

  // delete modal
  const [askDelete, setAskDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const [toast, setToast] = React.useState({
    open: false,
    msg: "",
    type: "success",
  });
  const toastTimer = React.useRef(null);
  const showToast = (msg, type = "success") => {
    setToast({ open: true, msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, open: false })),
      2200
    );
  };
  React.useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  async function loadAlbum() {
    setLoading(true);
    try {
      const a = await apiGet(`/api/albums/${albumId}`);
      setAlbum(a);
      setRename(a?.title || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbum();
  }, [albumId]);

  useEffect(() => {
    if (editingTitle && titleRef.current)
      titleRef.current.focus({ preventScroll: true });
  }, [editingTitle]);

  // ===== handlers =====
  function onTitleChange(e) {
    if (!editingTitle) setEditingTitle(true);
    setRename(e.target.value);
  }

  function onCancelRename() {
    if (!album) return;
    setRename(album.title || "");
    setEditingTitle(false);
  }

  async function onSaveRename() {
    if (!album) return;
    const title = rename.trim();
    if (!title || title === album.title) return;
    await apiPatch(`/api/albums/${album.id}`, { title });
    setAlbum((prev) => (prev ? { ...prev, title } : prev));
    setEditingTitle(false);
    showToast("Judul album disimpan");
  }

  async function onSetVisibility(next) {
    if (!album) return;
    setAlbum((a) => (a ? { ...a, visibility: next } : a)); // optimistic
    try {
      const updated = await apiPatch(`/api/albums/${album.id}`, {
        visibility: next,
      });
      if (updated && typeof updated.visibility !== "undefined") {
        setAlbum((a) => (a ? { ...a, visibility: updated.visibility } : a));
      }
    } catch {
      await loadAlbum();
      alert("Gagal set visibility");
    }
  }

  async function onSetPassword(passOrEmpty) {
    if (!album) return;
    try {
      const res = await apiPatch(`/api/albums/${album.id}`, {
        password: passOrEmpty,
      });
      if (typeof res?.password_protected !== "undefined") {
        setAlbum((a) =>
          a ? { ...a, password_protected: res.password_protected } : a
        );
      } else {
        setAlbum((a) => (a ? { ...a, password_protected: !!passOrEmpty } : a));
      }
    } catch {
      alert("Gagal set password");
    }
  }

  async function handleRemovePwd() {
    if (!album || removingPwd) return;
    setRemovingPwd(true);
    try {
      await onSetPassword(""); // ← ini yang benar: clear password ke backend
    } catch (e) {
      alert("Gagal hapus password");
    } finally {
      setRemovingPwd(false);
    }
  }

  async function onDeleteAlbum() {
    if (!album) return;
    setBusyDelete(true);
    try {
      await apiDelete(`/api/albums/${album.id}`);
      setAskDelete(false);
      navigate("/dashboard");
    } catch (e) {
      alert(e.message || "Gagal menghapus album");
    } finally {
      setBusyDelete(false);
    }
  }

  function handleBack() {
    navigate(`/dashboard/albums/${albumId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      {/* background dekor */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto,1fr,auto] items-center gap-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Kembali"
            title="Kembali"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="font-semibold text-center truncate">
            Album Settings
          </div>
          <span />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading && (
          <Card>
            <div className="p-4 text-zinc-500">Loading...</div>
          </Card>
        )}

        {!loading && !album && (
          <Card>
            <div className="p-4 text-zinc-500">Album tidak ditemukan.</div>
          </Card>
        )}

        {!loading && album && (
          <>
            <Card>
              <div className="p-4 sm:p-6 space-y-5">
                <TitleEditor
                  rename={rename}
                  onTitleChange={onTitleChange}
                  onSaveRename={onSaveRename}
                  titleRef={titleRef}
                  originalTitle={album?.title || ""}
                  editing={editingTitle}
                  onCancelRename={onCancelRename}
                />

                <LinkBox slug={album.slug} />

                <VisibilitySection
                  value={album.visibility ?? "private"}
                  onChange={onSetVisibility}
                />

                <PasswordSection
                  protected={!!album.password_protected}
                  onSetClick={() => setPwdOpen(true)}
                  ove={async () => onSetPassword("")}
                  onRemove={handleRemovePwd}
                  removing={removingPwd}
                />
              </div>
            </Card>

            <DangerZone
              onDelete={() => setAskDelete(true)}
              albumTitle={album.title}
            />
          </>
        )}
      </main>

      {/* Modal Set Password */}
      <PasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        // pakai salah satu callback yang tersedia di komponenmu:
        onSubmit={async (password) => {
          await onSetPassword(password);
          setPwdOpen(false);
        }}
        onConfirm={async (password) => {
          await onSetPassword(password);
          setPwdOpen(false);
        }}
        passwordProtected={!!album?.password_protected}
        onSetPassword={onSetPassword}
      />

      {/* Modal Delete */}
      <DeleteAlbumModal
        open={askDelete}
        busy={busyDelete}
        onCancel={() => setAskDelete(false)}
        onConfirm={onDeleteAlbum}
      />

      {/* Toast */}
      {toast.open && (
        <div
          className="fixed z-50 left-1/2 -translate-x-1/2 w-full px-4"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }} // aman untuk notch
        >
          <div
            role="status"
            aria-live="polite"
            className={[
              // ukuran: full di mobile, besar di desktop
              "mx-auto w-full max-w-xl md:max-w-2xl",
              // layout & tampilan
              "flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md",
              "break-words", // teks panjang bungkus rapi
              // warna sesuai tipe
              toast.type === "success"
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200"
                : "bg-rose-500/15 border-rose-400/30 text-rose-200",
            ].join(" ")}
          >
            <span className="text-base">
              {toast.type === "success" ? "✅" : "⚠️"}
            </span>
            <span className="text-sm font-medium whitespace-pre-line">
              {toast.msg}
            </span>
            <button
              onClick={() => setToast((t) => ({ ...t, open: false }))}
              className="ml-auto text-xs px-2 py-1 rounded-lg hover:bg-white/10 shrink-0"
              aria-label="Tutup notifikasi"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Sub-komponen dalam 1 file ====== */

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-lg shadow-black/30 overflow-hidden">
      {children}
    </div>
  );
}

function TitleEditor({
  rename,
  onTitleChange,
  onSaveRename,
  titleRef,
  originalTitle = "",
  editing = false,
  onCancelRename,
}) {
  const len = (rename || "").trim().length;
  const canSave = len > 0;
  const dirty = (rename || "").trim() !== (originalTitle || "").trim();
  const showActions = editing || dirty;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">Judul Album</label>

      <div className="flex flex-col sm:flex-row gap-2 min-w-0">
        <div className="relative group flex-1 basis-0 min-w-0">
          <input
            ref={titleRef}
            value={rename}
            onChange={onTitleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave && dirty) onSaveRename?.();
              if (e.key === "Escape" && showActions) onCancelRename?.();
            }}
            aria-invalid={!canSave}
            aria-describedby="title-help"
            placeholder="Masukkan nama album…"
            maxLength={120}
            title={rename}
            className={[
              "w-full rounded-xl px-3.5 py-2.5 pr-16 text-sm text-white",
              "truncate",
              "bg-white/5 border border-white/10",
              "focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/30",
              "outline-none transition-all duration-200",
              "group-hover:border-white/20",
              !canSave ? "ring-1 ring-rose-500/25" : "",
            ].join(" ")}
          />

          {/* counter */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
            {len}/120
          </div>
        </div>

        {/* Actions: muncul hanya saat ada perubahan */}
        {showActions ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelRename}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10 bg-white/5 hover:bg-white/10"
              title="Batalkan perubahan judul"
            >
              Batal
            </button>
            <button
              onClick={onSaveRename}
              disabled={!canSave || !dirty}
              className={[
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                "bg-violet-500 border border-violet-600 text-white",
                "shadow-lg shadow-fuchsia-900/30 hover:opacity-95 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
              title="Simpan judul"
            >
              <span className="sm:inline">Simpan</span>
              {/* <span className="sm:hidden">✓</span> */}
            </button>
          </div>
        ) : (
          // keadaan default: tombol simpan tunggal (opsional bisa disembunyikan total)
          <button
            onClick={onSaveRename}
            disabled={!canSave || !dirty}
            className={[
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              "bg-violet-500 border border-violet-600 text-white",
              "shadow-lg shadow-fuchsia-900/30 hover:opacity-95 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <span className="sm:inline">Simpan</span>
            {/* <span className="sm:hidden">✓</span> */}
          </button>
        )}
      </div>

      <p
        id="title-help"
        className={[
          "text-xs",
          !canSave ? "text-rose-300" : "text-zinc-500",
        ].join(" ")}
      >
        {!canSave ? (
          // selalu tampil (mobile & desktop) saat judul kosong
          "Judul tidak boleh kosong."
        ) : (
          // selain itu, pesan keyboard hanya di desktop
          <>
            <span className="hidden sm:inline">
              {showActions
                ? "Enter untuk simpan, Esc untuk batal."
                : "Tekan Enter untuk cepat menyimpan."}
            </span>
            {/* mobile sengaja kosong */}
          </>
        )}
      </p>
    </div>
  );
}

function VisibilitySection({ value, onChange }) {
  const options = [
    { v: "private", label: "Private", desc: "Hanya kamu yang bisa melihat." },
    {
      v: "unlisted",
      label: "Unlisted",
      desc: "Tidak muncul publik, hanya yang punya link.",
    },
    { v: "public", label: "Public", desc: "Terbuka untuk semua orang." },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-300">Visibility</div>
      <div className="grid sm:grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange?.(o.v)}
              className={[
                "text-left rounded-xl p-3 border transition-all",
                active
                  ? "border-violet-400/40 bg-violet-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="font-semibold text-sm">{o.label}</div>
              <div className="text-xs text-zinc-400">{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PasswordSection({
  protected: isProtected,
  onSetClick,
  onRemove,
  removing = false,
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-zinc-300">Password</div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 text-sm text-zinc-300">
          {isProtected ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Password aktif.
            </span>
          ) : (
            <span className="text-zinc-400">Belum ada password.</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSetClick}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 hover:bg-white/10"
          >
            {isProtected ? "Ganti Password" : "Set Password"}
          </button>
          {isProtected && (
            <button
              onClick={onRemove}
              disabled={removing}
              className="px-3 py-2 rounded-lg text-sm bg-rose-600/20 border border-rose-500/30 text-rose-200 hover:bg-rose-600/30"
            >
              {removing ? "Menghapus…" : "Hapus Password"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkBox({ slug }) {
  const href = slug ? `/album/${slug}` : null;

  async function copyLink(e) {
    e?.preventDefault?.();

    const text = fullUrl; // pastikan variabel ini ada di scope kamu

    // 1) Coba Clipboard API (butuh HTTPS/localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        toastCopied(); // optional: tampilkan notifikasi
        return;
      } catch (err) {
        // lanjut ke fallback
      }
    }

    // 2) Fallback aman untuk iOS/HTTP/in-app browser
    try {
      const ta = document.createElement("textarea");
      ta.value = text;

      // iOS lebih rewel: jangan readonly
      // styling supaya ga "loncat" layout
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";

      document.body.appendChild(ta);

      // select & copy
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length); // iOS

      const ok = document.execCommand("copy");
      document.body.removeChild(ta);

      if (ok) {
        toastCopied();
        return;
      }
    } catch (_) {
      // lanjut ke plan C
    }

    // 3) Plan C: web share (kalau ada)
    if (navigator.share) {
      try {
        await navigator.share({ title: "Link Album", url: text, text });
        return;
      } catch {
        // user cancel / gagal — lanjut terakhir
      }
    }

    // 4) Plan D: kasih prompt manual (paling jadul)
    window.prompt("Salin link ini:", text);
  }

  // Drop-in toast util (vanilla JS + Tailwind classes)
  function toastCopied(
    msg = "Link disalin",
    type = "success",
    duration = 2200
  ) {
    // Hapus toast lama biar nggak numpuk
    const prev = document.getElementById("app-toast");
    if (prev) prev.remove();

    // Wrapper yang nge-center di top + aman untuk notch
    const wrap = document.createElement("div");
    wrap.id = "app-toast";
    wrap.className = "fixed z-50 left-1/2 -translate-x-1/2 w-full px-4";
    wrap.style.top = "calc(env(safe-area-inset-top, 0px) + 16px)";

    // Box isi toast (mirip yang kamu pakai)
    const box = document.createElement("div");
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.className = [
      "mx-auto w-full max-w-xl md:max-w-2xl",
      "flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md",
      "break-words transition-all duration-200",
      type === "success"
        ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200"
        : "bg-rose-500/15 border-rose-400/30 text-rose-200",
    ].join(" ");

    // Emoji status
    const icon = document.createElement("span");
    icon.className = "text-base";
    icon.textContent = type === "success" ? "✅" : "⚠️";

    // Pesan
    const text = document.createElement("span");
    text.className = "text-sm font-medium whitespace-pre-line";
    text.textContent = msg;

    // Tombol tutup
    const btn = document.createElement("button");
    btn.className =
      "ml-auto text-xs px-2 py-1 rounded-lg hover:bg-white/10 shrink-0";
    btn.setAttribute("aria-label", "Tutup notifikasi");
    btn.textContent = "Tutup";

    // Susun DOM
    box.appendChild(icon);
    box.appendChild(text);
    box.appendChild(btn);
    wrap.appendChild(box);
    document.body.appendChild(wrap);

    // Animasi masuk/keluar halus
    box.style.opacity = "0";
    box.style.transform = "translateY(-6px)";
    requestAnimationFrame(() => {
      box.style.opacity = "1";
      box.style.transform = "translateY(0)";
    });

    // Auto dismiss
    const timer = setTimeout(close, duration);

    // Close handler
    btn.addEventListener("click", close);

    function close() {
      clearTimeout(timer);
      box.style.opacity = "0";
      box.style.transform = "translateY(-6px)";
      setTimeout(() => wrap.remove(), 180);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = href ? origin + href : "";

  return (
    <div className="p-3 rounded-xl border bg-white/5 border-white/10 overflow-hidden">
      <div className="text-xs font-medium text-zinc-300 mb-1">Link Album</div>

      {href ? (
        <div className="flex sm:flex-row flex-col sm:items-center items-stretch gap-2 min-w-0 w-full">
          <a
            className="block flex-1 basis-0 min-w-0 max-w-full truncate text-sm text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={fullUrl}
          >
            {fullUrl}
          </a>

          <button
            onClick={copyLink}
            className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 transition"
            title="Salin link"
          >
            Salin
          </button>
        </div>
      ) : (
        <span className="text-sm text-zinc-400 italic">
          Slug belum tersedia
        </span>
      )}
    </div>
  );
}

function DangerZone({ onDelete, albumTitle }) {
  return (
    <Card>
      <div className="p-4 sm:p-6">
        <div className="text-sm font-semibold text-rose-300 mb-2">
          Perhatian!
        </div>
        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-3">
          <div className="text-sm text-zinc-300 flex-1">
            Menghapus album{" "}
            <span className="font-semibold text-white">
              “{(albumTitle ?? "").slice(0, 80)}”
            </span>{" "}
            akan menghapus semua halaman & aset di dalamnya.
          </div>
          <button
            onClick={onDelete}
            className="shrink-0 px-3 py-2  font-semibold text-sm rounded-lg
                  bg-rose-600/90 text-white border border-rose-500
                  hover:bg-rose-600 shadow-lg shadow-rose-900/30
                  transition"
          >
            Hapus Album
          </button>
        </div>
      </div>
    </Card>
  );
}
