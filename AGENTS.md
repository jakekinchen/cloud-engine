## AGENTS: Cloud Engine Packaging — Single Source of Truth

This document records the architecture decision and migration plan to make the portable package the single source of truth (SOT) for the cloud engine, and how the app should consume it for the best developer workflow and demo experience.

### Goal

- **Single place to edit the engine** (and its defaults)
- **Zero duplication** in the repo
- **Fast local iteration** for the app and **easy packaging/publishing** for reuse

### Decision

- The SOT lives in `portable-package/`.
  - Engine code and exports (e.g., `createCloudEngine`, `CloudMaker`)
  - Defaults JSON (portable package owns the canonical defaults)
- The app should import only from the package name `cloud-engine`.
- Remove the sync-based duplication model (`scripts/sync-portable.mjs`).

### Migration Plan (Step-by-step)

1) Make `portable-package` canonical
- Ensure `portable-package` exports everything the app needs today:
  - `createCloudEngine`
  - `CloudMaker` React component
  - `cloudDefaults` (JSON)
  - Types (`CloudConfig`, `CloudMakerProps`)

2) Remove duplicates in `src/`
- Delete `src/utils/cloud_maker.js` (engine duplicate)
- Delete `src/config/cloudDefaults.json` if app no longer needs a separate copy
- Delete the local `src/components/CloudBackdrop.tsx` if the app will use `CloudMaker` from the package, or change it to a thin wrapper that re-exports `CloudMaker`

3) Drop the sync script
- Remove `scripts/sync-portable.mjs`
- Update `portable-package/package.json` scripts:
  - "build": `tsup index.ts --format esm,cjs --dts --clean`
  - Remove `preversion` and `prepack` that referenced the sync script
  - Keep `prepublishOnly: npm run build`

4) Switch app imports to the package
- Replace all local engine/component imports with:
  - `import { CloudMaker } from 'cloud-engine'`
  - `import { createCloudEngine } from 'cloud-engine'`

5) Pick dev workflow (Recommended: Transpile package source)
- Option B (recommended for fastest iteration): App transpiles package source
  - In `next.config.ts` add:
    ```ts
    const nextConfig = {
      transpilePackages: ['cloud-engine'],
    };
    export default nextConfig;
    ```
  - In `tsconfig.json`, map the package name to the package source (not `dist`):
    ```json
    {
      "compilerOptions": {
        "paths": {
          "cloud-engine": ["./portable-package"],
          "cloud-engine/*": ["./portable-package/*"]
        }
      }
    }
    ```
  - Pros: no separate watch build; edits in `portable-package/` recompile instantly via Next
  - Cons: Next compiles package code (fine for monorepo setups)

- Option A (alternative): Import from built `dist`
  - Keep `tsconfig.json` mapping to `./portable-package/dist`
  - Run a parallel watcher in the package during dev:
    ```bash
    cd portable-package && pnpm tsup index.ts --format esm,cjs --dts --watch --clean
    ```
  - Pros: app only consumes already-built ESM/CJS
  - Cons: requires a second watch process

6) Clean up toggle paths in the app
- If you previously had a UI toggle between local vs package engines, remove it or keep it only for debugging; the app should rely on `cloud-engine` as the single import path

7) Verify
- `pnpm dev` (or `npm run dev`) to confirm the app runs exclusively via `cloud-engine`
- Ensure no imports reference `src/utils/cloud_maker.js`

8) Publishing workflow
- From `portable-package/`:
  ```bash
  npm version [patch|minor|major]
  npm publish --access public
  ```
  - `prepublishOnly` builds the package
  - Update consumers as needed (app already resolves local monorepo path; published versions are for external use)

### Repo After Migration

- `portable-package/` — SOT
  - `index.ts` (exports), `cloud_maker.js` (engine), `cloudDefaults.json`, `dist/` (built), `package.json`
- App imports only `cloud-engine`
- No `src/utils/cloud_maker.js`
- No `scripts/sync-portable.mjs`

### Guidelines

- **Do not edit engine code outside `portable-package/`**
- Keep the package API thoughtfully versioned; surface only stable props
- App-specific preferences live in app state/UI; engine defaults stay in the package

### FAQ

- Q: Why prefer transpiling package source in dev?
  - A: It yields the fastest feedback loop (no extra watch/build). Next compiles the package like any workspace library.

- Q: When to use dist imports?
  - A: If you want the app dev server to avoid compiling package source (e.g., strict separation), use Option A with a watch build.


