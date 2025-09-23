// lib/api.js
const API = import.meta.env.VITE_API_BASE || "";

/** URL resolver: dukung absolute & relative */
function resolveUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : API + url;
}

/** Inject Authorization jika ada token + merge header custom */
function authHeaders(extra = {}, noAuth = false) {
  const base = { Accept: "application/json", ...extra };
  if (noAuth) return base;
  const t = localStorage.getItem("token");
  return t ? { ...base, Authorization: `Bearer ${t}` } : base;
}

/** Handler response: parse JSON error (422), auto sign-out on 401/419 */
async function handle(res, { allow401 } = {}) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    if (!allow401 && (res.status === 401 || res.status === 419)) {
      localStorage.removeItem("token");
      if (!location.pathname.startsWith("/album/")) location.href = "/";
    }

    if (isJson) {
      let data = {};
      try { data = await res.json(); } catch {}
      const firstFieldMsg =
        data?.errors && typeof data.errors === "object"
          ? (() => {
              const k = Object.keys(data.errors)[0];
              return data.errors[k]?.[0];
            })()
          : null;
      const err = new Error(firstFieldMsg || data?.message || data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.errors = data?.errors;
      err.payload = data;
      throw err;
    } else {
      const text = await res.text().catch(() => "");
      const err = new Error(text || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
  }

  if (res.status === 204) return null;
  if (isJson) return res.json();

  // sukses tapi bukan JSON → kemungkinan salah target (kena index.html Vite)
  const text = await res.text().catch(() => "");
  throw new Error(`Non-JSON response (got "${ct}"). Snippet: ${text.slice(0, 120)}…`);
}

/* ===================== HTTP helpers ===================== */

export async function apiGet(url, opts = {}) {
  const res = await fetch(resolveUrl(url), {
    method: "GET",
    headers: authHeaders(opts.headers, opts.noAuth),
    ...(opts.fetch || {}),
  });
  return handle(res, { allow401: opts.allow401 });
}

export async function apiPost(url, data = {}, opts = {}) {
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;
  const headers = isForm
    ? authHeaders(opts.headers, opts.noAuth) // JANGAN set Content-Type untuk FormData
    : authHeaders({ "Content-Type": "application/json", ...(opts.headers || {}) }, opts.noAuth);

  const res = await fetch(resolveUrl(url), {
    method: "POST",
    headers,
    body: isForm ? data : JSON.stringify(data),
    ...(opts.fetch || {}),
  });
  return handle(res, { allow401: opts.allow401 });
}

export async function apiPatch(url, data = {}, opts = {}) {
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;
  const headers = isForm
    ? authHeaders(opts.headers, opts.noAuth)
    : authHeaders({ "Content-Type": "application/json", ...(opts.headers || {}) }, opts.noAuth);

  const res = await fetch(resolveUrl(url), {
    method: "PATCH",
    headers,
    body: isForm ? data : JSON.stringify(data),
    ...(opts.fetch || {}),
  });
  return handle(res, { allow401: opts.allow401 });
}

export async function apiDelete(url, opts = {}) {
  const res = await fetch(resolveUrl(url), {
    method: "DELETE",
    headers: authHeaders(opts.headers, opts.noAuth),
    ...(opts.fetch || {}),
  });
  return handle(res, { allow401: opts.allow401 });
}

/** Opsional: helper upload biar singkat */
export async function apiUpload(url, fileOrForm, field = "file", extra = {}, opts = {}) {
  const fd =
    fileOrForm instanceof FormData
      ? fileOrForm
      : (() => {
          const f = new FormData();
          f.append(field, fileOrForm);
          Object.entries(extra || {}).forEach(([k, v]) => f.append(k, v));
          return f;
        })();
  return apiPost(url, fd, opts);
}

/* ===================== Endpoint helpers (tetap) ===================== */

export const searchAll = (params) => apiGet("/api/search" + toQuery(params));
export const listTags = () => apiGet("/api/tags");
export const getAssetTags = (id) => apiGet(`/api/assets/${id}/tags`);
export const addAssetTags = (id, tags) => apiPost(`/api/assets/${id}/tags`, { tags });
export const removeAssetTag = (id, tagId) => apiDelete(`/api/assets/${id}/tags/${tagId}`);

function toQuery(obj) {
  const u = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => u.append(k, x));
    else if (v != null && v !== "") u.set(k, v);
  });
  const s = u.toString();
  return s ? "?" + s : "";
}
