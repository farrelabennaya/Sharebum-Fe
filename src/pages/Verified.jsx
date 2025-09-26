// src/pages/Verified.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Verified() {
  const nav = useNavigate();

  // status: loading | success | error
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("Memverifikasi email kamu...");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("ok");
    const hasToken = !!p.get("token");

    // Simulate loading delay untuk UX yang lebih baik
    setTimeout(() => {
      if (ok === "1") {
        // Bersihkan token dari URL (privasi)
        const clean = new URL(window.location.href);
        clean.searchParams.delete("token");
        window.history.replaceState({}, "", clean.toString());

        setStatus("success");
        setMsg("Email kamu sudah berhasil diverifikasi! Sekarang kamu bisa masuk ke akun kamu.");
      } else {
        setStatus("error");
        setMsg("Link verifikasi tidak valid atau sudah kedaluwarsa. Silakan minta link verifikasi baru.");
      }
    }, 1200);
  }, []);

  const Icon = useMemo(() => {
    if (status === "loading") {
      return (
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 animate-pulse"></div>
          <svg className="w-10 h-10 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
            <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    }
    
    if (status === "success") {
      return (
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/20 to-green-400/20 animate-pulse"></div>
          <div className="absolute inset-2 rounded-full border-2 border-emerald-400/30 animate-ping"></div>
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/40 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
              <path
                d="M20 7 9 18l-5-5"
                fill="none"
                stroke="rgb(52, 211, 153)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-path"
              />
            </svg>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400/20 to-red-400/20 animate-pulse"></div>
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-400/40 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(248, 113, 113)" strokeWidth="2" className="error-circle" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="rgb(248, 113, 113)" strokeWidth="2.5" strokeLinecap="round" className="error-x" />
          </svg>
        </div>
      </div>
    );
  }, [status]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setIsResending(true);
    
    const email = new FormData(e.currentTarget).get("email");
    try {
      const res = await fetch("/api/email/verification-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) throw new Error();
      
      // Success feedback
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Terkirim!";
      submitBtn.className = submitBtn.className.replace('bg-violet-600 hover:bg-violet-700', 'bg-emerald-600');
      
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.className = submitBtn.className.replace('bg-emerald-600', 'bg-violet-600 hover:bg-violet-700');
        e.currentTarget.reset();
      }, 2000);
      
    } catch {
      // Error feedback
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Gagal!";
      submitBtn.className = submitBtn.className.replace('bg-violet-600 hover:bg-violet-700', 'bg-rose-600');
      
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.className = submitBtn.className.replace('bg-rose-600', 'bg-violet-600 hover:bg-violet-700');
      }, 2000);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-emerald-500/3 blur-2xl animate-pulse delay-500"></div>
      </div>

      <div
        className="relative max-w-lg w-full mx-auto"
        role="status"
        aria-live="polite"
      >
        {/* Main card */}
        <div className="relative p-8 sm:p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transform transition-all duration-500 ease-out">
          {/* Glassmorphism effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-transparent to-violet-500/5"></div>
          
          <div className="relative">
            {/* Header section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6 transform transition-all duration-700 ease-out">
                {Icon}
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {status === "loading" && "Memverifikasi"}
                {status === "success" && "Berhasil!"}
                {status === "error" && "Oops!"}
              </h1>
              
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                {msg}
              </p>
            </div>

            {/* Success actions */}
            {status === "success" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => nav("/")}
                    className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-violet-500/25 transform hover:scale-105 active:scale-95"
                  >
                    Masuk Sekarang
                  </button>
                  <button
                    onClick={() => nav("/")}
                    className="flex-1 px-6 py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 backdrop-blur-sm hover:border-white/30 transform hover:scale-105 active:scale-95"
                  >
                    Ke Halaman Login
                  </button>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-xs text-gray-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 inline-block">
                    ✅ Akun kamu sudah siap digunakan
                  </p>
                </div>
              </div>
            )}

            {/* Error actions */}
            {status === "error" && (
              <div className="space-y-6 animate-fadeIn">
                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      placeholder="Masukkan email kamu"
                      required
                      disabled={isResending}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isResending}
                    className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-violet-500/25 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none"
                  >
                    {isResending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Mengirim...
                      </span>
                    ) : (
                      "Kirim Ulang Verifikasi"
                    )}
                  </button>
                </form>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                  <h3 className="text-rose-200 font-medium mb-2 text-sm">💡 Tips:</h3>
                  <ul className="text-xs text-rose-300 space-y-1">
                    <li>• Periksa folder spam/junk email kamu</li>
                    <li>• Pastikan menggunakan perangkat yang sama</li>
                    <li>• Link verifikasi berlaku 24 jam</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading progress bar */}
        {status === "loading" && (
          <div className="mt-6 mx-auto w-48">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-loading-bar"></div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS */}
      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }

        .animate-fadeIn {
          animation: fadeIn 600ms ease-out forwards;
        }
        
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .check-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: draw 800ms ease-out forwards 300ms;
        }
        
        .error-circle {
          stroke-dasharray: 57;
          stroke-dashoffset: 57;
          animation: draw 600ms ease-out forwards 200ms;
        }
        
        .error-x {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: draw 400ms ease-out forwards 600ms;
        }

        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }

        /* Responsive improvements */
        @media (max-width: 640px) {
          .min-h-screen {
            min-height: 100dvh;
          }
        }
      `}</style>
    </div>
  );
}