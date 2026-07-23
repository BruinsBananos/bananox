import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  // Relative base so playTD.html at site root loads ./td-assets and ./art
  base: "./",
  publicDir: "public",
  server: { port: 5173, open: true },
  build: {
    outDir: "dist",
    assetsDir: "td-assets",
    sourcemap: true,
  },
});
