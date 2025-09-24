// components/TurnstileBox.jsx
import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function TurnstileBox({ onToken }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.turnstile || !ref.current || !SITE_KEY) return;
    const w = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      theme: "dark",          // biar nyambung dengan UI kamu
      size: "normal",         // "compact" kalau butuh lebih kecil
      callback: (token) => onToken?.(token),
      "error-callback": () => onToken?.(null),
      "expired-callback": () => onToken?.(null),
    });
    return () => window.turnstile?.remove(w);
  }, []);

  return <div ref={ref} className="flex justify-center" />;
}
