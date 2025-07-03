import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist-scripts",
    emptyOutDir: true,

    lib: {
      entry: resolve(__dirname, "scripts/generate-schema.ts"),
      name: "GenerateSchema",
      formats: ["cjs"],
      fileName: (format) => `generate-schema.${format}`,
    },
    rollupOptions: {
      external: ["path", "fs", "ts-json-schema-generator"],
    },
    target: "node22",
    ssr: true,
    minify: false,
  },
});
