// src/hooks/useGoogleId.js
import { useEffect, useRef, useState } from "react";

export default function useGoogleId({ clientId, onCredential }) {
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!clientId) return;

    const src = "https://accounts.google.com/gsi/client";
    // sudah ada?
    if (document.querySelector(`script[src="${src}"]`)) {
      setReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);

    return () => {
      // optional: biarkan script nempel saja
    };
  }, [clientId]);

  useEffect(() => {
    if (!ready || initialized.current) return;
    if (!window.google || !clientId) return;

    // init sekali
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        // response.credential = ID Token (JWT)
        onCredential?.(response.credential);
      },
      // auto_select: false, // optional
      // cancel_on_tap_outside: true,
    });

    initialized.current = true;
  }, [ready, clientId, onCredential]);

  const renderButton = (container, options = {}) => {
    if (!window.google?.accounts?.id || !container) return;
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      logo_alignment: "left",
      text: "signin_with",
      ...options,
    });
  };

  const promptOneTap = () => {
    window.google?.accounts?.id?.prompt?.(); // kalau mau One Tap
  };

  return { ready, renderButton, promptOneTap };
}
