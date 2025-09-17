/**
 * Cloud maker: center-outward, layered, "dreamy" SVG clouds.
 * - Deterministic via seed
 * - Outward motion by increasing `phase`
 * - Subtle blur, fading opacity per layer
 * - Works standalone (string SVG) or as an engine for TSX animation
 */

const rnd = n => n; // avoid quantization that can cause visual jitters
const mixToWhite = (hex, t) => {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = v => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0');
  return `#${m(r)}${m(g)}${m(b)}`;
};
const clamp01 = v => Math.max(0, Math.min(1, v));
const roundOpacity = v => Math.round(clamp01(v) * 1000) / 1000;
const computeOpacityRamp = (count, opts = {}) => {
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
function mulberry32(a) { return function () { let t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), 1 | t); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function createCloudEngine(opts = {}) {
  const o = {
    width: 1200, height: 380, layers: 7, segments: 450,
    baseAmplitude: 16, baseFrequency: 0.03, baseRandom: 6,
    layerAmplitudeStep: 2.6, layerFrequencyStep: 0.004, layerRandomStep: 1.2,
    layerVerticalSpacing: 16, secondaryWaveFactor: 0.45,
    baseColor: '#ffffff', layerColors: [], layerOpacities: undefined, blur: 2.2, seed: 1337,
    backOpacity: 0.12, frontOpacity: 0.96, opacityCurvePower: 2.4,
    // New physicality controls
    waveForm: 'round',             // 'sin' | 'cos' | 'sincos' | 'round'
    noiseSmoothness: 0.45,         // 0..1 moving-average smoothing on noise
    amplitudeJitter: 0,            // 0..1 multiplicative jitter on amplitude
    amplitudeJitterScale: 0.25,    // 0..1 fraction of segments for jitter correlation length
    curveType: 'spline',           // 'linear' | 'spline'
    curveTension: 0.85,            // 0..1, higher means smoother curves
    peakStability: 1,              // 0..1, 1 = fully co-moving noise/jitter (no peak jiggle)
    peakNoiseDamping: 1,           // 0..1, reduce noise & amp jitter near wave peaks
    peakNoisePower: 4,             // >=1, shaping power for damping falloff
    peakHarmonicDamping: 1,        // 0..1, reduce secondary harmonic near peaks
    useSharedBaseline: true,       // if true, all layers close to the same baseline to avoid checkerboard overlaps
    // Creation-time variation only
    morphStrength: 0,              // 0..1, set 0 to freeze shape post creation
    morphPeriodSec: 18,            // seconds for a full morph loop
    amplitudeEnvelopeStrength: 0.3,// 0..1 envelope modulation at creation
    amplitudeEnvelopeCycles: 4,    // number of envelope cycles across width
    peakRoundness: 0.3,            // 0..1 extra local smoothing at crests/troughs
    peakRoundnessPower: 2,         // >=1 tightness of peak-local smoothing
    amplitudeLayerCycleVariance: 0.2, // 0..1 per-layer amplitude scale variance per cycle
    // Motion path orientation (degrees). 0 = horizontal (default). +tilts upward, -tilts downward.
    motionAngleDeg: 0,
    // Phase sampling rotation (degrees). 0 = standard sampling, rotates phase coordinate system
    periodicAngleDeg: 0,
    ...opts
  };

  const center = o.width / 2;
  const rand = mulberry32((o.seed >>> 0) || 1);
  const phases = Array.from({ length: o.layers }, () => rand() * Math.PI * 2);
  // Optionally smooth the noise along x to reduce jaggedness
  const smoothArray = (arr, window) => {
    if (window <= 1) return arr.slice();
    const half = Math.floor(window / 2);
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

  // Per-cycle field cache so each loop uses a fresh pair of fields, but we recompute only once per cycle
  const hash32 = (n) => {
    let x = n | 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return x >>> 0;
  };
  const buildFields = (seedA, seedB) => {
    const rA = mulberry32(seedA >>> 0);
    const rB = mulberry32(seedB >>> 0);
    const envelopePhases = Array.from({ length: o.layers }, () => rA() * Math.PI * 2);
    const ampLayerScale = Array.from({ length: o.layers }, () => {
      const v = (rA() - 0.5) * 2; // [-1,1]
      const s = 1 + (o.amplitudeLayerCycleVariance || 0) * v;
      return Math.max(0.3, s); // keep reasonable lower bound
    });
    const rawNoisesA = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rA() - 0.5));
    const rawNoisesB = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rB() - 0.5));
    const noisesA = rawNoisesA.map(layerNoise => smoothArray(layerNoise, noiseWindow));
    const noisesB = rawNoisesB.map(layerNoise => smoothArray(layerNoise, noiseWindow));
    const rawAmpModsA = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rA() * 2 - 1));
    const rawAmpModsB = Array.from({ length: o.layers }, () => Array.from({ length: o.segments + 1 }, () => rB() * 2 - 1));
    const ampModsA = rawAmpModsA.map(arr => smoothArray(arr, ampWindow));
    const ampModsB = rawAmpModsB.map(arr => smoothArray(arr, ampWindow));
    const normalize = (arrs) => {
      for (let i = 0; i < arrs.length; i++) {
        const a = arrs[i];
        let maxAbs = 0;
        for (let v of a) maxAbs = Math.max(maxAbs, Math.abs(v));
        const s = maxAbs > 0 ? 1 / maxAbs : 1;
        for (let k = 0; k < a.length; k++) a[k] = a[k] * s;
      }
    };
    normalize(ampModsA); normalize(ampModsB);
    return { noisesA, noisesB, ampModsA, ampModsB, envelopePhases, ampLayerScale };
  };

  let cachedCycle = -1;
  let cachedFields = buildFields(((o.seed >>> 0) || 1), (((o.seed >>> 0) || 1) ^ 0x9e3779b9));
  const ensureFields = (cycleIndex) => {
    if (cycleIndex === cachedCycle) return;
    const base = (o.seed >>> 0) || 1;
    const seedA = base ^ hash32(cycleIndex + 1013904223);
    const seedB = base ^ hash32(cycleIndex + 1 + 1013904223);
    cachedFields = buildFields(seedA, seedB);
    cachedCycle = cycleIndex;
  };
  const colorAt = i => (o.layerColors && o.layerColors.length ? o.layerColors[Math.min(i, o.layerColors.length - 1)] : mixToWhite(o.baseColor, Math.min(0.08 * i, 0.6)));
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
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return roundOpacity(candidate);
      }
    }
    return defaultOpacityRamp[Math.min(i, defaultOpacityRamp.length - 1)];
  };

  // Helpers to sample arrays with wrapping + linear interpolation
  const wrapIndex = (idx, len) => {
    let i = idx % len; if (i < 0) i += len; return i;
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

  const params = i => ({
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

    // Motion axis basis (for baseline slanting)
    const motionTheta = ((o.motionAngleDeg || 0) * Math.PI) / 180;
    const motionCosT = Math.cos(motionTheta);
    const motionSinT = Math.sin(motionTheta);
    const motionInvCos = 1 / Math.max(1e-3, Math.abs(motionCosT));

    // Periodic axis basis (for phase sampling rotation)
    const periodicTheta = ((o.periodicAngleDeg || 0) * Math.PI) / 180;
    const periodicCosT = Math.cos(periodicTheta);
    const periodicSinT = Math.sin(periodicTheta);
    const periodicInvCos = 1 / Math.max(1e-3, Math.abs(periodicCosT));

    // Distance along motion axis (for baseline positioning)
    const tMotionOfX = (x) => Math.abs(x - center) * motionInvCos;

    // Distance along periodic axis (for phase sampling)
    const tPeriodicOf = (x, y) => Math.abs(x - center) * periodicCosT + (y - p.baseLine) * periodicSinT;
    const tPeriodicNormOf = (x, y) => (tPeriodicOf(x, y) - phase) * periodicInvCos;

    // Helpers
    const m = Math.max(0, Math.min(1, o.morphStrength)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * morphT));
    const envBase = cachedFields.envelopePhases[i] + i * 0.37;
    const segPerW = o.segments / Math.max(1, o.width);

    const waveAt = (arg) => {
      if (o.waveForm === 'sin') return Math.sin(arg);
      if (o.waveForm === 'cos') return Math.cos(arg);
      if (o.waveForm === 'round') { const c = Math.cos(arg); return c / (0.4 + 0.4 * Math.abs(c)); }
      const base = Math.sin(arg);
      const harmonic = Math.sin(2 * arg + p.phi * 0.3);
      const peakP = Math.pow(Math.abs(Math.cos(arg)), Math.max(1, o.peakNoisePower));
      const harmScale = 1 - o.peakHarmonicDamping * (1 - peakP);
      return base + o.secondaryWaveFactor * harmScale * harmonic;
    };

    for (let k = 0; k <= o.segments; k++) {
      const x = (k / o.segments) * o.width;

      // Motion axis for baseline positioning
      const tMotion = tMotionOfX(x);
      const yBase = p.baseLine + tMotion * motionSinT;

      // Periodic axis for phase sampling (rotated coordinate system)
      let sn = tPeriodicNormOf(x, yBase);
      let arg = p.freq * sn + p.phi;

      // Iterative refinement to account for y dependence
      for (let iter = 0; iter < 3; iter++) {
        const peakP = Math.pow(Math.abs(Math.cos(arg)), Math.max(1, o.peakNoisePower));
        const noiseScale = 1 - o.peakNoiseDamping * (1 - peakP);

        const ridx = sn * segPerW;
        const stableNoise = sampleMorph(cachedFields.noisesA[i], cachedFields.noisesB[i], ridx, m);
        const stableAmpMod = sampleMorph(cachedFields.ampModsA[i], cachedFields.ampModsB[i], ridx, m);

        const mixedNoise = ((1 - o.peakStability) * (p.noise[k] || 0) + o.peakStability * stableNoise) * noiseScale;
        const mixedAmpMod = ((1 - o.peakStability) * (cachedFields.ampModsA[i][k] || 0) + o.peakStability * stableAmpMod) * noiseScale;

        const envStrength = o.amplitudeEnvelopeStrength * (0.9 + 0.2 * ((i * 16807) % 11) / 10);
        const env = 1 + envStrength * Math.sin(2 * Math.PI * o.amplitudeEnvelopeCycles * sn / Math.max(1, o.width) + envBase);

        const baseAmp = p.amp * (cachedFields.ampLayerScale[i] || 1) * env;
        const ampMult = 1 + o.amplitudeJitter * mixedAmpMod;
        const wave = waveAt(arg);
        const w = baseAmp * ampMult * wave + mixedNoise * p.rndF;

        // Update y and recompute phase coordinate
        const yNew = yBase - w;
        sn = tPeriodicNormOf(x, yNew);
        arg = p.freq * sn + p.phi;

        if (iter === 2) {
          pts.push({ x, y: yNew });
        }
      }
    }

    // Optional peak-local rounding (uses periodic axis coordinates)
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

    // Spline
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
      topPath,
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
        opacity: opacityAt(i),
      };
    });
  };

  const svgAt = (phase = 0) => {
    const paths = pathsAt(phase).map(p => `<path d="${p.d}" fill="${p.fill}" fill-opacity="${p.opacity}"/>`).join('\n      ');
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
