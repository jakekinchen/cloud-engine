var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// cloud_maker.js
var cloud_maker_exports = {};
__export(cloud_maker_exports, {
  createCloudEngine: () => createCloudEngine
});
function mulberry32(a) {
  return function() {
    let t = a += 1831565813;
    t = Math.imul(t ^ t >>> 15, 1 | t);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function createCloudEngine(opts = {}) {
  const o = { width: 1200, height: 380, layers: 7, segments: 450, baseAmplitude: 16, baseFrequency: 0.03, baseRandom: 6, layerAmplitudeStep: 2.6, layerFrequencyStep: 4e-3, layerRandomStep: 1.2, layerVerticalSpacing: 16, secondaryWaveFactor: 0.45, baseColor: "#ffffff", layerColors: [], blur: 2.2, seed: 1337, waveForm: "sincos", noiseSmoothness: 0.45, amplitudeJitter: 0, amplitudeJitterScale: 0.25, curveType: "spline", curveTension: 0.85, peakStability: 1, peakNoiseDamping: 1, peakNoisePower: 4, peakHarmonicDamping: 1, useSharedBaseline: true, morphStrength: 0, morphPeriodSec: 18, amplitudeEnvelopeStrength: 0.3, amplitudeEnvelopeCycles: 4, peakRoundness: 0.3, peakRoundnessPower: 2, amplitudeLayerCycleVariance: 0.2, ...opts };
  const center = o.width / 2;
  const rand = mulberry32(o.seed >>> 0 || 1);
  const phases = Array.from({ length: o.layers }, () => rand() * Math.PI * 2);
  const smoothArray = (arr, window2) => {
    if (window2 <= 1) return arr.slice();
    const half = Math.floor(window2 / 2);
    const out = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      let sum = 0, count = 0;
      for (let j = -half; j <= half; j++) {
        const k = Math.min(arr.length - 1, Math.max(0, i + j));
        sum += arr[k];
        count++;
      }
      out[i] = sum / count;
    }
    return out;
  };
  const noiseWindow = Math.max(1, Math.round(o.noiseSmoothness * o.segments * 0.15));
  const ampWindow = Math.max(1, Math.round(Math.max(0.01, o.amplitudeJitterScale) * o.segments));
  const hash32 = (n) => {
    let x = n | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
  const buildFields = (seedA, seedB) => {
    const rA = mulberry32(seedA >>> 0);
    const rB = mulberry32(seedB >>> 0);
    const envelopePhases = Array.from({ length: o.layers }, () => rA() * Math.PI * 2);
    const ampLayerScale = Array.from({ length: o.layers }, () => {
      const v = (rA() - 0.5) * 2;
      const s = 1 + (o.amplitudeLayerCycleVariance || 0) * v;
      return Math.max(0.3, s);
    });
    const rawNoisesA = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rA() - 0.5));
    const rawNoisesB = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rB() - 0.5));
    const noisesA = rawNoisesA.map((layerNoise) => smoothArray(layerNoise, noiseWindow));
    const noisesB = rawNoisesB.map((layerNoise) => smoothArray(layerNoise, noiseWindow));
    const rawAmpModsA = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rA() * 2 - 1));
    const rawAmpModsB = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rB() * 2 - 1));
    const ampModsA = rawAmpModsA.map((arr) => smoothArray(arr, ampWindow));
    const ampModsB = rawAmpModsB.map((arr) => smoothArray(arr, ampWindow));
    const normalize = (arrs) => {
      for (let i = 0; i < arrs.length; i++) {
        const a = arrs[i];
        let maxAbs = 0;
        for (let v of a) maxAbs = Math.max(maxAbs, Math.abs(v));
        const s = maxAbs > 0 ? 1 / maxAbs : 1;
        for (let k = 0; k < a.length; k++) a[k] = a[k] * s;
      }
    };
    normalize(ampModsA);
    normalize(ampModsB);
    return { noisesA, noisesB, ampModsA, ampModsB, envelopePhases, ampLayerScale };
  };
  let cachedCycle = -1;
  let cachedFields = buildFields(o.seed >>> 0 || 1, (o.seed >>> 0 || 1) ^ 2654435769);
  const ensureFields = (cycleIndex) => {
    if (cycleIndex === cachedCycle) return;
    const base = o.seed >>> 0 || 1;
    const seedA = base ^ hash32(cycleIndex + 1013904223);
    const seedB = base ^ hash32(cycleIndex + 1 + 1013904223);
    cachedFields = buildFields(seedA, seedB);
    cachedCycle = cycleIndex;
  };
  const colorAt = (i) => o.layerColors && o.layerColors.length ? o.layerColors[Math.min(i, o.layerColors.length - 1)] : mixToWhite(o.baseColor, Math.min(0.08 * i, 0.6));
  const wrapIndex = (idx, len) => {
    let i = idx % len;
    if (i < 0) i += len;
    return i;
  };
  const sampleWrapped = (arr, x) => {
    const len = arr.length;
    const i0 = Math.floor(x);
    const i1 = i0 + 1;
    const t = x - i0;
    const v0 = arr[wrapIndex(i0, len)];
    const v1 = arr[wrapIndex(i1, len)];
    return v0 * (1 - t) + v1 * t;
  };
  const sampleMorph = (arrA, arrB, x, m) => (1 - m) * sampleWrapped(arrA, x) + m * sampleWrapped(arrB, x);
  const params = (i) => ({ baseLine: o.height - i * o.layerVerticalSpacing, amp: o.baseAmplitude + i * o.layerAmplitudeStep, freq: o.baseFrequency + i * o.layerFrequencyStep, rndF: o.baseRandom + i * o.layerRandomStep, phi: phases[i], noise: cachedFields.noisesA[i] });
  const pathFor = (i, phase, morphT = 0) => {
    const p = params(i);
    const fillBase = o.useSharedBaseline ? o.height : p.baseLine;
    const pts = [];
    for (let k = 0; k <= o.segments; k++) {
      const x = k / o.segments * o.width;
      const dist = Math.abs(x - center);
      const baseArg = p.freq * (dist - phase) + p.phi;
      let wave = 0;
      if (o.waveForm === "sin") {
        wave = Math.sin(baseArg);
      } else if (o.waveForm === "cos") {
        wave = Math.cos(baseArg);
      } else {
        const base = Math.sin(baseArg);
        const harmonic = Math.sin(2 * baseArg + p.phi * 0.3);
        const peakProximity2 = Math.pow(Math.abs(Math.cos(baseArg)), Math.max(1, o.peakNoisePower));
        const harmonicScale = 1 - o.peakHarmonicDamping * (1 - peakProximity2);
        wave = base + o.secondaryWaveFactor * harmonicScale * harmonic;
      }
      const peakProximity = Math.pow(Math.abs(Math.cos(baseArg)), Math.max(1, o.peakNoisePower));
      const noiseScale = 1 - o.peakNoiseDamping * (1 - peakProximity);
      const radialIdx = (dist - phase) * (o.segments / Math.max(1, o.width));
      const m = Math.max(0, Math.min(1, o.morphStrength)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * morphT));
      const stableNoise = sampleMorph(cachedFields.noisesA[i], cachedFields.noisesB[i], radialIdx, m);
      const stableAmpMod = sampleMorph(cachedFields.ampModsA[i], cachedFields.ampModsB[i], radialIdx, m);
      const mixedNoise = ((1 - o.peakStability) * (p.noise[k] || 0) + o.peakStability * stableNoise) * noiseScale;
      const mixedAmpMod = ((1 - o.peakStability) * (cachedFields.ampModsA[i][k] || 0) + o.peakStability * stableAmpMod) * noiseScale;
      const envStrength = o.amplitudeEnvelopeStrength * (0.9 + 0.2 * (i * 16807 % 11) / 10);
      const env2 = 1 + envStrength * Math.sin(2 * Math.PI * o.amplitudeEnvelopeCycles * (dist - phase) / Math.max(1, o.width) + (cachedFields.envelopePhases[i] + i * 0.37));
      const baseAmp = p.amp * (cachedFields.ampLayerScale[i] || 1) * env2;
      const ampMult = 1 + o.amplitudeJitter * mixedAmpMod;
      const w = baseAmp * ampMult * wave + mixedNoise * p.rndF;
      pts.push({ x, y: p.baseLine - w });
    }
    if (o.curveType === "linear") {
      let d2 = `M 0 ${rnd(fillBase)}`;
      d2 += ` L ${rnd(pts[0].x)} ${rnd(pts[0].y)}`;
      for (let idx = 1; idx < pts.length; idx++) {
        const pt = pts[idx];
        d2 += ` L ${rnd(pt.x)} ${rnd(pt.y)}`;
      }
      return d2 + ` L ${o.width} ${rnd(fillBase)} Z`;
    }
    if (o.peakRoundness > 0) {
      const power = Math.max(1, o.peakRoundnessPower || 1);
      const rounded = new Array(pts.length);
      for (let k = 0; k < pts.length; k++) {
        const x = pts[k].x;
        const dist = Math.abs(x - center);
        const baseArg = p.freq * (dist - phase) + p.phi;
        const peakWeight = Math.pow(1 - Math.abs(Math.cos(baseArg)), power);
        const w = Math.max(0, Math.min(1, o.peakRoundness * peakWeight));
        const yPrev = pts[Math.max(0, k - 1)].y;
        const yCurr = pts[k].y;
        const yNext = pts[Math.min(pts.length - 1, k + 1)].y;
        const neighborhoodAvg = (yPrev + yCurr + yNext) / 3;
        const yRounded = yCurr * (1 - w) + neighborhoodAvg * w;
        rounded[k] = { x, y: yRounded };
      }
      for (let k = 0; k < pts.length; k++) pts[k] = rounded[k];
    }
    const t = Math.max(0, Math.min(1, o.curveTension));
    let d = `M 0 ${rnd(fillBase)} L ${rnd(pts[0].x)} ${rnd(pts[0].y)}`;
    for (let s = 0; s < pts.length - 1; s++) {
      const p0 = pts[s - 1] || pts[s];
      const p1 = pts[s];
      const p2 = pts[s + 1];
      const p3 = pts[s + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6 * t;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * t;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * t;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * t;
      d += ` C ${rnd(cp1x)} ${rnd(cp1y)} ${rnd(cp2x)} ${rnd(cp2y)} ${rnd(p2.x)} ${rnd(p2.y)}`;
    }
    return d + ` L ${o.width} ${rnd(fillBase)} Z`;
  };
  const pathsAt = (phase = 0, morphT = 0, cycleIndex = 0) => {
    ensureFields(Math.max(0, Math.floor(cycleIndex)));
    return Array.from({ length: o.layers }, (_, i) => ({ d: pathFor(i, phase, morphT), fill: colorAt(i), opacity: +(1 - i * 0.12).toFixed(2) }));
  };
  const svgAt = (phase = 0, morphT = 0, cycleIndex = 0) => {
    const paths = pathsAt(phase, morphT, cycleIndex).map((p) => `<path d="${p.d}" fill="${p.fill}" fill-opacity="${p.opacity}"/>`).join("\n      ");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.width} ${o.height}">
      <defs>
        <filter id="cloud-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="${o.blur}"/>
        </filter>
      </defs>
      <g filter="url(#cloud-blur)">
        ${paths}
      </g>
    </svg>`;
  };
  return { pathsAt, svgAt, width: o.width, height: o.height, blur: o.blur, config: o };
}
var rnd, mixToWhite;
var init_cloud_maker = __esm({
  "cloud_maker.js"() {
    "use strict";
    rnd = (n) => n;
    mixToWhite = (hex, t) => {
      let h = hex.replace("#", "");
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const n = parseInt(h, 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
      const m = (v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0");
      return `#${m(r)}${m(g)}${m(b)}`;
    };
  }
});

// CloudBackdrop.tsx
init_cloud_maker();
import { useEffect, useMemo, useRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var CloudMaker = ({
  width = 1200,
  height = 380,
  layers = 7,
  segments = 450,
  baseColor = "#ffffff",
  layerColors = [],
  layerOpacities,
  speed = 60,
  seed = 1337,
  blur = 2.2,
  waveForm = "sincos",
  noiseSmoothness = 0.45,
  amplitudeJitter = 0,
  amplitudeJitterScale = 0.25,
  additiveBlending = false,
  curveType = "spline",
  curveTension = 0.85,
  peakStability = 1,
  peakNoiseDamping = 1,
  peakNoisePower = 4,
  peakHarmonicDamping = 1,
  useSharedBaseline = true,
  morphStrength = 0,
  morphPeriodSec = 18,
  amplitudeEnvelopeStrength = 0.7,
  amplitudeEnvelopeCycles = 10,
  peakRoundness = 0.8,
  peakRoundnessPower = 10,
  animate = true,
  phase = 0,
  morphT = 0,
  cycleIndex = 0,
  className,
  style,
  fit = "stretch",
  background = false
}) => {
  const engine = useMemo(
    () => createCloudEngine({ width, height, layers, segments, baseColor, layerColors, layerOpacities, seed, blur, waveForm, noiseSmoothness, amplitudeJitter, amplitudeJitterScale, curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, peakRoundness, peakRoundnessPower }),
    [width, height, layers, segments, baseColor, layerColors, layerOpacities, seed, blur, waveForm, noiseSmoothness, amplitudeJitter, amplitudeJitterScale, curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, peakRoundness, peakRoundnessPower]
  );
  const initial = useMemo(() => engine.pathsAt(phase, morphT, cycleIndex), [engine, phase, morphT, cycleIndex]);
  const refs = useRef([]);
  useEffect(() => {
    if (!animate) return;
    if (typeof window === "undefined") return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t) => {
      const elapsedSec = (t - t0) / 1e3;
      const phase2 = speed * elapsedSec;
      const period = Math.max(1e-4, engine.config.morphPeriodSec);
      const morphT2 = elapsedSec / period % 1;
      const cycleIndex2 = Math.floor(elapsedSec / period);
      engine.pathsAt(phase2, morphT2, cycleIndex2).forEach((p, i) => refs.current[i]?.setAttribute("d", p.d));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, speed, animate]);
  const preserve = fit === "stretch" ? "none" : fit === "slice" ? "xMidYMid slice" : "xMidYMid meet";
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      viewBox: `0 0 ${engine.width} ${engine.height}`,
      preserveAspectRatio: preserve,
      width: "100%",
      height: "100%",
      className,
      style,
      suppressHydrationWarning: true,
      "aria-hidden": true,
      children: [
        typeof background === "string" && /* @__PURE__ */ jsx("rect", { x: 0, y: 0, width: "100%", height: "100%", fill: background }),
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("filter", { id: "cloud-blur", x: "-20%", y: "-20%", width: "140%", height: "140%", children: /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: engine.blur }) }) }),
        /* @__PURE__ */ jsx("g", { filter: "url(#cloud-blur)", style: { mixBlendMode: additiveBlending ? "screen" : "normal" }, children: initial.map((p, i) => /* @__PURE__ */ jsx(
          "path",
          {
            ref: (el) => {
              if (el) refs.current[i] = el;
            },
            d: p.d,
            fill: p.fill,
            fillOpacity: layerOpacities?.[i] ?? (additiveBlending ? Math.max(0.06, (i + 1) / (engine.config.layers || initial.length) * 0.7) : p.opacity)
          },
          i
        )) })
      ]
    }
  );
};
var CloudBackdrop_default = CloudMaker;

// index.ts
init_cloud_maker();
function renderSvg(config = {}, opts = {}) {
  const { createCloudEngine: createCloudEngine2 } = (init_cloud_maker(), __toCommonJS(cloud_maker_exports));
  const engine = createCloudEngine2(config);
  return engine.svgAt(opts.phase ?? 0, opts.morphT ?? 0, opts.cycleIndex ?? 0);
}
var presets = {
  default: {
    width: 1200,
    height: 380,
    layers: 7,
    segments: 450,
    baseColor: "#ffffff",
    seed: 1337,
    blur: 2.2,
    waveForm: "sincos",
    noiseSmoothness: 0.45,
    amplitudeJitter: 0,
    amplitudeJitterScale: 0.25,
    curveType: "spline",
    curveTension: 0.85,
    peakStability: 1,
    peakNoiseDamping: 1,
    peakNoisePower: 4,
    peakHarmonicDamping: 1,
    useSharedBaseline: true,
    morphStrength: 0,
    morphPeriodSec: 18,
    amplitudeEnvelopeStrength: 0.7,
    amplitudeEnvelopeCycles: 10,
    peakRoundness: 0.8,
    peakRoundnessPower: 10
  }
};
export {
  CloudBackdrop_default as CloudMaker,
  createCloudEngine,
  presets,
  renderSvg
};
