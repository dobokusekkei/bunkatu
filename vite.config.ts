import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // ★ 追加：ビルド時のパスを「相対パス」にして真っ白エラー(404)を防ぐ
    base: './',

    // Reactと最新のTailwind CSS(v4)のプラグインを読み込む
    plugins: [react(), tailwindcss()],

    // パスのエイリアス設定（@でルートディレクトリを指す設定）
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // 開発サーバーの設定（AI Studio等の環境維持用）
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
