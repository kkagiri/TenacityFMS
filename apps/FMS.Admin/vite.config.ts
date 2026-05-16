import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5181,
    strictPort: false,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:2008",
        changeOrigin: true,
      },
      "/sales-api": {
        target: "http://localhost:7010",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/sales-api/, ""),
      },
    },
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, "../fms.frontend/assests/fontawesome"),
      ],
    },
  },
  preview: {
    port: 4174,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
