// src/pages/Verified.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Verified() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Memverifikasi...");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("ok");
    const token = p.get("token");

    if (ok === "1" && token) {
      // simpan token
      localStorage.setItem("token", token);

      // bersihkan token dari url (privasi)
      const cleanUrl = window.location.origin + "/verified?ok=1";
      window.history.replaceState({}, "", cleanUrl);

      setMsg("Verifikasi berhasil. Mengarahkan ke dashboard...");
      // kecilin delay biar ada feedback
      setTimeout(() => nav("/dashboard"), 500);
    } else if (ok === "1") {
      setMsg("Verifikasi berhasil. Silakan masuk.");
    } else {
      setMsg("Verifikasi gagal atau link kedaluwarsa.");
    }
  }, [nav]);

  return (
    <div className="min-h-svh grid place-items-center bg-black text-white">
      <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <h1 className="text-xl font-semibold mb-2">Cek Status</h1>
        <p className="text-zinc-300">{msg}</p>

        {/* Opsi kirim ulang kalau gagal */}
        {msg.includes("gagal") && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email");
              try {
                await fetch("/api/email/verification-notification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                alert("Jika email terdaftar, tautan verifikasi dikirim ulang.");
              } catch {
                alert("Gagal mengirim ulang.");
              }
            }}
          >
            <input
              name="email"
              type="email"
              placeholder="Email kamu"
              required
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
            />
            <button className="px-4 py-2 rounded-xl bg-violet-600">
              Kirim ulang
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
