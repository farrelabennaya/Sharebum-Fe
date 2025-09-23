import { useCallback, useRef, useState } from 'react'
import { apiPost } from '../lib/api.js'

export default function UploadDropzone({ albumId, pageId, onDone }) {
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState(0)     // 0-100 overall
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [count, setCount] = useState({ i: 0, n: 0 }) // indikator “keberapa dari berapa”
  const inpRef = useRef(null)

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f && f.type?.startsWith('image/'))
    if (!files.length) return

    setBusy(true); setMsg(null); setProgress(0); setCount({ i: 0, n: files.length })

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCount({ i, n: files.length })

        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const mime = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg')

        // 1) minta presign
        const ps = await apiPost('/api/uploads/presign', { album_id: albumId, mime, ext })

        // 2) PUT ke R2 pakai XHR biar dapat progress
        const putUrl = typeof ps.url === 'string' ? ps.url : (ps.url?.url || ps.url?.href)
        const headers = { 'Content-Type': mime, ...(ps.headers || ps.url?.headers || {}) }
        if (!putUrl?.startsWith('http')) throw new Error('Presign URL tidak valid')

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', putUrl, true)
          Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))

          xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return
            // progress gabungan: (file selesai sebelumnya + progress file saat ini) / total
            const cur = e.loaded / e.total
            const overall = ((i + cur) / files.length) * 100
            setProgress(Math.max(1, Math.round(overall)))
          }
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(xhr.responseText || 'Upload gagal')
          xhr.onerror = () => reject('Network error saat upload')
          xhr.send(file)
        })

        // 3) finalize
        await apiPost('/api/uploads/finalize', { page_id: pageId, key: ps.key, width: 0, height: 0 })
      }

      setProgress(100)
      setCount({ i: files.length, n: files.length })
      setMsg(`Uploaded ${files.length} foto`)
      onDone?.()
    } catch (e) {
      setMsg(`Gagal: ${e.message || e}`)
    } finally {
      setBusy(false)
      setTimeout(() => { setProgress(0); setCount({ i: 0, n: 0 }) }, 1200)
      // reset input supaya bisa pilih file yang sama lagi kalau perlu
      if (inpRef.current) inpRef.current.value = ''
    }
  }, [albumId, pageId, onDone])

  return (
    <div
      onDragOver={(e)=>{e.preventDefault(); setDrag(true)}}
      onDragLeave={()=> setDrag(false)}
      onDrop={(e)=>{e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files)}}
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition
      ${drag ? 'border-black bg-black/5' : 'border-zinc-300 hover:border-zinc-400'}`}
    >
      <input
        ref={inpRef}
        type="file"
        accept="image/*"
        multiple                          // ⬅️ ini penting
        className="hidden"
        onChange={(e)=>handleFiles(e.target.files)}
        disabled={busy}
      />
      <div className="space-y-2">
        <p className="font-medium">Drag & drop beberapa file ke sini</p>
        <p className="text-sm text-zinc-500">atau</p>
        <button
          onClick={()=>inpRef.current?.click()}
          disabled={busy}
          className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-60"
        >
          Pilih Foto
        </button>

        {progress > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>Mengunggah…</span>
              {count.n > 0 && <span>{Math.min(count.i + 1, count.n)}/{count.n}</span>}
            </div>
            <div className="h-2 w-full bg-zinc-200 rounded">
              <div className="h-2 bg-black rounded transition-[width] duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </div>
    </div>
  )
}
