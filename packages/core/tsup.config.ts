import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/og-image-png.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ["@resvg/resvg-js"],
});
