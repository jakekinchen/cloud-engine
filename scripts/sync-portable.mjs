#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.join(process.cwd(), '..'));
const portableDir = path.resolve(path.join(process.cwd()));

function copyFile(srcAbs, dstAbs, { transform } = {}) {
  if (!fs.existsSync(srcAbs)) {
    throw new Error(`Source missing: ${srcAbs}`);
  }
  const src = fs.readFileSync(srcAbs, 'utf8');
  const out = typeof transform === 'function' ? transform(src) : src;
  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  fs.writeFileSync(dstAbs, out, 'utf8');
}

function bytes(n) {
  return `${n.toLocaleString()} bytes`;
}

function statFile(p) {
  const s = fs.statSync(p);
  return { size: s.size, mtime: s.mtimeMs };
}

function main() {
  // Sync engine and shared defaults from /src into the portable package.
  // We avoid overwriting the portable component itself to preserve its tailored API.
  const mappings = [
    {
      src: path.join(repoRoot, 'src/utils/cloud_maker.js'),
      dst: path.join(portableDir, 'cloud_maker.js'),
    },
    {
      src: path.join(repoRoot, 'src/config/cloudDefaults.json'),
      dst: path.join(portableDir, 'cloudDefaults.json'),
    },
    {
      // Copy the repo README into the portable package so npm page stays current
      src: path.join(repoRoot, 'README.md'),
      dst: path.join(portableDir, 'README.md'),
    },
  ];

  const results = [];
  for (const { src, dst } of mappings) {
    copyFile(src, dst);
    const st = statFile(dst);
    results.push({ rel: path.relative(portableDir, dst), size: st.size });
  }

  // Quick verification
  for (const r of results) {
    if (!fs.existsSync(path.join(portableDir, r.rel))) {
      throw new Error(`Verification failed: ${r.rel} not found after sync`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('\n[portable sync] Updated files:');
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(` - ${r.rel} (${bytes(r.size)})`);
  }
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[portable sync] Failed:', err?.message || err);
  process.exit(1);
}


