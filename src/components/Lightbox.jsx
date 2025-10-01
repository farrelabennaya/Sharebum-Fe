import React, { useEffect, useRef, useState, Suspense } from "react";
// import { useIdle } from "../hooks/useIdle";
// import EmojiPicker from "./EmojiPicker";
import { MessageCircleMore, Users } from "lucide-react";
const EmojiPicker = React.lazy(() => import("emoji-picker-react"));
import { getAssetTags, addAssetTags, removeAssetTag } from "../lib/api";
import Avatar from "./ui/Avatar";

export default function LightboxPublic({
  asset,
  onClose,
  onPrev,
  onNext,
  onDoubleClick,
  assetCounts = {},
  counts = {},
  selectedEmoji = null,
  onPickEmoji, // (emoji) => void
  comments = [],
  onSubmitComment, // (text) => Promise<void>
  reactionsByEmoji = null, // { "❤": [ {id,user_id,user_name,created_at,user_avatar?} ] , ... }
  onFetchReactions, // async (assetId) => Promise<reactionsByEmoji>
  hasPrev = true, // ❗️baru
  hasNext = true, // ❗️baru
  index = 0, // 0-based
  total = 0, // total item
  // ⬇️ kebab actions (opsional; aman kalau nggak dikirim)
  onDelete, // (asset)=>void
  onCaptionSave, // (asset, caption)=>Promise|void
  onSetCover, // (asset)=>Promise|void
  onTagsUpdated, // (assetId, tags)=>void
}) {
  const canPrev = !!hasPrev;
  const canNext = !!hasNext;

  // di atas komponen
  const [chromeVisible, setChromeVisible] = useState(true);
  const toggleChrome = () => setChromeVisible((v) => !v);

  const wrapRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  // const idle = useIdle(1800);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const pickerRef = useRef(null);
  const pickerBtnRef = useRef(null);
  const popoverWrapRef = useRef(null);
  const [showComments, setShowComments] = useState(false);
  const commentCount = comments?.length ?? 0;

  // tambahkan di atas (bersama state lain)
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const pointers = useRef(new Map()); // untuk pinch (2 pointer)
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const pinchStartMid = useRef({ x: 0, y: 0 });
  const startTx = useRef(0);
  const startTy = useRef(0);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const lastTapAt = useRef(0);
  const ignoreNextDblClick = useRef(false);
  const [origin, setOrigin] = useState("50% 50%"); // transform-origin
  const prevScale = useRef(1);
  // Auto-grow textarea + kontrol scrollbar
  const [taOverflow, setTaOverflow] = useState(false);
  const taRef = useRef(null);
  // ===== Reactions Viewer state =====
  const [showReacts, setShowReacts] = useState(false);
  const [reacts, setReacts] = useState(reactionsByEmoji || null);
  const [reactsLoading, setReactsLoading] = useState(false);
  const [reactsErr, setReactsErr] = useState("");
  const [reactFilter, setReactFilter] = useState("ALL"); // "ALL" | "❤" | "🔥" | ...
  const asEmoji = (v) => (typeof v === "string" ? v : v?.emoji || "");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [tmpCaption, setTmpCaption] = useState(asset?.caption || "");
  const inputRef = useRef(null);

  // --- tags panel ---
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tags, setTags] = useState([]); // [{id,name}]
  const [tagInp, setTagInp] = useState("");

  const TA_MIN = 44; // px
  const TA_MAX = 120; // px

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const MAX_SCALE = 4; // atur suka-suka

  const src = asset?.variants?.lg || asset?.variants?.md || asset?.url || "";

  const onBackdrop = (e) => {
    if (e.target === wrapRef.current) onClose?.();
  };
  const onPointerDown = (e) => {
    // --- DOUBLE-TAP: proses duluan, lalu return (biar gak ikut drag) ---
    const now = performance.now();
    const dt = now - lastTapAt.current;
    lastTapAt.current = now;

    // Hanya kalau satu jari (belum ada pointer lain)
    const isDoubleTap = dt > 0 && dt < 280 && pointers.current.size === 0;
    if (isDoubleTap) {
      // zoom ke titik tap
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect) {
        const ox = (e.clientX ?? 0) - rect.left;
        const oy = (e.clientY ?? 0) - rect.top;
        setOrigin(`${Math.round(ox)}px ${Math.round(oy)}px`);
      }

      // biar CSS bisa animasi (jangan set dragging di path ini)
      if (scale === 1) {
        setScale(2);
        setChromeVisible(false);
      } else {
        setScale(1);
        setTx(0);
        setTy(0);
        setDx(0);
        setOrigin("50% 50%");
      }

      // cegah handler onDoubleClick ikut men-toggle
      ignoreNextDblClick.current = true;
      setTimeout(() => (ignoreNextDblClick.current = false), 350);
      return; // <- penting: jangan lanjut ke drag/pinch
    }

    // --- DRAG / PINCH setup biasa ---
    setDragging(true);
    setDx(0);
    startX.current = e.clientX ?? 0;
    startY.current = e.clientY ?? 0;

    if (scale > 1) {
      lastPanPos.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
    }

    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX ?? 0, y: e.clientY ?? 0 });

    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      pinchStartDist.current = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pinchStartScale.current = scale;
      pinchStartMid.current = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      startTx.current = tx;
      startTy.current = ty;

      // optional: set origin ke midpoint pinch (biar halus)
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect) {
        const ox = pinchStartMid.current.x - rect.left;
        const oy = pinchStartMid.current.y - rect.top;
        setOrigin(`${Math.round(ox)}px ${Math.round(oy)}px`);
      }
    }
  };

  const onPointerMove = (e) => {
    if (!dragging) return;

    // update pointer aktif
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, {
        x: e.clientX ?? 0,
        y: e.clientY ?? 0,
      });
    }

    // PINCH (2 jari)
    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      let nextScale = clamp(
        (dist / pinchStartDist.current) * pinchStartScale.current,
        1,
        MAX_SCALE
      );
      setScale(nextScale);

      // pan mengikuti pergeseran midpoint (biar terasa "nempel")
      const dxMid = mid.x - pinchStartMid.current.x;
      const dyMid = mid.y - pinchStartMid.current.y;
      setTx(startTx.current + dxMid);
      setTy(startTy.current + dyMid);
      return;
    }

    // PAN (zoomed) — 1 jari
    if (scale > 1) {
      const dxPan = (e.clientX ?? 0) - lastPanPos.current.x;
      const dyPan = (e.clientY ?? 0) - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
      setTx((v) => v + dxPan);
      setTy((v) => v + dyPan);
      return;
    }

    // SWIPE untuk ganti foto (hanya saat scale === 1)
    const cx = e.clientX ?? 0;
    const cy = e.clientY ?? 0;
    const moveX = cx - startX.current;
    const moveY = cy - startY.current;

    // abaikan geser vertikal (supaya swipe halus)
    if (Math.abs(moveY) > Math.abs(moveX) * 1.2) return;
    let nextDx = moveX;
    // kalau mentok kiri tapi masih digeser ke kanan → kasih per lawan
    if (nextDx > 0 && !canPrev) nextDx *= 0.2;
    // kalau mentok kanan tapi masih digeser ke kiri → kasih per lawan
    if (nextDx < 0 && !canNext) nextDx *= 0.2;
    setDx(nextDx);
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);

    if (pointers.current.size < 2 && dragging) {
      // Akhiri swipe
      const TH = 40;
      if (scale === 1) {
        if (dx > TH && canPrev) onPrev?.();
        else if (dx < -TH && canNext) onNext?.();
      }

      setDragging(false);
      setDx(0);
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    // deltaY < 0 = zoom in; > 0 = zoom out
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const next = clamp(scale * factor, 1, MAX_SCALE);
    setScale(next);
    if (next > 1) setChromeVisible(false);
    if (next === 1) {
      setTx(0);
      setTy(0);
      setChromeVisible(true);
    } // opsional
  };

  const onPointerCancel = onPointerUp;
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === "escape") {
        if (editing) return setEditing(false);
        if (tagsOpen) return setTagsOpen(false);
        if (pickerOpen) return setPickerOpen(false);
        if (showReacts) return setShowReacts(false);
        if (showComments) return setShowComments(false);
        onClose?.();
      }
      if (k === "arrowleft" && canPrev) onPrev?.();
      if (k === "arrowright" && canNext) onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    editing,
    tagsOpen,
    pickerOpen,
    showReacts,
    showComments,
    canPrev,
    canNext,
    onClose,
    onPrev,
    onNext,
  ]);

  // load tag saat asset berubah + reset UI kebab
  useEffect(() => {
    setMenuOpen(false);
    setEditing(false);
    setTagsOpen(false);
    setTmpCaption(asset?.caption || "");
    setTagInp("");
    if (asset?.id) {
      getAssetTags(asset.id)
        .then(setTags)
        .catch(() => {});
    }
  }, [asset?.id]);

  // click di luar kebab = tutup
  useEffect(() => {
    const onDocDown = (e) => {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [menuOpen]);

  // fokus input saat mulai edit
  useEffect(() => {
    if (editing) inputRef.current?.focus({ preventScroll: true });
  }, [editing]);

  // saat edit/tag dibuka, panel lain ditutup (biar nggak numpuk)
  useEffect(() => {
    if (editing || tagsOpen) {
      setPickerOpen(false);
      setShowComments(false);
      setShowReacts(false);
    }
  }, [editing, tagsOpen]);

  // aksi tag
  async function addTags(e) {
    e?.preventDefault?.();
    const arr = tagInp
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.length === 0 || !asset?.id) return;
    const res = await addAssetTags(asset.id, arr); // BE balikin list terbaru
    setTags(res);
    onTagsUpdated?.(asset.id, res);
    setTagInp("");
  }
  async function removeTag(id) {
    const next = tags.filter((t) => t.id !== id);
    try {
      const res = await removeAssetTag(asset.id, id);
      const safe = Array.isArray(res) ? res : next;
      setTags(safe);
      onTagsUpdated?.(asset.id, safe);
    } catch {
      setTags(next);
      onTagsUpdated?.(asset.id, next);
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft" && canPrev) onPrev?.();
      if (e.key === "ArrowRight" && canNext) onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext, canPrev, canNext]);
  // tutup picker kalau klik di luar / ESC
  useEffect(() => {
    function onDocDown(e) {
      if (!pickerOpen) return;
      const within =
        pickerRef.current?.contains(e.target) ||
        pickerBtnRef.current?.contains(e.target);
      if (!within) setPickerOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [pickerOpen]);
  useEffect(() => {
    const wasZoomed = prevScale.current > 1;
    const isZoomed = scale > 1;

    // baru masuk zoom → auto-hide controls
    if (!wasZoomed && isZoomed && chromeVisible) {
      setChromeVisible(false);
    }

    // baru keluar zoom (kembali ke 1) → auto-show controls
    if (wasZoomed && !isZoomed && !chromeVisible) {
      setChromeVisible(true);
    }

    prevScale.current = scale;
  }, [scale, chromeVisible]);

  // useEffect(() => {
  //   const onKey = (e) => {
  //     if (e.key.toLowerCase() === "c") setShowComments((v) => !v);
  //   };
  //   window.addEventListener("keydown", onKey);
  //   return () => window.removeEventListener("keydown", onKey);
  // }, []);

  // useEffect(() => {
  //   const onKey = (e) => {
  //     const k = e.key.toLowerCase();
  //     if (k === "c")
  //       setShowComments((v) => {
  //         const n = !v;
  //         if (n) setPickerOpen(false);
  //         return n;
  //       });
  //     if (k === "e")
  //       setPickerOpen((v) => {
  //         const n = !v;
  //         if (n) setShowComments(false);
  //         return n;
  //       });
  //   };
  //   window.addEventListener("keydown", onKey);
  //   return () => window.removeEventListener("keydown", onKey);
  // }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!pickerOpen) return;
      const within =
        pickerRef.current?.contains(e.target) ||
        pickerBtnRef.current?.contains(e.target);
      if (!within) setPickerOpen(false);
    }
    document.addEventListener("click", onDocClick); // ⬅️ was mousedown
    return () => document.removeEventListener("click", onDocClick);
  }, [pickerOpen]);

  useEffect(() => {
    if (
      !reactionsByEmoji &&
      typeof onFetchReactions === "function" &&
      asset?.id
    ) {
      let alive = true;
      (async () => {
        try {
          const data = await onFetchReactions(asset.id);
          if (alive) setReacts(data || {});
        } catch (_) {}
      })();
      return () => {
        alive = false;
      };
    }
  }, [asset?.id, onFetchReactions, reactionsByEmoji]);

  // pilih sumber hitungan yang benar: per-asset > album
  const countMap = Object.keys(assetCounts || {}).length ? assetCounts : counts;
  useEffect(() => {
    if (reactionsByEmoji) setReacts(reactionsByEmoji);
  }, [reactionsByEmoji]);

  // ganti openReacts -> toggleReacts
  const toggleReacts = async (emoji = "ALL") => {
    const same = showReacts && reactFilter === emoji;

    // panel saling nutup
    setPickerOpen(false);
    setShowComments(false);

    // update filter
    setReactFilter(emoji);

    // kalau panelnya lagi kebuka dan klik emoji/filter yang sama -> tutup
    if (same) {
      setShowReacts(false);
      return;
    }

    // selain itu -> buka
    setShowReacts(true);

    // fetch sekali aja kalau belum ada data & tidak disuplai via props
    if (
      !reactionsByEmoji &&
      !reacts &&
      typeof onFetchReactions === "function" &&
      asset?.id
    ) {
      try {
        setReactsLoading(true);
        setReactsErr("");
        const data = await onFetchReactions(asset.id);
        setReacts(data || {});
      } catch (err) {
        setReactsErr(err?.message || "Gagal memuat data reaksi");
      } finally {
        setReactsLoading(false);
      }
    }
  };

  const closeReacts = () => setShowReacts(false);

  // flatten & sort terbaru dulu
  const flatReacts = React.useMemo(() => {
    if (!reacts) return [];
    const arr = [];
    for (const [emoji, items] of Object.entries(reacts)) {
      (items || []).forEach((it) => arr.push({ ...it, emoji }));
    }
    arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return arr;
  }, [reacts]);

  // daftar emoji yang ada (urut desc by count, fallback ke countMap)
  const emojiOrder = React.useMemo(() => {
    const countsFromReacts = {};
    if (reacts) {
      for (const [emoji, items] of Object.entries(reacts)) {
        countsFromReacts[emoji] = (items || []).length;
      }
    }
    const base = Object.keys(reacts || countMap || {});
    return base
      .filter(Boolean)
      .sort(
        (a, b) =>
          (countsFromReacts[b] ?? countMap[b] ?? 0) -
          (countsFromReacts[a] ?? countMap[a] ?? 0)
      );
  }, [reacts, countMap]);

  const top3 = React.useMemo(() => {
    const arr = (emojiOrder || []).slice(0, 3);
    // fallback kalau belum ada data
    return arr.length ? arr : [asEmoji(selectedEmoji) || "🙂"].filter(Boolean);
  }, [emojiOrder, selectedEmoji]);

  // Popular: top 6, tapi pastikan emoji yang dipilih user selalu ikut tampil (dipin di depan)
  const popular = React.useMemo(() => {
    const entries = Object.entries(countMap || {});
    const sel = asEmoji(selectedEmoji);
    const hasSelected = sel ? entries.some(([e]) => e === sel) : false;

    // kalau user baru memilih emoji & server belum sempat meng-update countMap,
    // tetap tampilkan chip untuknya dengan minimal angka 1
    if (sel && !hasSelected) {
      entries.unshift([sel, 1]);
    }

    // urutkan: selected di depan, sisanya desc by count
    entries.sort((a, b) => {
      if (a[0] === selectedEmoji) return -1;
      if (b[0] === selectedEmoji) return 1;
      return (b[1] ?? 0) - (a[1] ?? 0);
    });

    return entries.slice(0, 6);
  }, [countMap, selectedEmoji]);

  // normalisasi & handler tunggal
  const ALLOWED = [
    "❤",
    "👍",
    "🔥",
    "👏",
    "😂",
    "🥰",
    "😮",
    "😢",
    "🎉",
    "✨",
    "😁",
    "😍",
    "🤯",
    "😎",
    "🤔",
    "🙏",
    "🤗",
    "🥳",
    "🫶",
    "💯",
    "🤝",
    "😇",
    "😑",
    "😴",
    "🤤",
    "🤫",
    "😡",
    "👀",
    "🌟",
    "💫",
    "🚀",
    "💪",
    "🙌",
    "🤷",
    "🤦",
    "😵",
    "🥲",
    "😋",
    "🤨",
    "🧐",
    "🤪",
    "😜",
    "🥺",
    "😏",
    "😬",
    "🤐",
    "🙄",
    "😤",
    "🥶",
    "🥵",
  ];
  const normalizeEmoji = (s) =>
    String(s)
      .replace(/\uFE0F/g, "")
      .replace(/\u200D/g, "");
  const handlePick = (raw) => {
    const picked = typeof raw === "string" ? raw : raw?.emoji; // <- pastikan string
    const norm = normalizeEmoji(picked || "");
    const canonical = ALLOWED.find((e) => normalizeEmoji(e) === norm) ?? picked;
    onPickEmoji?.(canonical);
    setPickerOpen(false);
  };

  return (
    <div
      // ref={wrapRef} ini untuk klik dimanapun untuk close gambar yaa (esc)
      onClick={onBackdrop}
      className={`fixed inset-0 z-50 bg-black/90 text-white flex items-center justify-center p-4 ${
        !chromeVisible ? "cursor-none" : ""
      }`}
    >
      {/* Nav kiri/kanan */}
      <button
        type="button"
        onClick={() => {
          if (canPrev) onPrev?.();
        }}
        disabled={!canPrev}
        className={`absolute z-50 left-4 md:left-8 top-1/2 -translate-y-1/2
        hidden md:flex items-center justify-center
        h-12 w-12 md:h-16 md:w-16 rounded-full
        bg-black/80 hover:bg-black/90 active:bg-black/95
        text-white text-2xl md:text-3xl font-light
        shadow-xl shadow-black/20
        backdrop-blur-sm border border-white/10
        transition-all duration-200 ease-out
        hover:scale-110 active:scale-95
        ${!chromeVisible ? "opacity-0 pointer-events-none" : "opacity-100"}
        ${!canPrev ? "opacity-30 cursor-not-allowed hover:scale-100" : ""}`}
        aria-label="Sebelumnya"
        aria-disabled={!canPrev}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="translate-x-0.5"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          if (canNext) onNext?.();
        }}
        disabled={!canNext}
        className={`absolute z-50 right-4 md:right-8 top-1/2 -translate-y-1/2
        hidden md:flex items-center justify-center
        h-12 w-12 md:h-16 md:w-16 rounded-full
        bg-black/80 hover:bg-black/90 active:bg-black/95
        text-white text-2xl md:text-3xl font-light
        shadow-xl shadow-black/20
        backdrop-blur-sm border border-white/10
        transition-all duration-200 ease-out
        hover:scale-110 active:scale-95
        ${!chromeVisible ? "opacity-0 pointer-events-none" : "opacity-100"}
        ${!canNext ? "opacity-30 cursor-not-allowed hover:scale-100" : ""}`}
        aria-label="Berikutnya"
        aria-disabled={!canNext}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="-translate-x-0.5"
        >
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Counter kiri-atas */}
      <div
        className={`absolute z-50 top-4 left-16 md:top-8 md:left-20
        rounded-full px-4 py-2 text-sm md:text-base font-medium
        bg-transparent text-white
        
        transition-all duration-200 ease-out
        ${!chromeVisible ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="tabular-nums tracking-wider">
          {Math.min(index + 1, total || index + 1)} / {total || index + 1}
        </span>
        <span className="sr-only">
          Foto {index + 1} dari {total || index + 1}
        </span>
      </div>

      {/* Kebab menu (kiri-atas) */}
      <div
        ref={menuRef}
        className={`absolute z-50 top-4 left-4 md:top-8 md:left-8 transition-all
    ${!chromeVisible ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        onClick={(e) => e.stopPropagation()} // jangan trigger zoom/switch
      >
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="h-10 w-10 grid place-items-center rounded-full
               bg-white/10 hover:bg-white/15 text-white
               backdrop-blur border border-white/15"
          title="Menu"
        >
          ⋯
        </button>

        {menuOpen && (
          <div
            className="mt-2 w-48 max-w-[80vw] rounded-lg border border-white/10
                    bg-black/70 backdrop-blur p-1 shadow-2xl"
          >
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm"
              onClick={() => {
                setEditing(true);
                setTagsOpen(false);
                setMenuOpen(false);
                setTmpCaption(asset?.caption || "");
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              Edit caption
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm"
              onClick={() => {
                setTagsOpen(true);
                setEditing(false);
                setMenuOpen(false);
              }}
            >
              Kelola tag
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm"
              onClick={async () => {
                setMenuOpen(false);
                await onSetCover?.(asset);
              }}
            >
              Jadikan cover
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm text-rose-300"
              onClick={() => {
                setMenuOpen(false);
                onDelete?.(asset);
              }}
            >
              Hapus foto
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={`absolute z-50 top-4 right-4 md:top-8 md:right-8
            h-8 w-12 md:h-14 md:w-14
            flex items-center justify-center rounded-full
            bg-transparent hover:bg-transparent active:bg-transparent
            text-white text-2xl md:text-3xl font-light
            
            transition-all duration-200 ease-out
            hover:scale-110 active:scale-95 hover:rotate-90
            ${
              !chromeVisible ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        aria-label="Tutup"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Konten */}
      <div
        ref={containerRef}
        className="relative z-10 max-w-[95vw] max-h-[80vh] md:max-h-[86vh] select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDoubleClick={(e) => {
          if (ignoreNextDblClick.current) return; // sudah diproses sebagai double-tap
          // (opsional) hanya di mouse:
          // if (e.nativeEvent?.pointerType === 'touch') return;

          // toggle zoom di desktop
          const rect = imgRef.current?.getBoundingClientRect();
          if (rect) {
            const ox = (e.clientX ?? 0) - rect.left;
            const oy = (e.clientY ?? 0) - rect.top;
            setOrigin(`${Math.round(ox)}px ${Math.round(oy)}px`);
          }
          if (scale === 1) setScale(2);
          else {
            setScale(1);
            setTx(0);
            setTy(0);
            setDx(0);
            setOrigin("50% 50%");
            setChromeVisible(true); // opsional
          }
        }}
        onWheel={onWheel} // ⬅️ zoom dengan scroll
        onClick={(e) => {
          e.stopPropagation();
          toggleChrome();
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={asset?.caption || ""}
          draggable={false}
          style={{
            // jika zoomed, gunakan pan (tx/ty); jika tidak, pakai dx untuk swipe
            transform: `translate3d(${scale === 1 ? dx : tx}px, ${
              scale === 1 ? 0 : ty
            }px, 0) scale(${scale})`,
            transition:
              dragging || pointers.current.size >= 2
                ? "none"
                : "transform 180ms ease",
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "auto",
          }}
          className="max-w-full max-h-[80vh] md:max-h-[86vh] object-contain rounded-lg will-change-transform"
        />
        {/* {!!asset?.caption && (
          <div
            className={`mt-3 text-sm text-zinc-300 transition-opacity ${
              !chromeVisible ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {asset.caption}
          </div>
        )} */}
      </div>
      {/* Toolbar bawah */}
      {/* ===== Bottom controls pinned (React kiri, Comment kanan) ===== */}
      <div
        className={`absolute inset-x-0 bottom-4 md:bottom-6 z-50 transition-all duration-200 ease-out ${
          !chromeVisible
            ? "opacity-0 pointer-events-none translate-y-2"
            : "opacity-100 translate-y-0"
        } pointer-events-none`}
      >
        <div className="mx-auto max-w-[min(95vw,900px)] flex items-end justify-between gap-3 px-2">
          {/* LEFT: Caption di atas, React di bawah */}
          {/* LEFT: Caption + Tags di atas, React di bawah */}
          <div className="pointer-events-auto flex flex-col items-start gap-1.5 min-w-0">
            {/* Caption + Tags (satu baris, wrap kalau sempit) */}
            {(!!asset?.caption || (asset?.tags?.length ?? 0) > 0) && (
              <div
                className={`flex items-center gap-2 flex-wrap max-w-[70vw] md:max-w-[520px] ${
                  !chromeVisible ? "opacity-0" : "opacity-100"
                } pointer-events-none`}
              >
                {!!asset?.caption && (
                  <span
                    className="flex-1 min-w-0 text-xs md:text-sm text-zinc-200/90 leading-snug truncate"
                    title={asset.caption}
                  >
                    {asset.caption}
                  </span>
                )}

                {!!asset?.tags?.length && (
                  <div className="shrink-0 flex items-center gap-1.5">
                    {asset.tags.slice(0, 4).map((t) => (
                      <span
                        key={t.id ?? t.name}
                        className="px-2 py-0.5 rounded-full text-[10px] md:text-xs
                         bg-white/8 border border-white/10 text-zinc-200
                         whitespace-nowrap"
                        title={`#${t.name ?? t}`}
                      >
                        #{t.name ?? t}
                      </span>
                    ))}
                    {asset.tags.length > 4 && (
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                        +{asset.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* …lanjutan tombol Add Reaction & Mini Reactions kamu tetap sama di bawahnya… */}

            <div className="flex items-center gap-2">
              {/* Add Reaction */}
              <button
                ref={pickerBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen((v) => {
                    const next = !v;
                    if (next) setShowComments(false);
                    setShowReacts(false);
                    return next;
                  });
                }}
                aria-expanded={pickerOpen}
                title={pickerOpen ? "Tutup reaksi" : "Kirim reaksi"}
                className={`group inline-flex items-center gap-2.5 h-10 px-4 rounded-full
            border backdrop-blur-xl transition-all duration-300 ease-out
            hover:scale-105 active:scale-95 min-w-[40px] justify-center
            ${
              pickerOpen
                ? "bg-violet-500 border-violet-600 text-white border-transparent shadow-lg shadow-fuchsia-900/30"
                : "bg-white/5 text-zinc-100 border-white/10 hover:bg-white/10 shadow-lg shadow-black/40"
            }`}
              >
                <span className="text-base transition-transform duration-300 ease-out flex items-center justify-center w-3 h-5">
                  {asEmoji(selectedEmoji) || "🙂"}
                </span>
                <span className="text-md font-medium">
                  {pickerOpen ? "×" : "+"}
                </span>
              </button>

              {/* Mini Reactions (top-3) */}
              <button
                type="button"
                onClick={() => toggleReacts("ALL")}
                className="inline-flex items-center gap-1.5 h-10 px-2.5 rounded-full
            border border-white/25 bg-white/20
            backdrop-blur-md shadow-md shadow-black/10
            transition-all duration-200 hover:bg-white/30 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-white/30"
                title="Lihat siapa saja yang memberi reaksi"
                aria-label="Lihat siapa saja yang memberi reaksi"
              >
                <span className="inline-flex items-center -space-x-1">
                  {top3.map((e, i) => (
                    <span
                      key={`${e}-${i}`}
                      className="inline-grid place-items-center w-5 h-5 rounded-full
                  bg-white/80 text-black border border-white/50 text-[13px] shadow"
                      style={{ zIndex: 3 - i }}
                    >
                      {e}
                    </span>
                  ))}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT: Comment */}
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments((v) => {
                  const next = !v;
                  if (next) setPickerOpen(false);
                  setShowReacts(false);
                  return next;
                });
              }}
              className={`group inline-flex items-center gap-2.5 h-10 px-4 rounded-full
          border backdrop-blur-xl shadow-lg transition-all duration-300 ease-out
          hover:scale-105 active:scale-95 min-w-[100px] justify-center
          ${
            showComments
              ? "bg-violet-500 border-violet-600 text-white border-transparent shadow-fuchsia-900/30"
              : "bg-white/5 text-zinc-100 border-white/10 hover:bg-white/10 shadow-black/40"
          }`}
              aria-expanded={showComments}
              title="Lihat komentar (C)"
            >
              <MessageCircleMore
                className={`h-5 w-5 transition-all duration-300 ease-out ${
                  showComments
                    ? "text-white"
                    : "text-zinc-200 group-hover:scale-110"
                }`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-sm font-medium tabular-nums min-w-[1.5rem] text-center transition-all duration-200 ease-out">
                {comments?.length ?? 0}
              </span>
              <span className="sr-only">Komentar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Panel komentar (mengambang di atas bottom bar) ===== */}
      {showComments && (
        <div
          className="absolute inset-x-0 bottom-20 md:bottom-28 z-40 px-3"
          onClick={(e) => {
            e.stopPropagation();
            // toggleChrome();
          }}
        >
          <div className="mx-auto max-w-[min(95vw,900px)]">
            <div
              className="rounded-3xl overflow-hidden border backdrop-blur-xl
                   shadow-2xl shadow-black/50
                   bg-gradient-to-b from-zinc-900/90 via-zinc-950/85 to-black/80
                   border-white/10 transform transition-all duration-500 ease-out
                   animate-in slide-in-from-bottom-4"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                    Comments ({comments?.length ?? 0})
                  </h3>
                  <button
                    onClick={() => setShowComments(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors duration-200"
                    aria-label="Tutup komentar"
                    title="Tutup"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="max-h-64 md:max-h-80 overflow-auto px-4 py-3 space-y-3 custom-scrollbar">
                {(!comments || comments.length === 0) && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">
                      Belum ada komentar
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      Jadilah yang pertama berkomentar!
                    </p>
                  </div>
                )}

                {comments?.map((c, index) => (
                  <div
                    key={c.id}
                    className="group p-4 rounded-2xl bg-white/5 border border-white/10
                         hover:bg-white/10 hover:border-white/20
                         shadow-sm hover:shadow-lg
                         transition-all duration-300 ease-out
                         hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar
                        src={c.user_avatar_url || c.user?.avatar_url} // sesuaikan nama field API-mu
                        name={c.user_name || c.user?.name}
                        className="w-9 h-9 flex-shrink-0"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-zinc-200 text-sm">
                            {c.user_name}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {new Date(c.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {c.body}
                        </p>
                      </div>

                      {/* Like button */}
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-fuchsia-500/10
                             transition-all duration-300 hover:scale-110"
                        title="Suka"
                        aria-label="Suka komentar ini"
                      >
                        <svg
                          className="w-4 h-4 text-zinc-400 hover:text-fuchsia-400 transition-colors duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <div className="p-4 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const t = commentText.trim();
                    if (!t) return;
                    await onSubmitComment?.(t);
                    setCommentText("");
                    if (taRef.current) {
                      taRef.current.style.height = `${TA_MIN}px`;
                      setTaOverflow(false);
                    }
                  }}
                  className="flex gap-3 items-end"
                >
                  <div className="flex-1 relative translate-y-[6px] sm:translate-y-[4px]">
                    <textarea
                      ref={taRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Tulis Komentar...."
                      rows={1}
                      className={
                        "w-full px-4 py-3 rounded-2xl resize-none " +
                        "bg-white/5 border border-white/10 " +
                        "placeholder:text-zinc-400 text-zinc-100 " +
                        "focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400/40 " +
                        "hover:bg-white/10 hover:border-white/20 " +
                        "transition-all duration-300 ease-out " +
                        "text-sm leading-relaxed " +
                        "overflow-y-auto scrollbar-none scroll-touch"
                      }
                      style={{
                        minHeight: `${TA_MIN}px`,
                        maxHeight: `${TA_MAX}px`,
                      }}
                      onInput={(e) => {
                        const el = e.target;
                        el.style.height = "auto";
                        const next = Math.min(el.scrollHeight, TA_MAX);
                        el.style.height = next + "px";
                        setTaOverflow(el.scrollHeight > TA_MAX);
                      }}
                      maxLength={500}
                    />

                    {/* Character counter */}
                    <div
                      className={`absolute bottom-2 right-3 text-xs font-medium transition-colors duration-200 ${
                        commentText.length > 500
                          ? "text-rose-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {commentText.length}/500
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentText.length > 500}
                    className="shrink-0 self-end h-12 px-4 rounded-2xl font-semibold text-sm
                         bg-gradient-to-r from-violet-500 to-fuchsia-500
                         hover:from-violet-600 hover:to-fuchsia-600
                         text-white shadow-lg shadow-fuchsia-900/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300 ease-out
                         hover:shadow-xl hover:shadow-fuchsia-900/40
                         active:scale-[0.98] flex items-center justify-center gap-2"
                    aria-label="Kirim komentar"
                    title="Kirim komentar"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Panel Reactions (mengambang di atas bottom bar) ===== */}
      {showReacts && (
        <div
          className="absolute inset-x-0 bottom-20 md:bottom-28 z-40 px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto max-w-[min(95vw,900px)]">
            <div
              className="rounded-3xl overflow-hidden border backdrop-blur-xl
                   shadow-2xl shadow-black/50
                   bg-gradient-to-b from-zinc-900/90 via-zinc-950/85 to-black/80
                   border-white/10 transform transition-all duration-500 ease-out
                   animate-in slide-in-from-bottom-4"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                    Reactions
                    <span className="text-xs font-medium text-zinc-400 ml-2">
                      {flatReacts.length} total
                    </span>
                  </h3>
                  <button
                    onClick={closeReacts}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors duration-200"
                    aria-label="Tutup panel reactions"
                    title="Tutup"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Tabs emoji */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setReactFilter("ALL")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${
                  reactFilter === "ALL"
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-fuchsia-900/30"
                    : "bg-white/5 text-zinc-200 border-white/10 hover:bg-white/10"
                }`}
                  >
                    All
                    <span className="ml-1.5 text-[10px] opacity-80">
                      {flatReacts.length}
                    </span>
                  </button>

                  {emojiOrder.map((e) => {
                    const c = reacts?.[e]?.length ?? countMap?.[e] ?? 0;
                    const active = reactFilter === e;
                    return (
                      <button
                        key={e}
                        onClick={() => setReactFilter(e)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5
                    ${
                      active
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-fuchsia-900/30"
                        : "bg-white/5 text-zinc-200 border-white/10 hover:bg-white/10"
                    }`}
                        title={`Filter ${e}`}
                      >
                        <span className="text-sm">{e}</span>
                        <span
                          className={`text-[10px] ${
                            active ? "opacity-90" : "opacity-60"
                          }`}
                        >
                          {c}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body */}
              <div className="max-h-64 md:max-h-80 overflow-auto px-4 py-3 custom-scrollbar">
                {reactsLoading && (
                  <div className="flex items-center justify-center py-10 text-sm text-zinc-400">
                    Memuat data…
                  </div>
                )}

                {!!reactsErr && !reactsLoading && (
                  <div className="flex items-center justify-center py-10 text-sm text-rose-400">
                    {reactsErr}
                  </div>
                )}

                {!reactsLoading && !reactsErr && (
                  <>
                    {flatReacts.filter(
                      (r) => reactFilter === "ALL" || r.emoji === reactFilter
                    ).length === 0 ? (
                      <div className="text-center py-10 text-sm text-zinc-400">
                        Belum ada reaksi{" "}
                        {reactFilter === "ALL" ? "di foto ini" : reactFilter}.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {flatReacts
                          .filter(
                            (r) =>
                              reactFilter === "ALL" || r.emoji === reactFilter
                          )
                          .map((r, idx) => (
                            <li
                              key={`${r.id || r.user_id || r.user_name}-${
                                r.emoji
                              }-${r.created_at}-${idx}`}
                              className="group p-3 rounded-2xl bg-white/5 border border-white/10
                                   hover:bg-white/10 hover:border-white/20
                                   shadow-sm hover:shadow-lg
                                   transition-all duration-300 ease-out"
                            >
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="relative w-9 h-9 flex-shrink-0">
                                  <div
                                    className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500
                  flex items-center justify-center text-white font-bold text-sm"
                                  >
                                    {(r.user_name || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  {r.user_avatar_url && (
                                    <img
                                      src={r.user_avatar_url}
                                      alt={r.user_name || "User"}
                                      className="absolute inset-0 w-full h-full object-cover rounded-full ring-1 ring-white/10"
                                      loading="lazy"
                                      onError={(e) => e.currentTarget.remove()}
                                    />
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-zinc-200 text-sm truncate">
                                      {r.user_name || "Unknown"}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {r.created_at
                                        ? new Date(r.created_at).toLocaleString(
                                            "id-ID",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              day: "numeric",
                                              month: "short",
                                            }
                                          )
                                        : ""}
                                    </span>
                                  </div>
                                </div>

                                {/* Emoji */}
                                <span className="text-lg select-none">
                                  {r.emoji}
                                </span>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Emoji Picker Sheet (scrollable) === */}
      {pickerOpen && (
        <div
          ref={pickerRef}
          className="fixed left-0 right-0 
               bottom-[calc(env(safe-area-inset-bottom)+68px)] md:bottom-[calc(env(safe-area-inset-bottom)+92px)]
               z-[55] px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto max-w-[min(95vw,900px)]">
            <div
              className="rounded-3xl overflow-hidden border backdrop-blur-xl
                   shadow-2xl shadow-black/50
                   bg-gradient-to-b from-zinc-900/90 via-zinc-950/85 to-black/80
                   border-white/10 transform transition-all duration-500 ease-out
                   animate-in slide-in-from-bottom-6 scale-in-95"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 
                           flex items-center justify-center shadow-lg shadow-fuchsia-900/30"
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        Express Yourself
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">
                        Choose your reaction
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPickerOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 active:bg-white/15
                         transition-all duration-200 group hover:scale-110 active:scale-95"
                    aria-label="Tutup emoji picker"
                    title="Tutup"
                  >
                    <svg
                      className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Emoji Picker */}
              <div className="px-4 py-4">
                <Suspense
                  fallback={
                    <div className="py-10 text-center text-sm text-zinc-400">
                      Memuat emoji…
                    </div>
                  }
                >
                  <EmojiPicker
                    onEmojiClick={(data) => {
                      handlePick(data); // normalisasi tetap dipakai
                      // openReacts(data.emoji) // opsional: auto buka panel reacts
                    }}
                    theme="dark"
                    lazyLoadEmojis
                    autoFocusSearch={false}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    previewConfig={{ showPreview: false }}
                    height={320}
                    width="100%"
                  />
                </Suspense>
              </div>

              {/* Footer tip */}
              <div className="px-6 py-3 bg-gradient-to-r from-white/5 to-transparent border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <svg
                    className="w-3 h-3 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    Tap any emoji to react instantly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor caption */}
      {editing && (
        <div
          className="absolute inset-x-0 bottom-20 md:bottom-28 z-40 px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto max-w-[min(95vw,900px)]">
            <div
              className="rounded-3xl overflow-hidden border backdrop-blur-xl
                   shadow-2xl shadow-black/50
                   bg-gradient-to-b from-zinc-900/90 via-zinc-950/85 to-black/80
                   border-white/10 transform transition-all duration-500 ease-out
                   animate-in slide-in-from-bottom-4"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 via-violet-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-grid place-items-center w-6 h-6 rounded-full
                               bg-gradient-to-br from-violet-500 to-fuchsia-500
                               text-white text-xs shadow-lg shadow-fuchsia-900/30"
                    >
                      ✎
                    </span>
                    <h3 className="font-bold text-white">Edit caption</h3>
                  </div>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                    aria-label="Tutup"
                    title="Tutup"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                  <div className="flex-1 relative group min-w-0">
                    <span className="pointer-events-none absolute left-3 top-6 -translate-y-1/2 text-zinc-400/80">
                      ✎
                    </span>
                    <input
                      ref={inputRef}
                      value={tmpCaption}
                      onChange={(e) => setTmpCaption(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditing(false);
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onCaptionSave?.(asset, tmpCaption.trim());
                          setEditing(false);
                        }
                      }}
                      maxLength={180}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm md:text-base
                           bg-white/5 border border-white/10 text-zinc-100
                           placeholder:text-zinc-400 outline-none
                           focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/30
                           transition"
                      placeholder="Tulis caption…"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400 px-1">
                      <span>
                        <span className="hidden md:inline">
                          Enter untuk simpan • Esc untuk batal
                        </span>
                        <span></span>
                      </span>
                      <span className="tabular-nums">
                        {tmpCaption.length}/180
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 md:gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onCaptionSave?.(asset, tmpCaption.trim());
                        setEditing(false);
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium
                           bg-violet-500 border-violet-600 text-white
                           shadow-lg shadow-fuchsia-900/30 hover:opacity-95 active:scale-95
                           transition"
                      title="Simpan (Enter)"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10
                           border border-white/10 text-zinc-200 text-sm font-medium
                           active:scale-95 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel tags */}
      {tagsOpen && (
        <div
          className="absolute inset-x-0 bottom-20 md:bottom-28 z-40 px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto max-w-[min(95vw,900px)]">
            <div
              className="rounded-3xl overflow-hidden border backdrop-blur-xl
                   shadow-2xl shadow-black/50
                   bg-gradient-to-b from-zinc-900/90 via-zinc-950/85 to-black/80
                   border-white/10 transform transition-all duration-500 ease-out
                   animate-in slide-in-from-bottom-4"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-grid place-items-center w-6 h-6 rounded-full
                               bg-violet-500 border-violet-600
                               text-white text-xs shadow-lg shadow-fuchsia-900/30"
                    >
                      #
                    </span>
                    <h3 className="font-bold text-white">Kelola Tag</h3>
                    <span
                      className="ml-2 text-[11px] text-zinc-300 px-2 py-0.5 rounded-full
                               border border-white/10 bg-white/5"
                    >
                      {tags.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setTagsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                    aria-label="Tutup"
                    title="Tutup"
                  >
                    <svg
                      className="w-4 h-4 text-zinc-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* daftar tag */}
                <div className="max-h-48 overflow-y-auto pr-1 mb-3 thin-scrollbar">
                  {tags.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="inline-grid place-items-center w-5 h-5 rounded-full bg-white/5 border border-white/10">
                        #
                      </span>
                      Belum ada tag
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t.id}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                               bg-white/5 hover:bg-white/10 border border-white/10
                               text-xs text-zinc-100 transition"
                          title={`#${t.name}`}
                        >
                          <span className="truncate max-w-[12rem]">
                            #{t.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTag(t.id)}
                            className="h-4 w-4 grid place-items-center rounded hover:bg-white/10 text-zinc-300 transition"
                            aria-label={`Hapus tag ${t.name}`}
                            title="Hapus tag"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* input + aksi */}
                <form
                  onSubmit={addTags}
                  className="flex flex-col gap-3 md:flex-row md:items-center"
                >
                  <div className="flex-1 relative min-w-0">
                    <span className="pointer-events-none absolute left-3 top-6 -translate-y-1/2 text-zinc-400/80">
                      #
                    </span>
                    <input
                      value={tagInp}
                      onChange={(e) => setTagInp(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Escape" && setTagsOpen(false)
                      }
                      className="w-full pl-8 pr-3 py-3 rounded-xl text-sm md:text-base
                           bg-white/5 border border-white/10
                           text-zinc-100 placeholder:text-zinc-400
                           outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/30
                           transition"
                      placeholder="Tambah tag… (pisah koma)"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Contoh:{" "}
                      <span className="text-zinc-300">wisuda, keluarga</span>.
                      <span className="hidden md:inline">
                        Tekan <span className="text-zinc-300">Enter</span> untuk
                        menambah.
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!tagInp.trim()}
                      className={[
                        "px-5 py-2.5 rounded-xl text-sm font-medium transition",
                        tagInp.trim()
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/30 hover:opacity-95 active:scale-[0.98]"
                          : "bg-white/5 text-zinc-400 border border-white/10 cursor-not-allowed",
                      ].join(" ")}
                      title={tagInp.trim() ? "Tambah tag" : "Isi nama tag dulu"}
                    >
                      Tambah
                    </button>
                    <button
                      type="button"
                      onClick={() => setTagsOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10
                           border border-white/10 text-zinc-200 text-sm font-medium transition"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* scrollbar tipis tapi tetap bisa scroll */}
            <style jsx>{`
              .thin-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
              }
              .thin-scrollbar::-webkit-scrollbar {
                height: 8px;
                width: 8px;
              }
              .thin-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .thin-scrollbar::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.25);
                border-radius: 9999px;
                border: 2px solid transparent;
                background-clip: content-box;
              }
              .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: rgba(255, 255, 255, 0.35);
              }
            `}</style>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }

        @keyframes slide-in-from-bottom-6 {
          from {
            transform: translateY(24px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scale-in-95 {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-in {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .slide-in-from-bottom-6 {
          animation-name: slide-in-from-bottom-6;
        }

        .scale-in-95 {
          animation-name: scale-in-95;
        }
      `}</style>
    </div>
  );
}

<style jsx>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  @keyframes slide-in-from-bottom-4 {
    from {
      transform: translateY(16px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-in {
    animation-duration: 0.5s;
    animation-fill-mode: both;
  }

  .slide-in-from-bottom-4 {
    animation-name: slide-in-from-bottom-4;
  }
`}</style>;
