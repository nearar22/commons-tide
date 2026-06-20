import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// CommonsTide frontend. Dev on 5192 to sit alongside the sibling projects.
// Build output goes to out/ for Cloudflare Pages.
export default defineConfig({
  plugins: [react()],
  server: { port: 5192, host: true },
  preview: { port: 5192 },
  build: { outDir: 'out', emptyOutDir: true },
});
