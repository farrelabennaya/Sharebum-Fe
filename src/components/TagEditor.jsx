import React from "react";
import { getAssetTags, addAssetTags, removeAssetTag } from "../lib/api";

export default function TagEditor({ assetId, onUpdated }) {
  const [tags, setTags] = React.useState([]); // {id,name}
  const [inp, setInp] = React.useState("");

  React.useEffect(() => {
    getAssetTags(assetId)
      .then(setTags)
      .catch(() => {});
  }, [assetId]);

  async function onAdd(e) {
    e.preventDefault();
    const arr = inp
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.length === 0) return;
    const res = await addAssetTags(assetId, arr);
    setTags(res);
    onUpdated?.(res);
    setInp("");
  }
  async function onRemove(id) {
    await removeAssetTag(assetId, id);
    setTags(tags.filter((t) => t.id !== id));
    setTags(res);
    onUpdated?.(res);
  }

  return (
    <div className="text-xs text-white">
      <div className="flex gap-1 flex-wrap mb-1">
        {tags.map((t) => (
          <span
            key={t.id}
            className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur border border-white/20"
          >
            #{t.name}
            <button
              className="ml-1 opacity-80 hover:opacity-100"
              onClick={() => onRemove(t.id)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={onAdd} className="flex gap-1">
        <input
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          placeholder="tambah tag… (coma untuk banyak)"
          className="flex-1 px-2 py-1 rounded bg-white/20 placeholder:text-white/60"
        />
        <button className="px-2 py-1 rounded bg-white/20">Add</button>
      </form>
    </div>
  );
}
