// src/pages/Register.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api.js";

/* ========= Particle Background (ringan) ========= */
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
      const num = Math.min(50, Math.floor(window.innerWidth / 30));
      for (let i = 0; i < num; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: Math.random() * 2 + 1,
          o: Math.random() * 0.3 + 0.1,
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
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 100) {
          const force = (100 - d) / 100;
          p.vx -= (dx / d) * force * 0.01;
          p.vy -= (dy / d) * force * 0.01;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.o})`;
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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ================= Register ================= */
export default function Register() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrs, setFieldErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const onMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // password strength
  const pwd = useMemo(() => {
    const p = password || "";
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const label =
      ["", "Lemah", "Cukup", "Lumayan", "Kuat", "Sangat kuat"][s] || "Lemah";
    const barClass =
      s <= 2
        ? "from-rose-500 to-orange-500"
        : s === 3
        ? "from-amber-500 to-yellow-500"
        : "from-emerald-500 to-teal-500";
    return { score: s, label, barClass, width: `${(s / 5) * 100}%` };
  }, [password]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setFieldErrs({});
    if (!name || !email || !password) {
      setErr("Nama, email, dan password wajib diisi.");
      return;
    }
    if (password !== password2) {
      setErr("Konfirmasi password tidak cocok.");
      return;
    }

    setBusy(true);
    try {
      const res = await apiPost("/api/auth/register", {
        name,
        email,
        password,
        password_confirmation: password2,
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
      } else {
        const login = await apiPost("/api/auth/login", { email, password });
        localStorage.setItem("token", login.token);
      }
      nav("/dashboard");
    } catch (e) {
      if (e?.status === 422 && e?.data?.errors) {
        setFieldErrs(e.data.errors || {});
        setErr("Periksa kembali data yang diisi.");
      } else {
        setErr(String(e?.message || e || "Gagal mendaftar"));
      }
    } finally {
      setBusy(false);
    }
  }

  // === GOOGLE LOGIN (render tombol + callback) ===
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!window.google || !window.google.accounts || !document.getElementById("gsi-btn-reg")) return;

    const handleCredentialResponse = async (res) => {
      // res.credential = id_token
      try {
        const out = await apiPost("/api/auth/google", { id_token: res.credential });
        localStorage.setItem("token", out.token);
        nav("/dashboard");
      } catch (e) {
        setErr(String(e?.message || "Login Google gagal"));
      }
    };

    // init GIS
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      ux_mode: "popup", // aman untuk SPA
    });

    // render button
    window.google.accounts.id.renderButton(document.getElementById("gsi-btn-reg"), {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: 310,
    });

    // optional: One Tap
    // window.google.accounts.id.prompt();

    return () => {};
  }, []);

  const FE = ({ name }) =>
    fieldErrs?.[name] ? (
      <p className="text-xs text-red-400 mt-1">{fieldErrs[name][0]}</p>
    ) : null;

  const mismatch = password2 && password2 !== password;

  return (
    <div className="relative min-h-svh flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      {/* Layer background (partikel + orbs) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ParticleBackground />
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

      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />

        <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Buat Akun</h1>
            <p className="text-sm text-zinc-300/80">
              Yuk gabung. Share Share album kita.
            </p>
          </div>

          {err && (
            <div
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              aria-live="polite"
            >
              {err}
            </div>
          )}

          {/* Nama */}
          <div className="relative">
            <input
              id="name"
              type="text"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-3 text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40 outline-none transition-all duration-200",
                "pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                fieldErrs?.name
                  ? "ring-1 ring-red-500/40"
                  : "focus:ring-1 focus:ring-violet-400/30",
              ].join(" ")}
              autoComplete="name"
              aria-invalid={!!fieldErrs?.name}
            />
            <span
              className={[
                "pointer-events-none absolute left-3 text-zinc-400 opacity-80",
                "top-[0.9rem] transition-all duration-200",
                "peer-focus:top-[1.15rem] peer-[&:not(:placeholder-shown)]:top-[1.15rem]",
              ].join(" ")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <label
              htmlFor="name"
              className={[
                "pointer-events-none absolute left-10 transition-all duration-200",
                "top-2 -translate-y-0 text-xs text-zinc-300",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                "peer-focus:top-2 peer-focus:-translate-y-0",
                "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
              ].join(" ")}
            >
              Nama
            </label>
            <FE name="name" />
          </div>

          {/* Email */}
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-3 text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40 outline-none transition-all duration-200",
                "pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                fieldErrs?.email
                  ? "ring-1 ring-red-500/40"
                  : "focus:ring-1 focus:ring-violet-400/30",
              ].join(" ")}
              autoComplete="email"
              aria-invalid={!!fieldErrs?.email}
            />
            <span
              className={[
                "pointer-events-none absolute left-3 text-zinc-400 opacity-80",
                "top-[0.9rem] transition-all duration-200",
                "peer-focus:top-[1.15rem] peer-[&:not(:placeholder-shown)]:top-[1.15rem]",
              ].join(" ")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <label
              htmlFor="email"
              className={[
                "pointer-events-none absolute left-10 transition-all duration-200",
                "top-2 -translate-y-0 text-xs text-zinc-300",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                "peer-focus:top-2 peer-focus:-translate-y-0",
                "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
              ].join(" ")}
            >
              Email
            </label>
            <FE name="email" />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={[
                  "peer w-full rounded-xl bg-white/5 pl-10 pr-16",
                  "pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                  "text-white placeholder-transparent",
                  "border border-white/10 focus:border-violet-400/40",
                  "outline-none transition-all duration-200",
                  fieldErrs?.password
                    ? "ring-1 ring-red-500/40"
                    : "focus:ring-1 focus:ring-violet-400/30",
                ].join(" ")}
                autoComplete="new-password"
                aria-invalid={!!fieldErrs?.password}
              />
              <span
                className={[
                  "pointer-events-none absolute left-3 text-zinc-400 opacity-80",
                  "top-[0.9rem] transition-all duration-200",
                  "peer-focus:top-[1.15rem] peer-[&:not(:placeholder-shown)]:top-[1.15rem]",
                ].join(" ")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <label
                htmlFor="password"
                className={[
                  "pointer-events-none absolute left-10 transition-all duration-200",
                  "top-2 -translate-y-0 text-xs text-zinc-300",
                  "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                  "peer-focus:top-2 peer-focus:-translate-y-0",
                  "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
                ].join(" ")}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className={[
                  "absolute right-2 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition",
                  "top-[0.8rem] transition-all duration-200",
                  "peer-focus:top-[1.05rem] peer-[&:not(:placeholder-shown)]:top-[1.05rem]",
                ].join(" ")}
                aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>

            <FE name="password" />

            <div className="mt-1">
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${pwd.barClass} transition-all duration-300`}
                  style={{ width: pwd.width }}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Kekuatan: <span className="text-zinc-200">{pwd.label}</span>
                <span className="ml-1 text-zinc-500">({password.length || 0} karakter)</span>
              </p>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div className="relative">
            <input
              id="password2"
              type={showPass2 ? "text" : "password"}
              placeholder=" "
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={[
                "peer w-full rounded-xl bg-white/5 pl-10 pr-14 text-white placeholder-transparent",
                "border border-white/10 focus:border-violet-400/40 outline-none transition-all duration-200",
                "pt-3 pb-3 focus:pt-5 [&:not(:placeholder-shown)]:pt-5",
                mismatch ? "ring-1 ring-amber-500/40" : "focus:ring-1 focus:ring-violet-400/30",
              ].join(" ")}
              autoComplete="new-password"
              aria-invalid={mismatch}
            />
            <span
              className={[
                "pointer-events-none absolute left-3 text-zinc-400 opacity-80",
                "top-[0.9rem] transition-all duration-200",
                "peer-focus:top-[1.15rem] peer-[&:not(:placeholder-shown)]:top-[1.15rem]",
              ].join(" ")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <label
              htmlFor="password2"
              className={[
                "pointer-events-none absolute left-10 transition-all duration-200",
                "top-2 -translate-y-0 text-xs text-zinc-300",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400",
                "peer-focus:top-2 peer-focus:-translate-y-0",
                "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0",
              ].join(" ")}
            >
              Konfirmasi Password
            </label>
            <button
              type="button"
              onClick={() => setShowPass2((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition"
              aria-label={showPass2 ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
            >
              {showPass2 ? "Hide" : "Show"}
            </button>
            {mismatch && <p className="text-xs text-amber-300 mt-1">Konfirmasi password belum sama.</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className={[
              "group relative w-full overflow-hidden rounded-xl px-4 py-3",
              "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
              "shadow-lg shadow-fuchsia-900/30",
              "transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute inset-0 translate-y-[-100%] bg-gradient-to-b from-white/20 to-transparent opacity-0 transition group-hover:opacity-100 group-hover:translate-y-0" />
            <span className="inline-flex items-center justify-center gap-2 font-medium">
              {busy && (
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3"></path>
                </svg>
              )}
              {busy ? "Mendaftar…" : "Daftar"}
            </span>
          </button>

          {/* OR + Google Button */}
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-400">atau</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="flex justify-center">
            <div id="gsi-btn-reg" />
          </div>

          {/* Footer */}
          <p className="text-sm text-zinc-400 text-center">
            Sudah punya akun?{" "}
            <Link to="/" className="text-white underline underline-offset-4 hover:opacity-90">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
