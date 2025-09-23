import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import AlbumPublicHeader from "../components/AlbumPublicHeader";
import GalleryGrid from "../components/GalleryGrid";
import LightboxPublic from "../components/LightboxPublic";
import CommentForm from "../components/CommentForm";
import PasswordModal from "../components/modals/PasswordModal";
import LoginRequiredModal from "../components/modals/LoginRequiredModal";

export default function PublicAlbum() {
  const { slug } = useParams();

  // album + ui
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // password
  const passKey = `album_pass_${slug}`;
  const [needPass, setNeedPass] = useState(false);
  const [pass, setPass] = useState(localStorage.getItem(passKey) || "");

  // album-level reactions & comments
  const emojiKey = `selEmoji:${slug}`;
  const [selectedEmoji, setSelectedEmoji] = useState(
    () => localStorage.getItem(emojiKey) || null
  );
  const [counts, setCounts] = useState({});
  const [comments, setComments] = useState([]);
  const [showLogin, setShowLogin] = useState(false);

  // asset-level states
  const [viewer, setViewer] = useState({ open: false, idx: 0 });
  const [assetEmojiMap, setAssetEmojiMap] = useState({});
  const [assetCountsMap, setAssetCountsMap] = useState({});
  const [assetCommentsMap, setAssetCommentsMap] = useState({});

  // ====== data ======
  async function fetchAlbum(withPass) {
    setLoading(true);
    try {
      const headers = {};
      if (withPass) headers["X-Album-Pass"] = withPass;

      const a = await apiGet(`/api/public/albums/${slug}`, {
        headers,
        allow401: true,
      });

      setAlbum(a);
      setCounts(a.reactions_breakdown || {});
      setComments(a.comments || []);

      if (a?.is_authenticated) {
        setSelectedEmoji(a.selected_emoji ?? null);
        if (a.selected_emoji) localStorage.setItem(emojiKey, a.selected_emoji);
        else localStorage.removeItem(emojiKey);
      }

      setNeedPass(false);
      if (withPass) localStorage.setItem(passKey, withPass);
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem(passKey);
        setNeedPass(true);
      } else {
        setError("Gagal buka album");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(passKey);
    fetchAlbum(saved || undefined);
  }, [slug]);

  // items: urut page.index → asset.order
  const items = useMemo(() => {
    if (!album) return [];
    return (album.pages || [])
      .slice()
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .flatMap((p) =>
        (p.assets || []).slice().sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      );
  }, [album]);

  // ====== reactions ======
  async function toggleReact(emoji) {
    try {
      const res = await apiPost(`/api/public/albums/${slug}/react`, { emoji });
      setCounts(res.counts || {});
      setSelectedEmoji(res.selected_emoji ?? null);
      if (res.selected_emoji)
        localStorage.setItem(emojiKey, res.selected_emoji);
      else localStorage.removeItem(emojiKey);
    } catch (e) {
      if (e.status === 401) setShowLogin(true);
      else alert("Gagal submit reaksi");
    }
  }

  function applyAssetSelectedEmojiFromResponse(assetId, d, isAuthed) {
    if (!Object.prototype.hasOwnProperty.call(d, "selected_emoji")) return;
    const serverVal = d.selected_emoji; // string/null
    if (serverVal) {
      setAssetEmojiMap((prev) => ({ ...prev, [assetId]: serverVal }));
      localStorage.setItem(`selEmoji:${slug}:asset:${assetId}`, serverVal);
      return;
    }
    if (isAuthed === true) {
      setAssetEmojiMap((prev) => ({ ...prev, [assetId]: null }));
      localStorage.removeItem(`selEmoji:${slug}:asset:${assetId}`);
    }
  }

  async function loadAssetDetailsByIndex(i) {
    const asset = items[i];
    if (!asset) return;
    try {
      const d = await apiGet(`/api/public/albums/${slug}/assets/${asset.id}`, {
        allow401: true,
      });
      setAssetCountsMap((prev) => ({
        ...prev,
        [asset.id]: d.reactions_breakdown || {},
      }));
      setAssetCommentsMap((prev) => ({
        ...prev,
        [asset.id]: d.comments || [],
      }));
      applyAssetSelectedEmojiFromResponse(asset.id, d);
    } catch {
      // no-op
    }
  }

  // viewer helpers
  async function openViewer(i) {
    setViewer({ open: true, idx: i });
    const id = items[i]?.id;
    if (id && (!assetCountsMap[id] || !assetEmojiMap[id])) {
      await loadAssetDetailsByIndex(i);
    }
  }
  const closeViewer = () => setViewer((v) => ({ ...v, open: false }));
  const prev = () =>
    setViewer((v) => ({
      open: true,
      idx: (v.idx - 1 + items.length) % items.length,
    }));
  const next = () =>
    setViewer((v) => ({ open: true, idx: (v.idx + 1) % items.length }));

  async function toggleAssetReact(assetId, emoji) {
    const prevEmoji = assetEmojiMap[assetId];
    const prevCounts = { ...(assetCountsMap[assetId] || {}) };

    const newEmoji = prevEmoji === emoji ? null : emoji;
    const nextCounts = { ...prevCounts };

    if (prevEmoji && prevEmoji !== emoji) {
      nextCounts[prevEmoji] = (nextCounts[prevEmoji] || 1) - 1;
      if (nextCounts[prevEmoji] <= 0) delete nextCounts[prevEmoji];
    }
    if (newEmoji) {
      nextCounts[newEmoji] = (nextCounts[newEmoji] || 0) + 1;
    } else if (prevEmoji === emoji) {
      nextCounts[emoji] = (nextCounts[emoji] || 1) - 1;
      if (nextCounts[emoji] <= 0) delete nextCounts[emoji];
    }

    setAssetEmojiMap((prev) => ({ ...prev, [assetId]: newEmoji }));
    setAssetCountsMap((prev) => ({ ...prev, [assetId]: nextCounts }));

    try {
      const res = await apiPost(
        `/api/public/albums/${slug}/assets/${assetId}/react`,
        { emoji }
      );
      setAssetCountsMap((prev) => ({ ...prev, [assetId]: res.counts || {} }));
      setAssetEmojiMap((prev) => ({
        ...prev,
        [assetId]: res.selected_emoji || null,
      }));
      const k = `selEmoji:${slug}:asset:${assetId}`;
      if (res.selected_emoji) localStorage.setItem(k, res.selected_emoji);
      else localStorage.removeItem(k);
    } catch (e) {
      setAssetEmojiMap((prev) => ({ ...prev, [assetId]: prevEmoji }));
      setAssetCountsMap((prev) => ({ ...prev, [assetId]: prevCounts }));
      if (e.status === 401) setShowLogin(true);
    }
  }

  // preload asset details sekitar index
  useEffect(() => {
    if (!viewer.open) return;
    loadAssetDetailsByIndex(viewer.idx);
    const around = [
      (viewer.idx - 1 + items.length) % items.length,
      (viewer.idx + 1) % items.length,
    ];
    around.forEach((i) => {
      const id = items[i]?.id;
      if (id && !assetCountsMap[id]) loadAssetDetailsByIndex(i);
    });
  }, [viewer.open, viewer.idx]); // eslint-disable-line

  // ====== UI states ======
  const idx = Math.max(0, Math.min(items.length - 1, viewer.idx ?? 0));
  const len = items.length;

  const hasPrev = idx > 0;
  const hasNext = idx < len - 1;

  // kalau prev/next kamu saat ini masih pakai modulo (loop), bungkus biar aman
  const safePrev = () => {
    if (hasPrev) prev();
  };
  const safeNext = () => {
    if (hasNext) next();
  };

  const current = items[idx];
  const currentId = current?.id;

  if (loading)
    return <div className="max-w-6xl mx-auto text-center p-6">Loading…</div>;
  if (needPass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
        <PasswordModal
          open
          pass={pass}
          onChange={setPass}
          onSubmit={(e) => {
            e.preventDefault();
            fetchAlbum(pass.trim());
          }}
        />
      </div>
    );
  }
  if (error)
    return (
      <div className="max-w-6xl mx-auto p-6 text-red-600">
        Gagal memuat: {error}
      </div>
    );
  if (!album)
    return (
      <div className="max-w-6xl mx-auto text-center p-6">
        Album tidak ditemukan.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse delay-1000" />
      </div>
      <AlbumPublicHeader
        title={album.title}
        photoCount={items.length}
        counts={counts}
        selectedEmoji={selectedEmoji}
        onToggleReact={toggleReact}
      />

      <main className="max-w-6xl mx-auto px-4 md:px-6 pb-10">
        <GalleryGrid items={items} onOpen={openViewer} />

        {/* <section className="max-w-3xl mx-auto mt-10 space-y-4">
          <h3 className="font-semibold">Komentar</h3>
          <CommentForm
            onSubmit={async (text) => {
              try {
                const c = await apiPost(
                  `/api/public/albums/${slug}/comments`,
                  { body: text },
                  { allow401: true }
                );
                setComments((prev) => [c, ...prev]);
              } catch (e) {
                const status = e?.status ?? e?.response?.status;
                if (status === 401) setShowLogin(true);
                else alert("Gagal kirim komentar");
              }
            }}
          />
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="p-3 border rounded-lg">
                <div className="text-sm font-medium">{c.user_name}</div>
                <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                <div className="text-xs text-zinc-500">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-sm text-zinc-500">Belum ada komentar.</div>
            )}
          </div>
        </section> */}

        {items.length === 0 && (
          <div className="text-sm text-zinc-500 mt-6">
            Belum ada foto pada album ini.
          </div>
        )}
      </main>

      {/* Lightbox */}
      {viewer.open && items[viewer.idx] && (
        <LightboxPublic
          asset={items[viewer.idx]}
          onClose={closeViewer}
          onPrev={safePrev} // ⬅ aman di ujung
          onNext={safeNext} // ⬅ aman di ujung
          hasPrev={idx > 0}
          hasNext={idx < len - 1}
          index={idx}
          total={len}
          onFetchReactions={async (assetId) => {
            // kalau album pakai password, teruskan header X-Album-Pass biar konsisten dgn /public/albums/{slug}
            const headers = {};
            if (pass) headers["X-Album-Pass"] = pass;

            const data = await apiGet(
              `/api/public/albums/${slug}/assets/${assetId}/reactions`,
              { headers, noAuth: true, allow401: true }
            );
            // bentuknya: { "❤": [ {id,user_id,user_name,created_at,user_avatar?} ], ... }
            return data;
          }}
          onDoubleClick={() => toggleAssetReact(items[viewer.idx].id, "❤")}
          counts={assetCountsMap[items[viewer.idx].id] || {}}
          selectedEmoji={
            assetEmojiMap[items[viewer.idx].id] ??
            localStorage.getItem(
              `selEmoji:${slug}:asset:${items[viewer.idx].id}`
            ) ??
            null
          }
          onPickEmoji={(e) => toggleAssetReact(items[viewer.idx].id, e)}
          comments={assetCommentsMap[items[viewer.idx].id] || []}
          onSubmitComment={async (text) => {
            try {
              const c = await apiPost(
                `/api/public/albums/${slug}/assets/${
                  items[viewer.idx].id
                }/comments`,
                { body: text }
              );
              setAssetCommentsMap((prev) => {
                const id = items[viewer.idx].id;
                const list = prev[id] || [];
                return { ...prev, [id]: [c, ...list] };
              });
            } catch (e) {
              if (e.status === 401) setShowLogin(true);
            }
          }}
        />
      )}

      <PasswordModal
        open={needPass}
        pass={pass}
        onChange={setPass}
        onSubmit={(e) => {
          e.preventDefault();
          fetchAlbum(pass.trim());
        }}
      />

      <LoginRequiredModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </div>
  );
}
