import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  server: {
    host: true,
  },
  // Le module WASM de Havok ne doit pas etre pre-bundle par esbuild.
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
