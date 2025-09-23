import React from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Cari judul/caption…",
}) {
  const [q, setQ] = React.useState(value || "");
  const inputRef = React.useRef(null);

  React.useEffect(() => setQ(value || ""), [value]);

  // Debounce 350ms
  React.useEffect(() => {
    const id = setTimeout(() => onChange?.(q), 350);
    return () => clearTimeout(id);
  }, [q, onChange]);

  // Ctrl/Cmd + K to focus
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clear = () => {
    setQ("");
    onChange?.("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative group w-full">
      {/* icon */}
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-violet-300"
        aria-hidden="true"
      >
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>

      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Cari"
        className={[
          "h-11 w-full rounded-2xl pl-10 pr-12 text-sm",
          "bg-white/5 border border-white/10 backdrop-blur",
          "text-white placeholder-white/40 selection:bg-violet-500/30",
          "outline-none transition-all duration-200",
          "focus:border-violet-400/40 focus:ring-4 ring-violet-500/20",
          "group-focus-within:shadow-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        ].join(" ")}
      />

      {/* Clear button / Shortcut hint */}
      {q ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear"
          className={[
            "absolute right-2 top-1/2 -translate-y-1/2",
            "grid place-items-center h-8 w-8 rounded-lg",
            "border border-white/10 bg-white/5 text-zinc-300",
            "hover:text-white hover:border-white/20 hover:bg-white/10",
            "active:scale-95 transition",
          ].join(" ")}
        >
          ×
        </button>
      ) : (
        <kbd
          className={[
            "hidden md:block absolute right-2 top-1/2 -translate-y-1/2",
            "text-[11px] px-1.5 py-0.5 rounded",
            "border border-white/10 bg-white/5 text-zinc-300",
          ].join(" ")}
        >
          Ctrl K
        </kbd>
      )}
    </div>
  );
}
