import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "mobile",
  base: "./",
  plugins: [react(), tailwindcss()],
  define: { __APP_BUILD_ID__: JSON.stringify(process.env.LIFE_BUILD_ID ?? "2026.10.10-mobile-001") },
  build: { outDir: "../dist-mobile", emptyOutDir: true },
});
