import { useEffect, useState } from "react";

export function useIdle(ms = 1800) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t;
    const poke = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), ms);
    };
    const opts = { passive: true };
    window.addEventListener("mousemove", poke, opts);
    window.addEventListener("touchstart", poke, opts);
    window.addEventListener("keydown", poke);
    poke();
    return () => {
      window.removeEventListener("mousemove", poke);
      window.removeEventListener("touchstart", poke);
      window.removeEventListener("keydown", poke);
      clearTimeout(t);
    };
  }, [ms]);
  return idle;
}
