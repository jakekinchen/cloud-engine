## 0.1.4

- Fix package entry points: set `module` and `exports.import` to `dist/index.js` so ESM consumers resolve correctly
- Ensure build artifacts are generated via `tsup` on prepack

## 0.1.3

- Internal adjustments and build pipeline tweaks (unpublished)

## 0.1.2

- Add seamlessLoop prop (default true) for continuous morphing without reseed seams
- Add background prop (default false) to render a solid SVG background when desired
- Sync script to pull the latest engine from /src on preversion/prepack
- Build with tsup to ESM+CJS and generate types



