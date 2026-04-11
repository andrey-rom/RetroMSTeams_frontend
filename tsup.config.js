/**
 * @type {import('tsup').Options}
 */
module.exports = {
  bundle: false,
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  minify: false,
  outDir: "dist",
  sourcemap: true,
  splitting: true,
  treeshake: true,
  tsconfig: "tsconfig.node.json",
};
