import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

const isLibrary = process.env.BUILD_LIB === "true";

export default defineConfig({
  plugins: [react(), tailwindcss(), isLibrary && dts({ tsconfigPath: "tsconfig.lib.json" })].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: isLibrary
    ? {
        lib: {
          entry: path.resolve(__dirname, "src/index.ts"),
          name: "TariExtensionQueryBuilderLibrary",
          fileName: (format) => `tari-extension-query-builder.${format}.js`,
        },
        rollupOptions: {
          external: ["react", "react-dom", "react-flow-renderer", "react/jsx-runtime"],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              "react-flow-renderer": "ReactFlowRenderer",
              "react/jsx-runtime": "ReactJsxRuntime",
            },
          },
        },
      }
    : undefined,
});
