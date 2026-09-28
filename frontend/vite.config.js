import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs on :5000; proxying keeps the browser on one origin.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: { '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:5000', changeOrigin: true } }
    },
    preview: { port: 3000 },
    // "build" (not Vite's default "dist") so hosts expecting that folder, like Vercel, find it.
    build: { outDir: 'build', chunkSizeWarningLimit: 1200 }
});
