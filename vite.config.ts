import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1', port: 9999, strictPort: true,
    fs: { strict: true, allow: ['.'], deny: ['.env', '.env.*', '**/*.{crt,pem,key}', '**/.git/**', '**/.git-local/**', '**/.aws/**', '**/.codex/**', '**/.agents/**', '**/.opencode/**'] },
    headers: { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' },
  },
})
