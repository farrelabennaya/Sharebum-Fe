// pages/AlbumDetail.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api.js";
import { Btn } from "../components/ui/Btn.jsx";
import { Card } from "../components/ui/Card.jsx";
import AlbumHeader from "../components/AlbumHeader.jsx";
import PagesToolbar from "../components/PagesToolbar.jsx";
import UploadPanel from "../components/UploadPanel.jsx";
import AssetsGrid from "../components/AssetsGrid.jsx";
import Lightbox from "../components/Lightbox.jsx";
import DeleteAlbumModal from "../components/modals/DeleteAlbumModal.jsx";
import DeletePageModal from "../components/modals/DeletePageModal.jsx";
import DeleteAssetModal from "../components/modals/DeleteAssetModal.jsx";
import SearchBar from "../components/SearchBar.jsx";
import FilterBar from "../components/FilterBar.jsx";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();

  // ===== state dasar =====
  const [album, setAlbum] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [pageId, setPageId] = React.useState(null);

  const [rename, setRename] = React.useState("");
  const [editingTitle, setEditingTitle] = React.useState(false);
  const titleRef = React.useRef(null);

  const [askDelete, setAskDelete] = React.useState(false);
  const [busyDelete, setBusyDelete] = React.useState(false);
  const [askDeletePage, setAskDeletePage] = React.useState(null);
  const [busyDelPage, setBusyDelPage] = React.useState(false);
  const [askDelAsset, setAskDelAsset] = React.useState(null);
  const [busyDelAsset, setBusyDelAsset] = React.useState(false);

  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [query, setQuery] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [adv, setAdv] = React.useState({
    hasCaption: false,
    from: null,
    to: null,
  });

  // asset-level social
  const [assetEmojiMap, setAssetEmojiMap] = React.useState({}); // { [assetId]: "❤" | null }
  const [assetCountsMap, setAssetCountsMap] = React.useState({}); // { [assetId]: {emoji:count} }
  const [assetCommentsMap, setAssetCommentsMap] = React.useState({}); // { [assetId]: [comments] }

  // viewer
  const [viewer, setViewer] = React.useState({ open: false, id: null });

  // ===== loaders =====
  async function loadAlbumDetail(id) {
    if (!id) return;
    setLoading(true);
    try {
      const a = await apiGet(`/api/albums/${id}`);
      setAlbum(a);
      if (!editingTitle) setRename(a.title || "");
      // const first = (a.pages || [])[0];
      // if (first) setPageId(first.id);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadAlbumDetail(albumId);
  }, [albumId]);
  React.useEffect(() => {
    if (editingTitle && titleRef.current)
      titleRef.current.focus({ preventScroll: true });
  }, [editingTitle]);

  // ===== derived =====
  const pages = album?.pages || [];
  const currentPage = React.useMemo(
    () => pages.find((p) => p.id === pageId) || null,
    [pages, pageId]
  );
  const assets = currentPage?.assets || [];

  const availableTags = React.useMemo(() => {
    const map = new Map();
    assets.forEach((a) => (a.tags || []).forEach((t) => map.set(t.id, t)));
    return Array.from(map.values());
  }, [assets]);

  const filteredAssets = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      const textHit = q
        ? (a.caption || "").toLowerCase().includes(q) ||
          (a.title || "").toLowerCase().includes(q)
        : true;
      const tags = (a.tags || []).map((t) => t.id);
      const tagHit = selectedTags.length
        ? selectedTags.every((id) => tags.includes(id))
        : true;
      const capHit = adv.hasCaption ? !!(a.caption && a.caption.trim()) : true;
      let dateHit = true;
      if (adv.from || adv.to) {
        const ts = a.created_at ? new Date(a.created_at).getTime() : 0;
        if (adv.from) dateHit = dateHit && ts >= new Date(adv.from).getTime();
        if (adv.to) dateHit = dateHit && ts <= new Date(adv.to).getTime();
      }
      return textHit && tagHit && capHit && dateHit;
    });
  }, [assets, query, selectedTags, adv]);

  const items = filteredAssets;
  const curIndex = React.useMemo(
    () => items.findIndex((a) => a.id === viewer.id),
    [items, viewer.id]
  );
  const curAsset = curIndex >= 0 ? items[curIndex] : null;

  // ===== actions =====
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const clearSelect = () => setSelected(new Set());
  const filterActive = selectedTags.length > 0 || adv.hasCaption;
  //  || !!query.trim() || !!adv.from || !!adv.to;

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    await apiPost("/api/assets/bulk-delete", { ids: Array.from(selected) });
    clearSelect();
    await loadAlbumDetail(albumId);
  }

  async function createPage() {
    await apiPost(`/api/albums/${albumId}/pages`, {});
    await loadAlbumDetail(albumId);
  }

  async function onDeletePage(pageIdToDelete) {
    setBusyDelPage(true);
    try {
      await apiDelete(`/api/pages/${pageIdToDelete}`);
      await loadAlbumDetail(albumId);
      setAskDeletePage(null);
    } catch (e) {
      alert(e.message || "Gagal menghapus page");
    } finally {
      setBusyDelPage(false);
    }
  }

  async function handleDeleteAsset() {
    if (!askDelAsset) return;
    setBusyDelAsset(true);
    try {
      await apiDelete(`/api/assets/${askDelAsset.id}`);
      await loadAlbumDetail(albumId);
      setAskDelAsset(null);
    } catch (e) {
      alert(e.message || "Gagal menghapus foto");
    } finally {
      setBusyDelAsset(false);
    }
  }

  async function loadAssetSocial(assetId) {
    if (!assetId) return;
    try {
      // endpoint privat (lihat bagian backend)
      const d = await apiGet(`/api/assets/${assetId}/social`, {
        allow401: true,
      });
      setAssetCountsMap((prev) => ({
        ...prev,
        [assetId]: d.reactions_breakdown || {},
      }));
      setAssetCommentsMap((prev) => ({ ...prev, [assetId]: d.comments || [] }));
      if (Object.prototype.hasOwnProperty.call(d, "selected_emoji")) {
        setAssetEmojiMap((prev) => ({
          ...prev,
          [assetId]: d.selected_emoji || null,
        }));
      }
    } catch (_) {}
  }

  async function saveRename() {
    if (!album) return;
    const title = rename.trim();
    if (!title || title === album.title) return;
    await apiPatch(`/api/albums/${album.id}`, { title });
    setAlbum((prev) => (prev ? { ...prev, title } : prev));
    setEditingTitle(false);
  }

  async function toggleAssetReact(assetId, emoji) {
    const prevEmoji = assetEmojiMap[assetId] ?? null;
    const prevCounts = { ...(assetCountsMap[assetId] || {}) };

    // optimistic
    const nextEmoji = prevEmoji === emoji ? null : emoji;
    const nextCounts = { ...prevCounts };
    if (prevEmoji && prevEmoji !== emoji) {
      nextCounts[prevEmoji] = (nextCounts[prevEmoji] || 1) - 1;
      if (nextCounts[prevEmoji] <= 0) delete nextCounts[prevEmoji];
    }
    if (nextEmoji) {
      nextCounts[nextEmoji] = (nextCounts[nextEmoji] || 0) + 1;
    } else if (prevEmoji === emoji) {
      nextCounts[emoji] = (nextCounts[emoji] || 1) - 1;
      if (nextCounts[emoji] <= 0) delete nextCounts[emoji];
    }
    setAssetEmojiMap((prev) => ({ ...prev, [assetId]: nextEmoji }));
    setAssetCountsMap((prev) => ({ ...prev, [assetId]: nextCounts }));

    // confirm ke server
    try {
      const res = await apiPost(`/api/assets/${assetId}/react`, { emoji });
      setAssetCountsMap((prev) => ({ ...prev, [assetId]: res.counts || {} }));
      setAssetEmojiMap((prev) => ({
        ...prev,
        [assetId]: res.selected_emoji || null,
      }));
    } catch (e) {
      // rollback
      setAssetEmojiMap((prev) => ({ ...prev, [assetId]: prevEmoji }));
      setAssetCountsMap((prev) => ({ ...prev, [assetId]: prevCounts }));
      alert("Gagal mengirim reaksi");
    }
  }

  async function submitAssetComment(assetId, text) {
    const body = text.trim();
    if (!body) return;
    try {
      const c = await apiPost(`/api/assets/${assetId}/comments`, { body });
      setAssetCommentsMap((prev) => {
        const list = prev[assetId] || [];
        return { ...prev, [assetId]: [c, ...list] };
      });
    } catch (e) {
      alert("Gagal kirim komentar");
    }
  }

  async function fetchAssetReactions(assetId) {
    return await apiGet(`/api/assets/${assetId}/reactions`, { allow401: true });
  }

  async function setVisibility(next) {
    if (!album) return;
    const id = album.id;
    setAlbum((a) => (a ? { ...a, visibility: next } : a)); // optimistic
    try {
      const updated = await apiPatch(`/api/albums/${id}`, { visibility: next });
      if (updated && typeof updated.visibility !== "undefined") {
        setAlbum((a) => (a ? { ...a, visibility: updated.visibility } : a));
      }
    } catch {
      await loadAlbumDetail(albumId);
      alert("Gagal set visibility");
    }
  }

  async function setPassword(passOrEmpty) {
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

  async function onDeleteAlbum() {
    if (!album) return;
    setBusyDelete(true);
    try {
      await apiDelete(`/api/albums/${album.id}`);
      setAskDelete(false);
      navigate("/dashboard"); // balik ke daftar
    } catch (e) {
      alert(e.message || "Gagal menghapus album");
    } finally {
      setBusyDelete(false);
    }
  }

  function onTitleChange(e) {
    if (!editingTitle) setEditingTitle(true);
    setRename(e.target.value);
  }

  function openViewer(id) {
    setViewer({ open: true, id });
  }
  function closeViewer() {
    setViewer((v) => ({ ...v, open: false }));
  }
  function prevViewer() {
    setViewer((v) => ({
      open: true,
      id: items[(curIndex - 1 + items.length) % items.length]?.id,
    }));
  }
  function nextViewer() {
    setViewer((v) => ({
      open: true,
      id: items[(curIndex + 1) % items.length]?.id,
    }));
  }
  const handleBack = () => {
    navigate("/dashboard", { replace: true });
  };

  React.useEffect(() => {
    if (viewer.open && curIndex === -1) setViewer({ open: false, id: null });
  }, [viewer.open, curIndex]);
  React.useEffect(() => {
    if (!viewer.open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") prevViewer();
      if (e.key === "ArrowRight") nextViewer();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewer.open, items.length]);

  React.useEffect(() => {
    const arr = album?.pages || [];
    if (!arr.length) return;

    // kalau belum ada pilihan -> coba restore dari localStorage, kalau ga ada pakai index 0
    if (pageId == null) {
      const saved = localStorage.getItem("lastPageId");
      const init =
        saved && arr.some((p) => String(p.id) === String(saved))
          ? saved
          : String(arr[0].id);
      setPageId(init);
      return;
    }

    // kalau page terpilih sudah tidak ada (mis. dihapus) -> fallback ke pertama
    if (!arr.some((p) => String(p.id) === String(pageId))) {
      setPageId(String(arr[0].id));
    }
    // ⚠️ sengaja tidak memasukkan pageId ke deps
  }, [album?.pages]);

  React.useEffect(() => {
    if (!viewer.open || !curAsset) return;
    loadAssetSocial(curAsset.id);

    // preload kiri-kanan
    const left = items[(curIndex - 1 + items.length) % items.length]?.id;
    const right = items[(curIndex + 1) % items.length]?.id;
    [left, right].forEach((id) => {
      if (id && !assetCountsMap[id]) loadAssetSocial(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer.open, curIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
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
          {/* tombol back */}
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
              className="shrink-0"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* judul */}
          <div className="font-semibold text-center truncate">
            {album?.title || "Loading…"}
          </div>

          {/* tombol settings */}
          <button
            onClick={() => navigate(`/dashboard/albums/${albumId}/settings`)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Pengaturan album"
            title="Pengaturan"
          >
            {/* ikon gear */}
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
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.04 3.4l.06.06c.48.48 1.17.62 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51.65.29 1.34.15 1.82-.33l.06-.06A2 2 0 1 1 20.6 6.22l-.06.06c-.48.48-.62 1.17-.33 1.82.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1Z"></path>
            </svg>
          </button>
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
            <PagesToolbar
              pages={pages}
              pageId={pageId}
              setPageId={setPageId}
              onCreatePage={createPage}
              onReorder={async (id, dir) => {
                const idx = pages.findIndex((p) => p.id === id);
                const target = idx + (dir === "up" ? -1 : 1);
                if (target < 0 || target >= pages.length) return;
                const newOrder = [...pages];
                const [moved] = newOrder.splice(idx, 1);
                newOrder.splice(target, 0, moved);
                const payload = {
                  order: Object.fromEntries(newOrder.map((p, i) => [p.id, i])),
                };
                await apiPatch(`/api/pages/${albumId}/reorder`, payload);
                await loadAlbumDetail(albumId);
              }}
              onAskDeletePage={setAskDeletePage}
            />

            {currentPage && (
              <div className="grid grid-cols-1 gap-6">
                <UploadPanel
                  albumId={albumId}
                  pageId={pageId}
                  onUploaded={() => loadAlbumDetail(albumId)}
                />

                <div className="space-y-3">
                  <SearchBar value={query} onChange={setQuery} />
                  <FilterBar
                    tags={availableTags}
                    selected={selectedTags}
                    onChangeSelected={setSelectedTags}
                    advanced={adv}
                    onChangeAdvanced={setAdv}
                  />

                  <AssetsGrid
                    assets={filteredAssets}
                    albumId={albumId}
                    pageId={currentPage?.id}
                    filterActive={filterActive}
                    selectMode={selectMode}
                    selected={selected}
                    onToggleSelect={toggleSelect}
                    onToggleSelectMode={() => setSelectMode((v) => !v)}
                    onClearSelect={clearSelect}
                    onBulkDelete={handleBulkDelete}
                    onOpenViewer={openViewer}
                    onAskDeleteAsset={setAskDelAsset}
                    onOptimisticReorder={(next) => {
                      setAlbum((prev) => {
                        if (!prev || !currentPage) return prev;
                        const pages = prev.pages.map((p) =>
                          p.id === currentPage.id ? { ...p, assets: next } : p
                        );
                        return { ...prev, pages };
                      });
                    }}
                    onCoverUpdate={(cover) => {
                      setAlbum((prev) =>
                        prev ? { ...prev, cover_url: cover } : prev
                      );
                    }}
                    onNeedRefresh={() => loadAlbumDetail(albumId)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {viewer.open && curAsset && (
        <Lightbox
          asset={curAsset}
          onClose={closeViewer}
          onPrev={prevViewer}
          onNext={nextViewer}
          // navigasi ujung (kalau mau non-looping, kirim boolean ini)
          hasPrev={curIndex > 0}
          hasNext={curIndex < items.length - 1}
          index={curIndex}
          total={items.length}
          // ✨ SOCIAL DATA ✨
          counts={assetCountsMap[curAsset.id] || {}}
          selectedEmoji={assetEmojiMap[curAsset.id] ?? null}
          comments={assetCommentsMap[curAsset.id] || []}
          onPickEmoji={(e) => toggleAssetReact(curAsset.id, e)}
          onDoubleClick={() => toggleAssetReact(curAsset.id, "❤")}
          onSubmitComment={(text) => submitAssetComment(curAsset.id, text)}
          onFetchReactions={(assetId) => fetchAssetReactions(assetId)} // opsional (viewer "who reacted")
          onTagsUpdated={(assetId, nextTags) => {
            setAlbum((prev) => {
              if (!prev || !currentPage) return prev;
              const pages = prev.pages.map((p) =>
                p.id !== currentPage.id
                  ? p
                  : {
                      ...p,
                      assets: p.assets.map((a) =>
                        a.id === assetId ? { ...a, tags: nextTags } : a
                      ),
                    }
              );
              return { ...prev, pages };
            });
          }}
          onDelete={(a) =>
            setAskDelAsset({
              id: a.id,
              url: a.variants?.thumb || a.url,
              caption: a.caption || "",
            })
          }
          onCaptionSave={async (a, caption) => {
            setAlbum((prev) => {
              if (!prev || !currentPage) return prev;
              const pages = prev.pages.map((p) =>
                p.id !== currentPage.id
                  ? p
                  : {
                      ...p,
                      assets: p.assets.map((x) =>
                        x.id === a.id ? { ...x, caption } : x
                      ),
                    }
              );
              return { ...prev, pages };
            });
            try {
              await apiPatch(`/api/assets/${a.id}`, { caption });
            } catch {
              await loadAlbumDetail(albumId);
            }
          }}
          onSetCover={async (a) => {
            await apiPost(`/api/albums/${albumId}/cover`, { asset_id: a.id });
            const cover = a.variants?.md || a.url;
            setAlbum((prev) => (prev ? { ...prev, cover_url: cover } : prev));
          }}
        />
      )}

      <DeleteAlbumModal
        open={askDelete}
        busy={busyDelete}
        onCancel={() => setAskDelete(false)}
        onConfirm={onDeleteAlbum}
      />
      <DeletePageModal
        pageId={askDeletePage}
        busy={busyDelPage}
        onCancel={() => setAskDeletePage(null)}
        onConfirm={onDeletePage}
      />
      <DeleteAssetModal
        askDelAsset={askDelAsset}
        busy={busyDelAsset}
        onCancel={() => setAskDelAsset(null)}
        onConfirm={handleDeleteAsset}
      />
    </div>
  );
}
