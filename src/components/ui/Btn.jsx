import React from "react";
import { Link } from "react-router-dom";

export const Btn = ({ className = "", type = "button", ...p }) => (
  <button
    type={type}
    {...p}
    className={"px-3 py-2 rounded-lg border text-sm " + className}
  />
);

export const BtnPage = ({ className = "", ...p }) => (
  <button
    type="button"
    {...p}
    className={
      "inline-flex items-center justify-center rounded-lg border text-sm leading-none select-none " +
      className
    }
  />
);


export const Primary = ({ className = "", type = "button", ...p }) => (
  <Btn
    type={type}
    {...p}
    className={"bg-violet-500 border-violet-600 text-white  " + className}
  />
);

export const Ghost = ({ className = "", ...p }) => (
  <Btn
    {...p}
    className={
      "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 transition " +
      className
    }
  />
);

export const Gradient = React.forwardRef(
  ({ className = "", iconLeft = null, href, children, ...p }, ref) => {
    const Cmp = href ? "a" : "button";
    return (
      <Cmp
        ref={ref}
        href={href}
        {...p}
        className={[
          "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium",
          "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
          "shadow-lg shadow-fuchsia-900/30 hover:opacity-95 transition",
          className,
        ].join(" ")}
      >
        {iconLeft}
        {children}
      </Cmp>
    );
  }
);

export const GradientLink = React.forwardRef(
  ({ className = "", iconLeft = null, to, children, ...p }, ref) => (
    <Link
      ref={ref}
      to={to}
      {...p}
      className={[
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium",
        "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
        "shadow-lg shadow-fuchsia-900/30 hover:opacity-95 transition",
        className,
      ].join(" ")}
    >
      {iconLeft}
      {children}
    </Link>
  )
);

export const Danger = React.forwardRef(
  (
    {
      className = "",
      type = "button",
      loading = false,        // sama dengan "busy"
      loadingText = "Memproses…",
      children = "Hapus",
      disabled,
      ...p
    },
    ref
  ) => {
    const isDisabled = !!disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...p}
        className={[
          "inline-flex items-center gap-2 rounded-lg px-3 py-2",
          "bg-red-600 hover:bg-red-600/90 text-white border border-red-500 text-sm",
          "shadow-lg shadow-red-900/30 transition",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        ].join(" ")}
      >
        {loading && (
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" />
          </svg>
        )}
        {loading ? loadingText : children}
      </button>
    );
  }
);
Danger.displayName = "Danger";