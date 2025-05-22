// webviews/react-webview/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: {
      include: [/tari-extension-common/, /node_modules/],
    },
  },
  server: {
    origin: "http://localhost:5173", // Explicitly set server origin
    cors: {
      origin: "*", // Allow all webview origins (or specify your webview origin more precisely)
    },
  },
});
