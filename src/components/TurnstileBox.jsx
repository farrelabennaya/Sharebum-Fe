// components/TurnstileBox.jsx
import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function TurnstileBox({
  onToken,
  onExpire,
  className = "",
  theme = "dark",
  // pakai flexible biar ngikut kontainer
  size = "flexible", // "flexible" | "normal" | "compact" | "invisible"
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.turnstile || !ref.current || !SITE_KEY) return;
    const w = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      theme,
      size,
      callback: (t) => onToken?.(t),
      "expired-callback": () => onExpire?.(),
      "error-callback": () => onToken?.(null),
    });
    return () => window.turnstile?.remove(w);
  }, []);

  return (
    <div
      ref={ref}
      className={[
        // bikin kontainer full width + tinggi minimal biar layout nggak loncat
        "w-full min-h-[65px]",
        // pastikan iframe yang dibuat Turnstile ikut 100% lebar kontainer
        "[&>iframe]:w-full [&>iframe]:!max-w-none",
        className,
      ].join(" ")}
    />
  );
}
