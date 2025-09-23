import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,           // expose ke LAN
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Laravel di laptop
        changeOrigin: true,
      }
    }
  }
})


// vite.config.ts
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// const TUNNEL_HOST = process.env.VITE_TUNNEL_HOST || '2a1c80277eed.ngrok-free.app'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: true,          // listen di 0.0.0.0 (bisa diakses dari LAN/ngrok)
//     port: 5173,
//     strictPort: true,
//     // hostname saja, tanpa protocol
//     // kalau domain sering ganti, bisa pakai: allowedHosts: true
//     allowedHosts: [TUNNEL_HOST],
//     // Biar HMR websocketnya nyambung lewat HTTPS ngrok
//     hmr: {
//       host: TUNNEL_HOST,
//       protocol: 'wss',
//       clientPort: 443,
//     },
//     // (opsional, bantu absolute URL asset saat di-proxy)
//     origin: `https://${TUNNEL_HOST}`,
//     proxy: {
//       '/api': {
//         target: 'http://127.0.0.1:8000', // Laravel lokal
//         changeOrigin: true,
//       }
//     }
//   }
// })
