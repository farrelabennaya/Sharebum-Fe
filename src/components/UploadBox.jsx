import { useState } from "react";
import { apiPost } from "../lib/api.js";

export default function UploadBox({ albumId, pageId, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const mime = file.type || (ext === "png" ? "image/png" : "image/jpeg");

      const ps = await apiPost("/api/uploads/presign", {
        album_id: albumId,
        mime,
        ext,
      });

      // pastikan URL presign berupa string
      const putUrl =
        typeof ps.url === "string" ? ps.url : ps.url?.url || ps.url?.href;

      // merge header kalau BE ngasih header tambahan
      const putHeaders = {
        "Content-Type": mime,
        ...(ps.headers || ps.url?.headers || {}),
      };

      // sanity check biar gak kejadian [object Object]
      if (!putUrl || !/^https?:\/\//.test(putUrl)) {
        throw new Error("Presign URL tidak valid: " + JSON.stringify(ps.url));
      }

      const put = await fetch(putUrl, {
        method: "PUT",
        body: file,
        headers: putHeaders,
      });
      if (!put.ok) throw new Error(await put.text());

      await apiPost("/api/uploads/finalize", {
        page_id: pageId,
        key: ps.key,
        width: 0,
        height: 0,
      });
      setMsg("Uploaded ✅");
      onDone?.();
    } catch (e) {
      setMsg(`Gagal: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 border rounded-xl space-y-2">
      <input type="file" accept="image/*" onChange={onPick} disabled={busy} />
      {busy && <p>Uploading…</p>}
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
