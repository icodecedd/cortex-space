import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and ReactDOM always load together — keep in one chunk
          "vendor-react": ["react", "react-dom"],
          // framer-motion is large; isolating it means a React update
          // doesn’t bust the motion cache and vice-versa
          "vendor-motion": ["framer-motion"],
          // xterm + addons are only parsed when a terminal pane mounts
          "vendor-xterm": [
            "@xterm/xterm",
            "@xterm/addon-fit",
            "@xterm/addon-web-links",
          ],
          // dnd-kit is only active during drag-and-drop interactions
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/utilities"],
        },
      },
    },
  },
}));
