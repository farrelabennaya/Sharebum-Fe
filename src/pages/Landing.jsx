// src/pages/Landing.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// Tetap gunakan komponen Login milikmu
import Login from "./Login.jsx";

/* ==================== Helpers ==================== */

// FadeIn dengan opsi arah & jarak
function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 24,
}) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShow(true),
      { threshold: 0.1, rootMargin: "-10% 0px" }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const transforms = {
    up: `translateY(${show ? 0 : distance}px)`,
    down: `translateY(${show ? 0 : -distance}px)`,
    left: `translateX(${show ? 0 : distance}px)`,
    right: `translateX(${show ? 0 : -distance}px)`,
    scale: `scale(${show ? 1 : 0.95})`,
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        show ? "opacity-100" : "opacity-0"
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transform: transforms[direction] || transforms.up,
      }}
    >
      {children}
    </div>
  );
}

// Latar partikel ringan
function ParticleBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const initParticles = () => {
      particlesRef.current = [];
      const numParticles = Math.min(50, Math.floor(window.innerWidth / 30));
      for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    };

    initParticles();

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 100) {
          const force = (100 - d) / 100;
          p.vx -= (dx / (d || 1)) * force * 0.01;
          p.vy -= (dy / (d || 1)) * force * 0.01;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();

        particlesRef.current.forEach((o) => {
          const dx2 = p.x - o.x;
          const dy2 = p.y - o.y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - d2 / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const onMove = (e) => (mouseRef.current = { x: e.clientX, y: e.clientY });
    const onResize = () => {
      resizeCanvas();
      initParticles();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// Tombol mengapung ke atas
function FloatingActions() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="p-3 rounded-full bg-violet-500 shadow-lg shadow-fuchsia-900/30 hover:scale-110 active:scale-95 transition-all duration-200 group"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="transform group-hover:-translate-y-0.5 transition-transform"
        >
          <path
            d="m18 15-6-6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// Kartu fitur interaktif
function FeatureCard({ feature, index }) {
  const [hover, setHover] = useState(false);
  return (
    <FadeIn delay={index * 80} direction="up">
      <div
        className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/[0.07] transition-all duration-300 cursor-pointer overflow-hidden"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl transition-opacity duration-300 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <div className="w-6 h-6 rounded bg-violet-500" />
          </div>
        </div>
        <div className="relative">
          <h3 className="font-semibold text-lg group-hover:text-violet-300 transition-colors">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            {feature.desc}
          </p>
        </div>
        <div
          className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
            hover ? "shadow-lg shadow-violet-500/10 border-violet-500/30" : ""
          }`}
        />
      </div>
    </FadeIn>
  );
}

/* ==================== Landing Page ==================== */

export default function LandingPage() {
  const [progress, setProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setProgress(Math.min(1, window.scrollY / 600));
    const onMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // cek token (sesuaikan dengan implementasi auth kamu)
  const [hasToken, setHasToken] = useState(
    () => !!localStorage.getItem("token")
  );
  useEffect(() => {
    const onStorage = (e) => e.key === "token" && setHasToken(!!e.newValue);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const hideOverlay = progress >= 0.98 || hasToken;

  const scale = 1 - progress * 0.08;
  const translateY = -progress * 32;
  const opacity = 1 - progress;
  const blur = progress * 8;

  const features = [
    {
      title: "Album Publik & Privat",
      desc: "Atur visibilitas sesuai kebutuhan. Bagikan ke semua orang atau kelompok tertentu dengan kontrol akses penuh.",
    },
    {
      title: "Lightbox Halus",
      desc: "Lihat foto fullscreen dengan swipe/keyboard navigation. Smooth banget dengan loading yang cepat.",
    },
    {
      title: "Reaksi Emoji",
      desc: "Tinggalkan reaksi tanpa komentar. Cepat dan fun buat semua yang lihat dengan animasi yang menarik.",
    },
    {
      title: "Komentar Terstruktur",
      desc: "Diskusi rapi di tiap foto. Notifikasi real-time yang ringan, anti berisik tapi tetap informatif.",
    },
    {
      title: "Link Sharing Aman",
      desc: "Bagikan melalui tautan unik dengan enkripsi. Bisa cabut akses kapan pun dengan tracking lengkap.",
    },
    {
      title: "Performa Cepat",
      desc: "Optimasi gambar otomatis, lazy-load cerdas, dan UI ringan. Hemat kuota, tetap cantik di semua device.",
    },
  ];

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white overflow-x-hidden">
      {/* Background + orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ParticleBackground />

        {/* TL orb — agak mepet kiri-atas */}
        <div
          className="absolute -top-24 -left-24 sm:-top-32 sm:-left-32 
               w-[28rem] h-[28rem] rounded-full bg-violet-500/20 
               blur-3xl animate-pulse will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />

        {/* BR orb — agak mepet kanan-bawah */}
        <div
          className="absolute -bottom-28 -right-28 sm:-bottom-40 sm:-right-40 
               w-[32rem] h-[32rem] rounded-full bg-fuchsia-500/15 
               blur-3xl animate-pulse delay-1000 will-change-transform"
          style={{
            transform: `translate(${-mousePosition.x * 0.015}px, ${
              -mousePosition.y * 0.015
            }px)`,
          }}
        />

        {/* Optional orb ke-3 (biarkan atau geser sedikit) */}
        <div
          className="absolute top-[60%] left-[80%] 
               w-64 h-64 rounded-full bg-blue-500/10 blur-3xl 
               animate-pulse delay-500 will-change-transform"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${
              mousePosition.y * 0.01
            }px)`,
          }}
        />
      </div>

      {/* Overlay Login (pakai Login dari kamu) */}
      {!hasToken && (
        <section
          className="sticky top-0 h-[100svh] grid place-items-center px-4 w-full"
          style={{
            opacity,
            transform: `translateY(${translateY}px) scale(${scale})`,
            filter: `blur(${blur}px)`,
            transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: hideOverlay ? "none" : "auto",
            visibility: hideOverlay ? "hidden" : "visible",
          }}
        >
          <div className="max-w-md w-full relative">
            {/* <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10" />
            <div className="relative p-8"> */}
            <Login embedded />
            {!hideOverlay && (
              <button
                type="button"
                onClick={() =>
                  contentRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="mx-auto mt-8 flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-all duration-200 group"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transform group-hover:translate-y-0.5 transition-transform"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="relative">
                  Scroll untuk lihat apa itu Share Album
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-500 group-hover:w-full transition-all duration-300" />
                </span>
              </button>
            )}
          </div>
          {/* </div> */}
        </section>
      )}

      {/* Konten utama */}
      <main ref={contentRef} className="relative z-10">
        {/* Hero */}
        <section id="hero" className="px-4 relative">
          {/* background ornaments */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto py-16 md:py-24">
            <div className="grid items-center gap-10 md:grid-cols-[1.1fr,0.9fr]">
              {/* LEFT: copy + CTA */}
              <div>
                <FadeIn direction="up" distance={40}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-zinc-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Baru diluncurkan — Beta Version
                  </div>
                </FadeIn>

                <FadeIn delay={100} direction="up" distance={50}>
                  <h1
                    className="mt-5 text-left text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight 
                         bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent leading-[1.05]"
                  >
                    Share Album
                  </h1>
                </FadeIn>

                <FadeIn delay={180} direction="up" distance={30}>
                  <p className="mt-4 text-left text-lg md:text-xl text-zinc-300/90 max-w-2xl">
                    Simpel buat kamu, seru buat semua.
                  </p>
                </FadeIn>

                <FadeIn delay={240} direction="up" distance={30}>
                  <p className="mt-3 text-left text-base md:text-lg text-zinc-300 max-w-2xl">
                    Bikin album publik/privat, bagikan link, dapat reaksi emoji,
                    dan ngobrol di komentar. Semuanya ringan, cepat, tanpa
                    drama.
                  </p>
                </FadeIn>

                {/* feature chips */}
                <FadeIn delay={300} direction="up" distance={20}>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      ["Buat album instan", "M12 6v12M6 12h12"],
                      [
                        "Link shareable",
                        "M4 12a5 5 0 0 1 5-5h2m0 10h-2a5 5 0 0 1-5-5m16 0a5 5 0 0 0-5-5h-2m0 10h2a5 5 0 0 0 5-5",
                      ],
                      [
                        "Emoji & komentar",
                        "M14.828 14.828a4 4 0 0 1-5.656 0M9 10h.01M15 10h.01",
                      ],
                    ].map(([label, d]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                           border border-white/10 bg-white/5 text-zinc-200 text-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d={d}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {label}
                      </span>
                    ))}
                  </div>
                </FadeIn>

                {/* CTAs */}
                <FadeIn delay={360} direction="up" distance={20}>
                  <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link
                      to="/register"
                      className="group relative px-7 py-3.5 rounded-2xl font-semibold
                         bg-violet-500 text-white
                         shadow-2xl shadow-fuchsia-900/40 hover:shadow-fuchsia-900/60
                         hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
                    >
                      <span className="relative z-10">
                        Coba Gratis Sekarang
                      </span>
                      <span
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                               bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl"
                      />
                    </Link>

                    <a
                      href="#fitur"
                      className="px-7 py-3.5 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm
                         text-zinc-200 hover:bg-white/10 hover:border-white/30 transition-all duration-200 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        Lihat Fitur
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="transition-transform group-hover:translate-x-0.5"
                        >
                          <path
                            d="m9 18 6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </a>
                  </div>
                  <div className="mt-3 text-sm text-zinc-400/80">
                    Tanpa install • Gratis untuk mulai
                  </div>
                </FadeIn>

                {/* stats inline */}
                <FadeIn delay={420} direction="up" distance={20}>
                  <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl">
                    {[
                      { label: "Users", value: "10K+" },
                      { label: "Albums", value: "50K+" },
                      { label: "Photos", value: "500K+" },
                      { label: "Countries", value: "25+" },
                    ].map((s) => (
                      <div key={s.label} className="text-left">
                        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                          {s.value}
                        </div>
                        <div className="text-sm text-zinc-400 mt-1">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </FadeIn>
              </div>

              {/* RIGHT: interactive preview (decorative) */}
              <FadeIn delay={140} direction="up" distance={50}>
                <div className="relative mx-auto w-full max-w-[520px] md:max-w-none md:w-[520px]">
                  <div className="relative aspect-[4/3.3] md:h-[420px] w-full">
                    {/* back card */}
                    <div
                      className="absolute inset-0 -rotate-6 translate-x-3 -translate-y-2
                            rounded-3xl border border-white/10 bg-white/5 
                            shadow-2xl shadow-black/40"
                    />
                    {/* mid card */}
                    <div
                      className="absolute inset-0 rotate-3 -translate-x-2 translate-y-3
                            rounded-3xl border border-white/10 bg-white/5
                            shadow-2xl shadow-black/40"
                    />
                    {/* main card */}
                    <div
                      className="absolute inset-0 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl
                            shadow-[0_30px_120px_rgba(0,0,0,.45)] overflow-hidden"
                    >
                      {/* mock header */}
                      <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-black/20">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500" />
                          <span className="text-sm font-medium text-white">
                            Aben’s Trip
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                            Public
                          </span>
                        </div>
                      </div>
                      {/* mock grid */}
                      <div className="p-4 grid grid-cols-3 gap-2">
                        {[
                          "https://picsum.photos/id/1015/600/600",
                          "https://picsum.photos/id/1024/600/600",
                          "https://picsum.photos/id/1039/600/600",
                          "https://picsum.photos/id/1059/600/600",
                          "https://picsum.photos/id/1069/600/600",
                          "https://picsum.photos/id/1074/600/600",
                        ].map((url, i) => (
                          <div
                            key={i}
                            className="relative aspect-square rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10"
                          >
                            <img
                              src={url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              sizes="(max-width: 768px) 33vw, 170px"
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                // fallback kecil kalau gagal load
                                e.currentTarget.src = `https://picsum.photos/seed/sa-fallback-${i}/400/400`;
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* floating reacts */}
                    <span className="absolute -top-3 right-6 text-lg select-none animate-[float_8s_ease-in-out_infinite]">
                      😍
                    </span>
                    <span className="absolute bottom-6 -left-2 text-xl select-none animate-[float_9s_ease-in-out_infinite]">
                      🔥
                    </span>
                    <span className="absolute top-10 -right-2 text-lg select-none animate-[float_7s_ease-in-out_infinite]">
                      👏
                    </span>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* keyframes for floating emojis (safe inline) */}
          <style>{`
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
      100% { transform: translateY(0px); }
    }
  `}</style>
        </section>

        {/* Fitur */}
        <section
          id="fitur"
          className="relative px-4 py-16 md:py-28 supports-[content-visibility:auto]:[content-visibility:auto] supports-[content-visibility:auto]:[contain-intrinsic-size:1px_800px]"
        >
          <div className="max-w-6xl mx-auto">
            {/* header */}
            <div className="mb-10 md:mb-14">
              <FadeIn direction="up" distance={20}>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[12px] text-zinc-300">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 motion-safe:animate-pulse" />
                  Fitur utama
                </div>
              </FadeIn>

              <FadeIn delay={80} direction="up" distance={24}>
                <h2 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">
                  Apa saja di dalamnya?
                </h2>
              </FadeIn>

              <FadeIn delay={150} direction="up" distance={24}>
                <p className="mt-2 text-sm md:text-base text-zinc-400/90 max-w-2xl">
                  Biar berbagi momen terasa gampang, rapih, dan fun—tanpa drama.
                </p>
              </FadeIn>
            </div>

            {/* grid compact */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {[
                {
                  title: "Album Publik & Privat",
                  desc: "Atur visibilitas sesuai kebutuhan. Share ke semua orang atau kelompok tertentu dengan kontrol akses penuh.",
                },
                {
                  title: "Lightbox Halus",
                  desc: "Foto fullscreen dengan swipe/keyboard, animasi smooth, dan loading cepat.",
                },
                {
                  title: "Reaksi Emoji",
                  desc: "Tinggalkan reaksi instan tanpa ngetik. Ringan, seru, terasa hidup.",
                },
                {
                  title: "Komentar Terstruktur",
                  desc: "Diskusi rapi di tiap foto. Notifikasi ringan—info dapet, ganggu nggak.",
                },
                {
                  title: "Link Sharing Aman",
                  desc: "Tautan unik yang bisa dicabut kapan pun. Aman buat publik, tenang buat kamu.",
                },
                {
                  title: "Performa Cepat",
                  desc: "Optimasi gambar otomatis, lazy-load cerdas, UI ringan. Hemat kuota di semua device.",
                },
              ].map((feature, i) => (
                <FadeIn
                  key={feature.title}
                  delay={i * 90}
                  direction="up"
                  distance={26}
                >
                  <FeatureCard feature={feature} index={i} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Cara Kerja */}
        <section
          id="cara-kerja"
          className="relative px-4 py-16 md:py-28 supports-[content-visibility:auto]:[content-visibility:auto] supports-[content-visibility:auto]:[contain-intrinsic-size:1px_720px]"
        >
          <div className="max-w-6xl mx-auto">
            {/* header — left-aligned & compact */}
            <div className="mb-10 md:mb-14">
              <FadeIn direction="up" distance={18}>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[12px] text-zinc-300">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 motion-safe:animate-pulse" />
                  Langkah cepat
                </div>
              </FadeIn>

              <FadeIn delay={80} direction="up" distance={22}>
                <h2 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">
                  Cara kerjanya
                </h2>
              </FadeIn>

              <FadeIn delay={150} direction="up" distance={22}>
                <p className="mt-2 text-sm md:text-base text-zinc-400/90 max-w-xl">
                  Semuanya diringkas jadi tiga langkah santai. No ribet, no
                  drama.
                </p>
              </FadeIn>
            </div>

            {/* steps — compact cards, ringan */}
            <div className="grid md:grid-cols-3 gap-5 md:gap-6">
              {[
                {
                  no: 1,
                  icon: "👋",
                  title: "Masuk / Daftar",
                  desc: "Daftar kilat < 1 menit atau langsung login. Akun siap dipakai.",
                  tip: "Aman & ringan",
                },
                {
                  no: 2,
                  icon: "📸",
                  title: "Buat Album",
                  desc: "Upload drag & drop, atur judul, visibilitas, komentar & reaksi.",
                  tip: "Kontrol penuh",
                },
                {
                  no: 3,
                  icon: "🚀",
                  title: "Bagikan",
                  desc: "Kirim link ke teman/keluarga. Nikmati reaksi & komentar realtime.",
                  tip: "Sekali klik",
                },
              ].map((s, i, arr) => (
                <FadeIn key={s.no} delay={i * 90} direction="up" distance={24}>
                  <HowStep data={s} showArrow={i < arr.length - 1} />
                </FadeIn>
              ))}
            </div>

            {/* CTA bar — compact */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <FadeIn delay={280} direction="up" distance={18}>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
           bg-violet-500 text-white
           shadow-md hover:shadow-lg shadow-fuchsia-900/20
           hover:scale-[1.02] active:scale-95 transition will-change-transform"
                >
                  Mulai gratis
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </FadeIn>

              <FadeIn delay={340} direction="up" distance={18}>
                <a
                  href="#fitur"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
             border border-white/15 bg-white/[0.06] text-zinc-200
             hover:bg-white/[0.1] hover:border-white/25 transition"
                >
                  Lihat fitur
                </a>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="relative px-4 py-16 md:py-24">
          {/* ornaments aman dari overflow */}

          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
              {/* subtle ring glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10"
              />

              <div className="px-6 md:px-10 py-12 md:py-16 text-center">
                <FadeIn direction="up">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[12px] text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />{" "}
                    Bagikan momen
                  </span>
                </FadeIn>

                <FadeIn delay={120} direction="up">
                  <h2
                    className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight
                         bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent"
                  >
                    Siap bikin album pertama?
                  </h2>
                </FadeIn>

                <FadeIn delay={200} direction="up">
                  <p className="mt-3 text-sm md:text-base text-zinc-300/90 leading-relaxed">
                    Kumpulkan momen. Bagikan rasa. Biar foto yang bercerita. 💜
                  </p>
                </FadeIn>

                <FadeIn delay={280} direction="up">
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/register"
                      className="group relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm md:text-base font-semibold
                         bg-violet-500 text-white
                         shadow-lg shadow-fuchsia-900/30 transition-all duration-200
                         hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="relative z-10">Mulai Sekarang</span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="relative z-10 group-hover:translate-x-0.5 transition-transform"
                      >
                        <path
                          d="M5 12h14m-7-7 7 7-7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {/* sheen */}
                      <span
                        className="pointer-events-none absolute inset-0 translate-y-[-120%] opacity-0
                                bg-gradient-to-b from-white/30 to-transparent transition-all duration-300
                                group-hover:opacity-100 group-hover:translate-y-0 rounded-xl"
                      />
                    </Link>

                    <a
                      href="#fitur"
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm md:text-base font-medium
                         border border-white/15 bg-white/5 text-zinc-200
                         hover:bg-white/10 hover:border-white/25 transition"
                    >
                      Lihat Fitur
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="group-hover:translate-x-0.5 transition-transform"
                      >
                        <path
                          d="m9 18 6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </FadeIn>

                <FadeIn delay={360} direction="up">
                  <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] md:text-sm text-zinc-400">
                    <li className="inline-flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M9 12l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Gratis selamanya
                    </li>
                    <li className="inline-flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="m7 11V7a5 5 0 0 1 10 0v4"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Data aman
                    </li>
                    <li className="inline-flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="m13 2-3 6h9l-4 9-7-8h7l-2-7z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Setup 1 menit
                    </li>
                  </ul>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="relative px-4 py-16 md:py-24 supports-[content-visibility:auto]:[content-visibility:auto] supports-[content-visibility:auto]:[contain-intrinsic-size:1px_680px]"
        >
          {/* subtle bg grid (opsional) */}

          <div className="max-w-5xl mx-auto">
            {/* header */}
            <div className="mb-10 md:mb-14 text-center">
              <FadeIn direction="up" distance={16}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-wide border border-white/10 bg-white/5 text-zinc-300">
                  FAQ • cepat & jelas
                </span>
              </FadeIn>

              <FadeIn delay={80} direction="up" distance={18}>
                <h2 className="mt-4 text-[22px] md:text-[28px] font-semibold bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">
                  Pertanyaan Umum
                </h2>
              </FadeIn>

              <FadeIn delay={140} direction="up" distance={18}>
                <p className="mt-2 text-sm md:text-[15px] text-zinc-400">
                  Ringkas, biar kamu nggak perlu scroll panjang-panjang.
                </p>
              </FadeIn>
            </div>

            {/* list */}
            <FadeIn delay={180} direction="up" distance={16}>
              <div className="mx-auto divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm">
                {[
                  {
                    q: "Apakah Share Album benar-benar gratis?",
                    a: "Ya, fitur inti 100% gratis. Nantinya ada opsi premium, tapi inti berbagi album akan tetap free.",
                  },
                  {
                    q: "Berapa banyak foto yang bisa diupload?",
                    a: "Tak ada batas jumlah per album. Batas ukuran per foto 10MB agar loading tetap gesit.",
                  },
                  {
                    q: "Apakah foto saya aman?",
                    a: "Disimpan terenkripsi. Akses via tautan unik. Album privat hanya untuk yang diundang.",
                  },
                  {
                    q: "Bisa edit atau hapus foto setelah diupload?",
                    a: "Bisa. Pembuat album bebas tambah, edit, hapus kapan saja. Pengunjung hanya reaksi & komentar.",
                  },
                  {
                    q: "Apakah nyaman di HP?",
                    a: "Iya. Desainnya mobile-first, ringan, dan responsif di semua perangkat.",
                  },
                ].map((item, i) => (
                  <FadeIn
                    key={item.q}
                    delay={220 + i * 80}
                    direction="up"
                    distance={18}
                  >
                    <details className="group open:bg-white/5 transition-colors will-change-transform">
                      <summary className="grid grid-cols-[auto,1fr,auto] items-center gap-3 md:gap-4 w-full cursor-pointer select-none px-4 md:px-6 py-4 md:py-5 list-none">
                        {/* index chip */}
                        <span
                          className="grid place-items-center w-7 h-7 rounded-lg text-[11px] font-semibold text-white
                             bg-[conic-gradient(from_180deg,theme(colors.violet.500),theme(colors.fuchsia.500))]
                             shadow-[0_6px_18px_rgba(139,92,246,.25)]"
                          aria-hidden
                        >
                          {i + 1}
                        </span>

                        {/* question */}
                        <h3 className="text-sm md:text-[15px] font-medium text-zinc-100">
                          {item.q}
                        </h3>

                        {/* toggle icon (plus→x) */}
                        <span
                          className="relative inline-grid place-items-center w-7 h-7 rounded-md border border-white/10 bg-white/5 transition-colors group-open:bg-white/10"
                          aria-hidden
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4 text-zinc-300 transition-transform duration-300 group-open:rotate-45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </summary>

                      {/* answer */}
                      <div className="px-4 md:px-6 pb-5 -mt-1">
                        <p className="pl-10 md:pl-11 text-sm md:text-[15px] leading-relaxed text-zinc-300/95">
                          {item.a}
                        </p>
                      </div>
                    </details>
                  </FadeIn>
                ))}
              </div>
            </FadeIn>

            {/* CTA kecil di bawah */}
            <FadeIn delay={220 + 5 * 80 + 80} direction="up" distance={16}>
              <div className="mt-6 flex items-center justify-center gap-3 text-xs md:text-sm text-zinc-400">
                <span>Ada yang belum kejawab?</span>
                <a
                  href="#kontak"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:translate-y-[-1px] transition"
                >
                  Hubungi kami
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14m-7-7 7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative px-4 py-14 md:py-16 border-t border-white/10 overflow-hidden">
          {/* top accent line */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />

          {/* soft ornaments */}

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* brand */}
              <div className="flex items-center gap-3">
                <div
                  className="grid place-items-center w-9 h-9 rounded-xl text-white text-[11px] font-semibold
                        bg-[conic-gradient(from_180deg,theme(colors.violet.500),theme(colors.fuchsia.500))]
                        shadow-[0_8px_24px_rgba(139,92,246,.35)]"
                >
                  SA
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Share Album
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Simpel untukmu, seru buat semua.
                  </p>
                </div>
              </div>

              {/* quick nav */}
              <nav className="flex items-center gap-4 text-sm">
                <a
                  href="#fitur"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  Fitur
                </a>
                <a
                  href="#cara-kerja"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  Cara kerja
                </a>
                <a
                  href="#faq"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </nav>

              {/* socials */}
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  aria-label="X (Twitter)"
                  className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10
                     grid place-items-center transition-colors"
                  title="X (Twitter)"
                >
                  {/* X */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-zinc-200"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4l16 16M20 4L4 20" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10
                     grid place-items-center transition-colors"
                  title="Instagram"
                >
                  {/* IG */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-zinc-200"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="3.5" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="GitHub"
                  className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10
                     grid place-items-center transition-colors"
                  title="GitHub"
                >
                  {/* GH */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-zinc-200"
                    fill="currentColor"
                  >
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.68c-2.78.6-3.36-1.2-3.36-1.2-.46-1.16-1.12-1.47-1.12-1.47-.92-.63.07-.62.07-.62 1.02.07 1.56 1.05 1.56 1.05.9 1.54 2.36 1.1 2.94.84.09-.66.35-1.1.64-1.36-2.22-.26-4.55-1.12-4.55-4.98 0-1.1.39-2 .1-2.72 0 0 .84-.27 2.75 1.04A9.57 9.57 0 0 1 12 7.48c.85 0 1.7.12 2.5.36 1.9-1.31 2.74-1.04 2.74-1.04.2.72.1 1.62.05 2.72 0 3.87-2.34 4.72-4.57 4.98.36.3.69.9.69 1.84v2.73c0 .27.18.58.68.48A10 10 0 0 0 12 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* bottom row */}
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 items-center gap-3 text-xs text-zinc-400">
              <p>
                © {new Date().getFullYear()}{" "}
                <span className="text-zinc-200">ShareBum</span>. Didedikasikan
                untuk sodara Nopal, agar beliau menjadi lebih semangat lagi
                menjalani hidup.
              </p>
              <div className="md:justify-self-end flex items-center gap-3">
                <a href="#" className="hover:text-zinc-300 transition-colors">
                  Kebijakan Privasi (Belum ada)
                </a>
                <span className="opacity-30">•</span>
                <a href="#" className="hover:text-zinc-300 transition-colors">
                  Ketentuan (Belum ada)
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <FloatingActions />
      {/* Floating "Kembali ke Dashboard" — hanya muncul kalau sudah login */}
      {hasToken && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <div className="mx-auto mt-3 w-fit rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-1.5 text-xs text-zinc-200 shadow">
            Kamu sudah login •{" "}
            <Link
              to="/dashboard"
              className="text-white underline underline-offset-4 hover:opacity-90"
            >
              Buka Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  // Component: FeatureCard.jsx (atau taruh di file yang sama)
  // ganti/buat ulang komponen ini
  // Icon kecil, inline SVG (tema ungu–fuchsia)
  function FeatureIcon({ name, className = "w-5 h-5" }) {
    const common = "stroke-current";
    switch (name) {
      case "lock":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${common}`}
            aria-hidden
          >
            <path
              d="M8 10V8a4 4 0 118 0v2"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="5" y="10" width="14" height="9" rx="2" strokeWidth="1.8" />
            <path d="M12 14v3" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case "image":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${common}`}
            aria-hidden
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="2.5"
              strokeWidth="1.8"
            />
            <path
              d="M7 14l3-3 4 4 3-3 3 3"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="8" r="1.5" strokeWidth="1.8" />
          </svg>
        );
      case "smile":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${common}`}
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
            <path
              d="M9 10h.01M15 10h.01"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8 14a6 6 0 008 0"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "message":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${common}`}
            aria-hidden
          >
            <path
              d="M21 12a7 7 0 01-7 7H8l-5 3 1.5-4A7 7 0 018 5h6a7 7 0 017 7z"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M9 12h6M9 9h8" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case "link":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${common}`}
            aria-hidden
          >
            <path
              d="M9 12a4 4 0 004 4h2a4 4 0 000-8h-2"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 12a4 4 0 01-4 4H9a4 4 0 110-8h2"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "zap":
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} ${common}`}
            aria-hidden
          >
            <path
              d="M13 2L6 13h5l-1 9 7-11h-5l1-9z"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  }

  function FeatureCard({ feature, index }) {
    const iconNames = ["lock", "image", "smile", "message", "link", "zap"];
    const iconName = iconNames[index % iconNames.length];

    return (
      <div
        className="
        group relative rounded-xl border border-white/10 bg-white/[0.04]
        p-5 md:p-6 transition-transform duration-200 hover:-translate-y-0.5 will-change-transform
        hover:shadow-md hover:shadow-black/20
      "
      >
        {/* header mini */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/[0.06] text-zinc-200 border border-white/[0.08]">
            <span className="grid place-items-center w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] text-white">
              {index + 1}
            </span>
            Fitur
          </span>
          <span className="text-[11px] text-zinc-400/90">Ringan</span>
        </div>

        {/* icon + content */}
        <div className="flex items-start gap-3">
          <div
            className="grid place-items-center w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 shrink-0
                     text-violet-400 group-hover:text-fuchsia-400 transition-colors"
          >
            <FeatureIcon name={iconName} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-medium text-white">
              {feature.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
              {feature.desc}
            </p>
          </div>
        </div>

        {/* garis aksen tipis */}
        <div className="mt-4 h-px bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-transparent" />
      </div>
    );
  }

  // taruh di file sama atau pisah: HowStep.jsx
  function StepIcon({ name, className = "w-5 h-5" }) {
    switch (name) {
      case "hand":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden
          >
            <path
              d="M8 11V6a2 2 0 1 1 4 0v5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 11V5a2 2 0 1 1 4 0v6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M16 11V7a2 2 0 1 1 4 0v6c0 4-3 7-7 7h-1.5a5.5 5.5 0 0 1-5.5-5.5V12a2 2 0 1 1 4 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "camera":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden
          >
            <rect
              x="3"
              y="6"
              width="18"
              height="13"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M9 6l1.5-2h3L15 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12.5"
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        );
      case "rocket":
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden
          >
            <path
              d="M14 10l-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M7 17l-2 2 2.5.5.5 2.5 2-2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 3c4.5 0 7 2.5 7 7 0 1-.2 2-.6 2.9L13.9 17.4A4 4 0 0 1 11 18l-5-5a4 4 0 0 1 .6-2.9L9.1 4.6C10 3.2 11 3 12 3z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle
              cx="15"
              cy="9"
              r="1.6"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        );
    }
  }

  // 2) Update HowStep: mapping emoji → nama ikon + styling tema
  function HowStep({ data, showArrow }) {
    // Bisa tetap kirim emoji; kita petakan ke nama ikon:
    const mapEmojiToName = {
      "👋": "hand",
      "📸": "camera",
      "🚀": "rocket",
    };
    const iconName = mapEmojiToName[data.icon] || data.icon || "hand";

    return (
      <div
        className="
        group relative rounded-2xl border border-white/10 bg-white/[0.06] p-5 md:p-6
        transition-all duration-300 hover:bg-white/[0.1] hover:-translate-y-0.5
      "
      >
        {/* header mini */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/[0.07] text-zinc-200 border border-white/[0.1]">
            <span className="grid place-items-center w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] text-white">
              {data.no}
            </span>
            Langkah
          </span>
          <span className="text-[11px] text-zinc-400">{data.tip}</span>
        </div>

        {/* icon + title */}
        <div className="flex items-start gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-lg bg-white/[0.07] border border-white/10 text-violet-400 group-hover:text-fuchsia-400 transition-colors">
            <StepIcon name={iconName} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-medium text-white">
              {data.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
              {data.desc}
            </p>
          </div>
        </div>

        {/* underline tipis */}
        <div className="mt-4 h-px bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-transparent" />

        {/* arrow connector (desktop) */}
        {showArrow && (
          <div
            aria-hidden
            className="hidden md:block absolute top-1/2 right-0 translate-x-4 w-8 h-0.5 bg-gradient-to-r from-violet-500/70 to-transparent"
          />
        )}
      </div>
    );
  }
}
