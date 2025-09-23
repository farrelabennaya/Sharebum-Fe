import React from "react";

export const Card = ({ children, className = "" }) => (
  <div
    className={
      "rounded-2xl bg-white border p-4 r border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40" +
      className
    }
  >
    {children}
  </div>
);
