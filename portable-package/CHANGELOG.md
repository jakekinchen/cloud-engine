## 0.1.6

- Default opacity ramp now eases from the back (~0.12) to the front (~0.96) so additive blending yields a solid leading edge
- Expose `backOpacity`, `frontOpacity`, and `opacityCurvePower` on `CloudMaker` and `createCloudEngine`; explicit `layerOpacities` still win
- Document ramp tuning with before/after visuals and sync README with package assets

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


