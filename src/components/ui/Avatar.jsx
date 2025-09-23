// components/ui/Avatar.jsx
import React from "react";

export default function Avatar({ src, name, className = "w-9 h-9" }) {
  const [broken, setBroken] = React.useState(false);
  const initials =
    (name || "")
      .split(" ")
      .map(s => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setBroken(true)}
        className={`${className} rounded-full object-cover ring-1 ring-white/10`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white font-bold text-sm ring-1 ring-white/10`}
      aria-hidden={!!src}
      title={name || "User"}
    >
      {initials}
    </div>
  );
}
