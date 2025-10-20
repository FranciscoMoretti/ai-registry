import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["react", "react-dom"],
});
