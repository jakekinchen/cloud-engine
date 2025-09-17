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
  const o = {
    width: 1200,
    height: 380,
    layers: 7,
    segments: 450,
    baseAmplitude: 16,
    baseFrequency: 0.03,
    baseRandom: 6,
    layerAmplitudeStep: 2.6,
    layerFrequencyStep: 4e-3,
    layerRandomStep: 1.2,
    layerVerticalSpacing: 16,
    secondaryWaveFactor: 0.45,
    baseColor: "#ffffff",
    layerColors: [],
    layerOpacities: void 0,
    blur: 2.2,
    seed: 1337,
    backOpacity: 0.12,
    frontOpacity: 0.96,
    opacityCurvePower: 2.4,
    // New physicality controls
    waveForm: "round",
    // 'sin' | 'cos' | 'sincos' | 'round'
    noiseSmoothness: 0.45,
    // 0..1 moving-average smoothing on noise
    amplitudeJitter: 0,
    // 0..1 multiplicative jitter on amplitude
    amplitudeJitterScale: 0.25,
    // 0..1 fraction of segments for jitter correlation length
    curveType: "spline",
    // 'linear' | 'spline'
    curveTension: 0.85,
    // 0..1, higher means smoother curves
    peakStability: 1,
    // 0..1, 1 = fully co-moving noise/jitter (no peak jiggle)
    peakNoiseDamping: 1,
    // 0..1, reduce noise & amp jitter near wave peaks
    peakNoisePower: 4,
    // >=1, shaping power for damping falloff
    peakHarmonicDamping: 1,
    // 0..1, reduce secondary harmonic near peaks
    useSharedBaseline: true,
    // if true, all layers close to the same baseline to avoid checkerboard overlaps
    // Creation-time variation only
    morphStrength: 0,
    // 0..1, set 0 to freeze shape post creation
    morphPeriodSec: 18,
    // seconds for a full morph loop
    amplitudeEnvelopeStrength: 0.3,
    // 0..1 envelope modulation at creation
    amplitudeEnvelopeCycles: 4,
    // number of envelope cycles across width
    peakRoundness: 0.3,
    // 0..1 extra local smoothing at crests/troughs
    peakRoundnessPower: 2,
    // >=1 tightness of peak-local smoothing
    amplitudeLayerCycleVariance: 0.2,
    // 0..1 per-layer amplitude scale variance per cycle
    // Motion path orientation (degrees). 0 = horizontal (default). +tilts upward, -tilts downward.
    motionAngleDeg: 0,
    // Phase sampling rotation (degrees). 0 = standard sampling, rotates phase coordinate system
    periodicAngleDeg: 0,
    ...opts
  };
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
  const defaultOpacityRamp = computeOpacityRamp(o.layers, {
    backOpacity: o.backOpacity,
    frontOpacity: o.frontOpacity,
    opacityCurvePower: o.opacityCurvePower
  });
  o.opacityRamp = defaultOpacityRamp;
  const opacityAt = (i) => {
    if (Array.isArray(o.layerOpacities) && o.layerOpacities.length) {
      const idx = Math.min(i, o.layerOpacities.length - 1);
      const candidate = o.layerOpacities[idx];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return roundOpacity(candidate);
      }
    }
    return defaultOpacityRamp[Math.min(i, defaultOpacityRamp.length - 1)];
  };
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
  const sampleMorph = (arrA, arrB, x, m) => {
    return (1 - m) * sampleWrapped(arrA, x) + m * sampleWrapped(arrB, x);
  };
  const params = (i) => ({
    // Top-line baseline controls the vertical placement of the wave crest for this layer
    baseLine: o.height - i * o.layerVerticalSpacing,
    amp: o.baseAmplitude + i * o.layerAmplitudeStep,
    freq: o.baseFrequency + i * o.layerFrequencyStep,
    rndF: o.baseRandom + i * o.layerRandomStep,
    phi: phases[i],
    // Use one of the precomputed noise fields as the static per-layer field
    noise: cachedFields.noisesA[i]
  });
  const pathFor = (i, phase, morphT = 0) => {
    const p = params(i);
    const fillBase = o.useSharedBaseline ? o.height : p.baseLine;
    const pts = [];
    const motionTheta = (o.motionAngleDeg || 0) * Math.PI / 180;
    const motionCosT = Math.cos(motionTheta);
    const motionSinT = Math.sin(motionTheta);
    const motionInvCos = 1 / Math.max(1e-3, Math.abs(motionCosT));
    const periodicTheta = (o.periodicAngleDeg || 0) * Math.PI / 180;
    const periodicCosT = Math.cos(periodicTheta);
    const periodicSinT = Math.sin(periodicTheta);
    const periodicInvCos = 1 / Math.max(1e-3, Math.abs(periodicCosT));
    const tMotionOfX = (x) => Math.abs(x - center) * motionInvCos;
    const tPeriodicOf = (x, y) => Math.abs(x - center) * periodicCosT + (y - p.baseLine) * periodicSinT;
    const tPeriodicNormOf = (x, y) => (tPeriodicOf(x, y) - phase) * periodicInvCos;
    const m = Math.max(0, Math.min(1, o.morphStrength)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * morphT));
    const envBase = cachedFields.envelopePhases[i] + i * 0.37;
    const segPerW = o.segments / Math.max(1, o.width);
    const waveAt = (arg) => {
      if (o.waveForm === "sin") return Math.sin(arg);
      if (o.waveForm === "cos") return Math.cos(arg);
      if (o.waveForm === "round") {
        const c = Math.cos(arg);
        return c / (0.4 + 0.4 * Math.abs(c));
      }
      const base = Math.sin(arg);
      const harmonic = Math.sin(2 * arg + p.phi * 0.3);
      const peakP = Math.pow(Math.abs(Math.cos(arg)), Math.max(1, o.peakNoisePower));
      const harmScale = 1 - o.peakHarmonicDamping * (1 - peakP);
      return base + o.secondaryWaveFactor * harmScale * harmonic;
    };
    for (let k = 0; k <= o.segments; k++) {
      const x = k / o.segments * o.width;
      const tMotion = tMotionOfX(x);
      const yBase = p.baseLine + tMotion * motionSinT;
      let sn = tPeriodicNormOf(x, yBase);
      let arg = p.freq * sn + p.phi;
      for (let iter = 0; iter < 3; iter++) {
        const peakP = Math.pow(Math.abs(Math.cos(arg)), Math.max(1, o.peakNoisePower));
        const noiseScale = 1 - o.peakNoiseDamping * (1 - peakP);
        const ridx = sn * segPerW;
        const stableNoise = sampleMorph(cachedFields.noisesA[i], cachedFields.noisesB[i], ridx, m);
        const stableAmpMod = sampleMorph(cachedFields.ampModsA[i], cachedFields.ampModsB[i], ridx, m);
        const mixedNoise = ((1 - o.peakStability) * (p.noise[k] || 0) + o.peakStability * stableNoise) * noiseScale;
        const mixedAmpMod = ((1 - o.peakStability) * (cachedFields.ampModsA[i][k] || 0) + o.peakStability * stableAmpMod) * noiseScale;
        const envStrength = o.amplitudeEnvelopeStrength * (0.9 + 0.2 * (i * 16807 % 11) / 10);
        const env = 1 + envStrength * Math.sin(2 * Math.PI * o.amplitudeEnvelopeCycles * sn / Math.max(1, o.width) + envBase);
        const baseAmp = p.amp * (cachedFields.ampLayerScale[i] || 1) * env;
        const ampMult = 1 + o.amplitudeJitter * mixedAmpMod;
        const wave = waveAt(arg);
        const w = baseAmp * ampMult * wave + mixedNoise * p.rndF;
        const yNew = yBase - w;
        sn = tPeriodicNormOf(x, yNew);
        arg = p.freq * sn + p.phi;
        if (iter === 2) {
          pts.push({ x, y: yNew });
        }
      }
    }
    if (o.peakRoundness > 0) {
      const power = Math.max(1, o.peakRoundnessPower || 1);
      const rounded = new Array(pts.length);
      for (let k = 0; k < pts.length; k++) {
        const x = pts[k].x, y = pts[k].y;
        const sn = tPeriodicNormOf(x, y);
        const arg = p.freq * sn + p.phi;
        const peakW = Math.pow(1 - Math.abs(Math.cos(arg)), power);
        const w = Math.max(0, Math.min(1, o.peakRoundness * peakW));
        const yPrev = pts[Math.max(0, k - 1)].y, yNext = pts[Math.min(pts.length - 1, k + 1)].y;
        const avg = (yPrev + y + yNext) / 3;
        rounded[k] = { x, y: y * (1 - w) + avg * w };
      }
      for (let k = 0; k < pts.length; k++) pts[k] = rounded[k];
    }
    const tSmooth = Math.max(0, Math.min(1, o.curveTension));
    let topPath = `M ${rnd(pts[0].x)} ${rnd(pts[0].y)}`;
    let fillPath = `M 0 ${rnd(fillBase)} L ${rnd(pts[0].x)} ${rnd(pts[0].y)}`;
    for (let s = 0; s < pts.length - 1; s++) {
      const p0 = pts[s - 1] || pts[s];
      const p1 = pts[s];
      const p2 = pts[s + 1];
      const p3 = pts[s + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tSmooth;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tSmooth;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tSmooth;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tSmooth;
      const seg = ` C ${rnd(cp1x)} ${rnd(cp1y)} ${rnd(cp2x)} ${rnd(cp2y)} ${rnd(p2.x)} ${rnd(p2.y)}`;
      topPath += seg;
      fillPath += seg;
    }
    return {
      fillPath: fillPath + ` L ${o.width} ${rnd(fillBase)} Z`,
      topPath
    };
  };
  const pathsAt = (phase = 0, morphT = 0, cycleIndex = 0) => {
    ensureFields(Math.max(0, Math.floor(cycleIndex)));
    return Array.from({ length: o.layers }, (_, i) => {
      const pathData = pathFor(i, phase, morphT);
      return {
        d: pathData.fillPath,
        topPath: pathData.topPath,
        fill: colorAt(i),
        opacity: opacityAt(i)
      };
    });
  };
  const svgAt = (phase = 0) => {
    const paths = pathsAt(phase).map((p) => `<path d="${p.d}" fill="${p.fill}" fill-opacity="${p.opacity}"/>`).join("\n      ");
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
  return { pathsAt, svgAt, width: o.width, height: o.height, blur: o.blur, opacityRamp: defaultOpacityRamp, config: o };
}
var rnd, mixToWhite, clamp01, roundOpacity, computeOpacityRamp;
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
    clamp01 = (v) => Math.max(0, Math.min(1, v));
    roundOpacity = (v) => Math.round(clamp01(v) * 1e3) / 1e3;
    computeOpacityRamp = (count, opts = {}) => {
      const n = Math.max(1, count | 0);
      const front = clamp01(Number.isFinite(opts.frontOpacity) ? opts.frontOpacity : 0.96);
      const back = clamp01(Number.isFinite(opts.backOpacity) ? opts.backOpacity : 0.12);
      const powerRaw = Number.isFinite(opts.opacityCurvePower) ? opts.opacityCurvePower : 2.4;
      const power = Math.max(1e-3, powerRaw);
      if (n === 1) {
        return [roundOpacity(front)];
      }
      const delta = front - back;
      const result = new Array(n);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 1 : i / (n - 1);
        const eased = Math.pow(t, power);
        const opacity = back + delta * eased;
        result[i] = roundOpacity(opacity);
      }
      return result;
    };
  }
});

// CloudBackdrop.tsx
init_cloud_maker();
import { useEffect, useMemo, useRef, useId } from "react";

// cloudDefaults.json
var cloudDefaults_default = {
  width: 800,
  height: 458,
  layers: 5,
  segments: 450,
  baseColor: "#ffffff",
  speed: 34,
  seed: 1337,
  blur: 0,
  waveForm: "round",
  noiseSmoothness: 0.45,
  amplitudeJitter: 0,
  amplitudeJitterScale: 0.25,
  backOpacity: 0.12,
  frontOpacity: 0.96,
  opacityCurvePower: 2.4,
  additiveBlending: false,
  curveType: "spline",
  curveTension: 0.85,
  peakStability: 1,
  peakNoiseDamping: 1,
  peakNoisePower: 4,
  peakHarmonicDamping: 1,
  useSharedBaseline: true,
  morphStrength: 0,
  morphPeriodSec: 18,
  amplitudeEnvelopeStrength: 0.36,
  amplitudeEnvelopeCycles: 2,
  staticPeaks: true,
  sunsetMode: true,
  sunsetPeriodSec: 12,
  paletteIndex: 4,
  hueShift: 0,
  saturation: 1,
  lightness: 0.02,
  contrast: 0.04,
  altHueDelta: -30,
  altSatScale: 1.41,
  motionAngleDeg: 0,
  periodicAngleDeg: 0,
  glowEnabled: false,
  glowIntensity: 1,
  glowHueShift: 180
};

// CloudBackdrop.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var clamp012 = (v) => Math.max(0, Math.min(1, v));
var hexToHsl = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const r = n >> 16 & 255;
  const g = n >> 8 & 255;
  const b = n & 255;
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  let hue = 0;
  const lightness = (max + min) / 2;
  let saturation = 0;
  if (max !== min) {
    const d = max - min;
    saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr:
        hue = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        hue = (bb - rr) / d + 2;
        break;
      default:
        hue = (rr - gg) / d + 4;
        break;
    }
    hue /= 6;
  }
  return { h: hue * 360, s: saturation, l: lightness };
};
var hslToHex = ({ h, s, l }) => {
  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const hh = (h % 360 + 360) % 360 / 360;
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, hh + 1 / 3);
    g = hueToRgb(p, q, hh);
    b = hueToRgb(p, q, hh - 1 / 3);
  }
  const toHex = (x) => Math.round(clamp012(x) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
var shiftHue = (hex, delta) => {
  const hsl = hexToHsl(hex);
  return hslToHex({ h: hsl.h + delta, s: hsl.s, l: hsl.l });
};
var sanitizeId = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "");
var partialDefaults = cloudDefaults_default;
var CloudMaker = ({
  width = cloudDefaults_default.width,
  height = cloudDefaults_default.height,
  layers = cloudDefaults_default.layers,
  segments = cloudDefaults_default.segments,
  baseColor = cloudDefaults_default.baseColor,
  layerColors = [],
  layerOpacities,
  speed = cloudDefaults_default.speed,
  seed = cloudDefaults_default.seed,
  blur = cloudDefaults_default.blur,
  waveForm = cloudDefaults_default.waveForm,
  noiseSmoothness = cloudDefaults_default.noiseSmoothness,
  amplitudeJitter = cloudDefaults_default.amplitudeJitter,
  amplitudeJitterScale = cloudDefaults_default.amplitudeJitterScale,
  additiveBlending = cloudDefaults_default.additiveBlending,
  backOpacity = cloudDefaults_default.backOpacity ?? 0.12,
  frontOpacity = cloudDefaults_default.frontOpacity ?? 0.96,
  opacityCurvePower = cloudDefaults_default.opacityCurvePower ?? 2.4,
  curveType = cloudDefaults_default.curveType,
  curveTension = cloudDefaults_default.curveTension,
  peakStability = cloudDefaults_default.peakStability,
  peakNoiseDamping = cloudDefaults_default.peakNoiseDamping,
  peakNoisePower = cloudDefaults_default.peakNoisePower,
  peakHarmonicDamping = cloudDefaults_default.peakHarmonicDamping,
  useSharedBaseline = cloudDefaults_default.useSharedBaseline,
  baseAmplitude = partialDefaults.baseAmplitude,
  baseFrequency = partialDefaults.baseFrequency,
  layerFrequencyStep = partialDefaults.layerFrequencyStep,
  secondaryWaveFactor = partialDefaults.secondaryWaveFactor,
  layerVerticalSpacing = partialDefaults.layerVerticalSpacing,
  morphStrength = cloudDefaults_default.morphStrength,
  morphPeriodSec = cloudDefaults_default.morphPeriodSec,
  amplitudeEnvelopeStrength = cloudDefaults_default.amplitudeEnvelopeStrength,
  amplitudeEnvelopeCycles = cloudDefaults_default.amplitudeEnvelopeCycles,
  seamlessLoop = true,
  animate = true,
  phase = 0,
  morphT = 0,
  cycleIndex = 0,
  className,
  style,
  fit = "stretch",
  background = false,
  motionAngleDeg = cloudDefaults_default.motionAngleDeg ?? 0,
  periodicAngleDeg = cloudDefaults_default.periodicAngleDeg ?? 0,
  paused = false,
  glowEnabled = cloudDefaults_default.glowEnabled ?? false,
  glowIntensity = cloudDefaults_default.glowIntensity ?? 1,
  glowHueShift = cloudDefaults_default.glowHueShift ?? 0
}) => {
  const glow = {
    enabled: !!glowEnabled,
    intensity: Math.max(0, glowIntensity),
    hueShift: glowHueShift ?? 0
  };
  const blurFilterBaseId = useId();
  const glowFilterBaseId = useId();
  const blurFilterId = useMemo(() => `cloud-blur-${sanitizeId(blurFilterBaseId)}`, [blurFilterBaseId]);
  const glowFilterId = useMemo(() => `cloud-glow-${sanitizeId(glowFilterBaseId)}`, [glowFilterBaseId]);
  const engine = useMemo(
    () => createCloudEngine({
      width,
      height,
      layers,
      segments,
      baseColor,
      layerColors,
      layerOpacities,
      seed,
      blur,
      waveForm,
      noiseSmoothness,
      amplitudeJitter,
      amplitudeJitterScale,
      backOpacity,
      frontOpacity,
      opacityCurvePower,
      curveType,
      curveTension,
      peakStability,
      peakNoiseDamping,
      peakNoisePower,
      peakHarmonicDamping,
      useSharedBaseline,
      morphStrength,
      morphPeriodSec,
      amplitudeEnvelopeStrength,
      amplitudeEnvelopeCycles,
      motionAngleDeg,
      periodicAngleDeg,
      ...baseAmplitude !== void 0 ? { baseAmplitude } : {},
      ...baseFrequency !== void 0 ? { baseFrequency } : {},
      ...layerFrequencyStep !== void 0 ? { layerFrequencyStep } : {},
      ...secondaryWaveFactor !== void 0 ? { secondaryWaveFactor } : {},
      ...layerVerticalSpacing !== void 0 ? { layerVerticalSpacing } : {}
    }),
    [
      width,
      height,
      layers,
      segments,
      baseColor,
      layerColors,
      layerOpacities,
      seed,
      blur,
      waveForm,
      noiseSmoothness,
      amplitudeJitter,
      amplitudeJitterScale,
      backOpacity,
      frontOpacity,
      opacityCurvePower,
      curveType,
      curveTension,
      peakStability,
      peakNoiseDamping,
      peakNoisePower,
      peakHarmonicDamping,
      useSharedBaseline,
      morphStrength,
      morphPeriodSec,
      amplitudeEnvelopeStrength,
      amplitudeEnvelopeCycles,
      motionAngleDeg,
      periodicAngleDeg,
      baseAmplitude,
      baseFrequency,
      layerFrequencyStep,
      secondaryWaveFactor,
      layerVerticalSpacing
    ]
  );
  const initial = useMemo(() => engine.pathsAt(phase, morphT, cycleIndex), [engine, phase, morphT, cycleIndex]);
  const refs = useRef([]);
  const glowRefs = useRef([]);
  useEffect(() => {
    if (!glow.enabled) {
      glowRefs.current = [];
    }
  }, [glow.enabled]);
  const shouldAnimate = animate && !paused;
  useEffect(() => {
    if (!shouldAnimate) return;
    if (typeof window === "undefined") return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t) => {
      const elapsedSec = (t - t0) / 1e3;
      const phase2 = speed * elapsedSec;
      const period = Math.max(1e-4, engine.config.morphPeriodSec);
      const nextMorphT = elapsedSec / period % 1;
      const cycleIndex2 = seamlessLoop ? 0 : Math.floor(elapsedSec / period);
      engine.pathsAt(phase2, nextMorphT, cycleIndex2).forEach((p, i) => {
        const fillPath = p.d;
        refs.current[i]?.setAttribute("d", fillPath);
        if (glow.enabled) {
          glowRefs.current[i]?.setAttribute("d", fillPath);
        }
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [engine, speed, phase, seamlessLoop, glow.enabled, shouldAnimate]);
  const preserve = fit === "stretch" ? "none" : fit === "slice" ? "xMidYMid slice" : "xMidYMid meet";
  const glowGroupOpacity = glow.enabled ? clamp012(0.45 * glow.intensity) : 0;
  const glowBlur = Math.max(engine.blur * 1.4, 12 * glow.intensity);
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
        /* @__PURE__ */ jsxs("defs", { children: [
          /* @__PURE__ */ jsx(
            "filter",
            {
              id: blurFilterId,
              filterUnits: "userSpaceOnUse",
              x: -engine.width * 0.2,
              y: -engine.height * 0.2,
              width: engine.width * 1.4,
              height: engine.height * 1.4,
              children: /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: engine.blur })
            }
          ),
          glow.enabled && /* @__PURE__ */ jsxs(
            "filter",
            {
              id: glowFilterId,
              filterUnits: "userSpaceOnUse",
              x: -engine.width * 0.6,
              y: -engine.height * 0.8,
              width: engine.width * 2.2,
              height: engine.height * 2.6,
              children: [
                /* @__PURE__ */ jsx("feGaussianBlur", { in: "SourceGraphic", stdDeviation: glowBlur, result: "blur" }),
                /* @__PURE__ */ jsx("feComponentTransfer", { in: "blur", result: "softGlow", children: /* @__PURE__ */ jsx("feFuncA", { type: "linear", slope: glowGroupOpacity }) }),
                /* @__PURE__ */ jsx("feMerge", { children: /* @__PURE__ */ jsx("feMergeNode", { in: "softGlow" }) })
              ]
            }
          )
        ] }),
        glow.enabled && /* @__PURE__ */ jsx(
          "g",
          {
            filter: `url(#${glowFilterId})`,
            style: { mixBlendMode: additiveBlending ? "screen" : "lighten" },
            children: initial.map((p, i) => /* @__PURE__ */ jsx(
              "path",
              {
                ref: (el) => {
                  if (el) glowRefs.current[i] = el;
                },
                d: p.d,
                fill: shiftHue(p.fill ?? baseColor, glow.hueShift),
                fillOpacity: clamp012((layerOpacities?.[i] ?? p.opacity ?? 1) * glow.intensity)
              },
              `glow-${i}`
            ))
          }
        ),
        /* @__PURE__ */ jsx("g", { filter: `url(#${blurFilterId})`, style: { mixBlendMode: additiveBlending ? "screen" : "normal" }, children: initial.map((p, i) => /* @__PURE__ */ jsx(
          "path",
          {
            ref: (el) => {
              if (el) refs.current[i] = el;
            },
            d: p.d,
            fill: p.fill,
            fillOpacity: layerOpacities?.[i] ?? p.opacity
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
    waveForm: "round",
    noiseSmoothness: 0.45,
    amplitudeJitter: 0,
    amplitudeJitterScale: 0.25,
    backOpacity: 0.12,
    frontOpacity: 0.96,
    opacityCurvePower: 2.4,
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
  cloudDefaults_default as cloudDefaults,
  createCloudEngine,
  presets,
  renderSvg
};
