import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 拡張機能はchrome-extension://<id>/という独自オリジンで動くため、絶対パス(/assets/...)ではなく
  // 相対パスでアセットを読み込む必要がある
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
