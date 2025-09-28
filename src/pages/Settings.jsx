// src/pages/Settings.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../lib/api.js";
import { Btn } from "../components/ui/Btn.jsx";
import { Card } from "../components/ui/Card.jsx";

/* ---------- helpers UI ---------- */
function Section({ title, desc, children }) {
  return (
    <Card className="bg-white/[0.06] border-white/10">
      <div className="p-5 md:p-6 space-y-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold">{title}</h3>
          {desc && <p className="text-sm text-zinc-400 mt-1">{desc}</p>}
        </div>
        {children}
      </div>
    </Card>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
      <div className="min-w-[220px]">
        <div className="text-sm font-medium text-zinc-200">{label}</div>
        {hint && <div className="text-xs text-zinc-400 mt-0.5">{hint}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      className={[
        "inline-flex items-center gap-3 select-none",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={[
          "w-11 h-6 rounded-full p-0.5 transition-colors",
          checked ? "bg-violet-500/80" : "bg-zinc-600/70",
        ].join(" ")}
      >
        <span
          className={[
            "block w-5 h-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function Select({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        "w-full md:w-auto rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/40 " +
        className
      }
    >
      {children}
    </select>
  );
}

/* ---------- apply client preference quickly ---------- */
function applyClientPrefs({ theme, reducedMotion, compact }) {
  const root = document.documentElement;

  // theme
  if (theme === "dark") {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    // system
    localStorage.removeItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    root.classList.toggle("dark", prefersDark);
  }

  // reduced motion
  if (reducedMotion) {
    root.style.setProperty("--motion-scale", "0");
    localStorage.setItem("reducedMotion", "1");
  } else {
    root.style.removeProperty("--motion-scale");
    localStorage.removeItem("reducedMotion");
  }

  // compact density
  if (compact) {
    root.classList.add("density-compact"); // optional: gunakan untuk mengecilkan paddings
    localStorage.setItem("compact", "1");
  } else {
    root.classList.remove("density-compact");
    localStorage.removeItem("compact");
  }
}

export default function Settings() {
  const navigate = useNavigate();

  // base state
  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState(null);
  // derived flags
  // const hasGoogle = !!me?.google_id;
  // const hasPassword = !!(me?.has_password ?? me?.password_set_at);

  const hasPassword = !!me?.has_password;
const hasGoogle   = !!me?.google_id;

  // messages
  const [msg, setMsg] = React.useState(null);
  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 2500);
  };

  // Preferences
  const [theme, setTheme] = React.useState("dark"); // system | dark | light
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  const [locale, setLocale] = React.useState("id"); // id | en

  // Privacy / Default album
  const [defaultVisibility, setDefaultVisibility] = React.useState("private"); // private | unlisted | public
  const [allowCommentsDefault, setAllowCommentsDefault] = React.useState(true);
  const [allowReactsDefault, setAllowReactsDefault] = React.useState(true);

  // Notifications
  const [notifComments, setNotifComments] = React.useState(true);
  const [notifReacts, setNotifReacts] = React.useState(false);
  const [notifShares, setNotifShares] = React.useState(false);

  // Security
  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [newPass2, setNewPass2] = React.useState("");
  const [savingPass, setSavingPass] = React.useState(false);
  const [savingPref, setSavingPref] = React.useState(false);
  const [savingPrivacy, setSavingPrivacy] = React.useState(false);
  const [savingNotif, setSavingNotif] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const u = await apiGet("/api/me");
        setMe(u);

        // try load server settings (optional)
        let s = {};
        try {
          s = await apiGet("/api/me/settings"); // jika belum ada endpoint, akan kena catch
        } catch (_) {
          s = {};
        }

        setTheme(s.theme ?? localStorage.getItem("theme") ?? "dark");
        setReducedMotion(
          !!(s.reduced_motion ?? localStorage.getItem("reducedMotion"))
        );
        setCompact(!!(s.compact ?? localStorage.getItem("compact")));
        setLocale(s.locale ?? "id");

        setDefaultVisibility(s.default_visibility ?? "private");
        setAllowCommentsDefault(
          typeof s.allow_comments_default === "boolean"
            ? s.allow_comments_default
            : true
        );
        setAllowReactsDefault(
          typeof s.allow_reacts_default === "boolean"
            ? s.allow_reacts_default
            : true
        );

        setNotifComments(
          typeof s.email_new_comment === "boolean" ? s.email_new_comment : true
        );
        setNotifReacts(
          typeof s.email_new_reaction === "boolean"
            ? s.email_new_reaction
            : false
        );
        setNotifShares(
          typeof s.email_album_shared === "boolean"
            ? s.email_album_shared
            : false
        );

        // apply instantly
        applyClientPrefs({
          theme: s.theme ?? "dark",
          reducedMotion: !!(s.reduced_motion ?? false),
          compact: !!(s.compact ?? false),
        });
      } catch (e) {
        localStorage.removeItem("token");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function savePreferences() {
    setSavingPref(true);
    applyClientPrefs({ theme, reducedMotion, compact });
    try {
      await apiPatch("/api/me/settings", {
        theme,
        reduced_motion: !!reducedMotion,
        compact: !!compact,
        locale,
      });
      flash("ok", "Preferensi tersimpan.");
    } catch (e) {
      flash("error", e?.message || "Gagal menyimpan preferensi.");
    } finally {
      setSavingPref(false);
    }
  }

  async function savePrivacy() {
    setSavingPrivacy(true);
    try {
      await apiPatch("/api/me/settings", {
        default_visibility: defaultVisibility,
        allow_comments_default: !!allowCommentsDefault,
        allow_reacts_default: !!allowReactsDefault,
      });
      flash("ok", "Pengaturan privasi tersimpan.");
    } catch (e) {
      flash("error", e?.message || "Gagal menyimpan privasi.");
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function saveNotif() {
    setSavingNotif(true);
    try {
      await apiPatch("/api/me/settings", {
        email_new_comment: !!notifComments,
        email_new_reaction: !!notifReacts,
        email_album_shared: !!notifShares,
      });
      flash("ok", "Preferensi notifikasi tersimpan.");
    } catch (e) {
      flash("error", e?.message || "Gagal menyimpan notifikasi.");
    } finally {
      setSavingNotif(false);
    }
  }

  async function changePassword(e) {
    e?.preventDefault?.();

    if (!newPass || newPass.length < 8) {
      flash("error", "Password baru minimal 8 karakter.");
      return;
    }
    if (newPass !== newPass2) {
      flash("error", "Konfirmasi password tidak cocok.");
      return;
    }

    // payload berbeda:
    // - Email/password ATAU Google yang sudah punya password → wajib current_password
    // - Google tanpa password → TIDAK perlu current_password (set pertama)
    const payload = hasPassword
      ? {
          current_password: oldPass,
          password: newPass,
          password_confirmation: newPass2,
        }
      : {
          password: newPass,
          password_confirmation: newPass2,
        };

    if (hasPassword && !payload.current_password) {
      flash("error", "Isi password saat ini.");
      return;
    }

    setSavingPass(true);
    try {
      await apiPatch("/api/me/password", payload);
      setOldPass("");
      setNewPass("");
      setNewPass2("");

      // update flag lokal agar UI berubah jadi “Ganti Password”
      if (!hasPassword) {
        setMe((m) => ({
          ...(m || {}),
          has_password: true,
          password_set_at: new Date().toISOString(),
        }));
      }

      flash(
        "ok",
        hasPassword ? "Password berhasil diubah." : "Password berhasil disetel."
      );
    } catch (e) {
      flash("error", e?.message || "Gagal menyimpan password.");
    } finally {
      setSavingPass(false);
    }
  }

  async function logoutAll() {
    try {
      await apiPost("/api/logout-all", {});
      flash("ok", "Semua sesi keluar. Silakan login ulang.");
      localStorage.removeItem("token");
      location.href = "/";
    } catch (e) {
      flash("error", e?.message || "Gagal logout semua sesi.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white">
      {/* ornaments */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto,1fr,auto] items-center gap-2">
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

          <div className="font-semibold text-center truncate">Pengaturan</div>
          <div className="w-9 h-9" />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20 md:pb-10">
        {loading ? (
          <Card>
            <div className="p-6 text-zinc-400">Memuat pengaturan…</div>
          </Card>
        ) : (
          <>
            {/* Preferensi Tampilan */}

            {/* Keamanan Akun */}
            <Section
              title="Keamanan Akun"
              desc={
                hasGoogle && !hasPassword
                  ? "Akun kamu terhubung Google. Setel password agar bisa login dengan email juga."
                  : hasGoogle && hasPassword
                  ? "Akun terhubung Google dan sudah punya password."
                  : "Ganti password dan kelola sesi login."
              }
            >
              {/* Badge metode login */}
              <div className="mb-1">
                {hasGoogle ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 12a9 9 0 1 1-2.64-6.36"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M22 12h-9"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Login via Google
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-400/20">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 17a5 5 0 1 0-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M3 21h18"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Login via Email
                  </span>
                )}
              </div>

              <form onSubmit={changePassword} className="space-y-3" noValidate>
                {/* Field 'password saat ini' hanya muncul jika sudah punya password */}
                {hasPassword && (
                  <Row label="Password saat ini">
                    <input
                      type="password"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full md:w-96 rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/40"
                    />
                  </Row>
                )}

                <Row label={hasPassword ? "Password baru" : "Buat password"}>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full md:w-96 rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/40"
                  />
                </Row>

                <Row label="Ulangi password baru">
                  <input
                    type="password"
                    value={newPass2}
                    onChange={(e) => setNewPass2(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full md:w-96 rounded-xl border border-white/10 bg-zinc-800/70 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/40"
                  />
                </Row>

                {/* Hint khusus akun Google tanpa password */}
                {hasGoogle && !hasPassword && (
                  <p className="text-xs text-zinc-400">
                    Kamu belum punya password karena akun dibuat dengan Google.
                    Mengisi form ini akan menambahkan password sehingga kamu
                    juga bisa login dengan email & password.
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Btn
                    type="submit"
                    disabled={
                      savingPass ||
                      !newPass ||
                      newPass.length < 8 ||
                      newPass !== newPass2 ||
                      (hasPassword && !oldPass)
                    }
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
                  >
                    {savingPass
                      ? "Menyimpan…"
                      : hasPassword
                      ? "Ganti Password"
                      : "Setel Password"}
                  </Btn>

                  {msg && (
                    <span
                      className={
                        "text-sm ml-auto " +
                        (msg.type === "ok"
                          ? "text-emerald-300"
                          : "text-red-300")
                      }
                      role="status"
                    >
                      {msg.text}
                    </span>
                  )}
                </div>
              </form>
            </Section>
          </>
        )}
      </main>
    </div>
  );
}
