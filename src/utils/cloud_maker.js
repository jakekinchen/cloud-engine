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
const computeOpacityRamp = (count) => {
  const n = Math.max(1, count | 0);
  if (n === 1) return [roundOpacity(0.85)];
  const front = clamp01(0.706 + 2.05 / n - 3.864 / (n * n));
  const back = clamp01(0.0375 + 3.5175 / n - 4.41 / (n * n));
  const start = Math.max(front, back);
  const end = back;
  const curve = 0.7 + Math.min(1.4, n / 7);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const eased = 1 - Math.pow(t, curve); // keep front layers lighter when count grows
    const opacity = end + (start - end) * eased;
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
  const defaultOpacityRamp = computeOpacityRamp(o.layers);
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

  // morphT is in [0,1) representing position in morph cycle
  const pathFor = (i, phase, morphT = 0) => {
    const p = params(i);
    const fillBase = o.useSharedBaseline ? o.height : p.baseLine; // shared closure baseline to prevent staggered bottoms
    // Collect points across the curve
    const pts = [];
    for (let k = 0; k <= o.segments; k++) {
      const x = (k / o.segments) * o.width;
      const dist = Math.abs(x - center);
      const baseArg = p.freq * (dist - phase) + p.phi;
      let wave = 0;
      if (o.waveForm === 'sin') {
        wave = Math.sin(baseArg);
      } else if (o.waveForm === 'cos') {
        wave = Math.cos(baseArg);
      } else if (o.waveForm === 'round') {
        const c = Math.cos(baseArg);
        wave = c / (0.4 + 0.4 * Math.abs(c));
      } else {
        const base = Math.sin(baseArg);
        const harmonic = Math.sin(2 * baseArg + p.phi * 0.3);
        const peakProximity = Math.pow(Math.abs(Math.cos(baseArg)), Math.max(1, o.peakNoisePower));
        const harmonicScale = 1 - o.peakHarmonicDamping * (1 - peakProximity);
        wave = base + o.secondaryWaveFactor * harmonicScale * harmonic;
      }
      // Compute damping so peaks keep still: suppress high-frequency terms near extrema
      const peakProximity = Math.pow(Math.abs(Math.cos(baseArg)), Math.max(1, o.peakNoisePower)); // 1 at zero-crossing, 0 at peak
      const noiseScale = 1 - o.peakNoiseDamping * (1 - peakProximity);
      // Co-moving samples reduce temporal jiggle at peaks
      const radialIdx = (dist - phase) * (o.segments / Math.max(1, o.width));
      const m = Math.max(0, Math.min(1, o.morphStrength)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * morphT)); // cosine window 0..1..0
      const stableNoise = sampleMorph(cachedFields.noisesA[i], cachedFields.noisesB[i], radialIdx, m);
      const stableAmpMod = sampleMorph(cachedFields.ampModsA[i], cachedFields.ampModsB[i], radialIdx, m);
      const mixedNoise = ((1 - o.peakStability) * (p.noise[k] || 0) + o.peakStability * stableNoise) * noiseScale;
      const mixedAmpMod = ((1 - o.peakStability) * (cachedFields.ampModsA[i][k] || 0) + o.peakStability * stableAmpMod) * noiseScale;
      // Creation-time amplitude envelope (co-moving), frozen after creation
      // Add slight per-layer envelope strength variation so the top layer isn't locked
      const envStrength = o.amplitudeEnvelopeStrength * (0.9 + 0.2 * ((i * 16807) % 11) / 10);
      const env2 = 1 + envStrength * Math.sin(
        2 * Math.PI * o.amplitudeEnvelopeCycles * (dist - phase) / Math.max(1, o.width) + (cachedFields.envelopePhases[i] + i * 0.37)
      );
      const baseAmp = p.amp * (cachedFields.ampLayerScale[i] || 1) * env2;
      const ampMult = 1 + o.amplitudeJitter * mixedAmpMod;
      const w = (baseAmp * ampMult) * wave + mixedNoise * p.rndF;
      pts.push({ x, y: p.baseLine - w });
    }

    if (o.curveType === 'linear') {
      let d = `M 0 ${rnd(fillBase)}`;
      d += ` L ${rnd(pts[0].x)} ${rnd(pts[0].y)}`;
      for (let idx = 1; idx < pts.length; idx++) {
        const pt = pts[idx];
        d += ` L ${rnd(pt.x)} ${rnd(pt.y)}`;
      }
      return d + ` L ${o.width} ${rnd(fillBase)} Z`;
    }

    // Optional local peak rounding (y-only pre-smoothing) before spline
    if (o.peakRoundness > 0) {
      const power = Math.max(1, o.peakRoundnessPower || 1);
      const rounded = new Array(pts.length);
      for (let k = 0; k < pts.length; k++) {
        const x = pts[k].x;
        const dist = Math.abs(x - center);
        const baseArg = p.freq * (dist - phase) + p.phi;
        const peakWeight = Math.pow(1 - Math.abs(Math.cos(baseArg)), power); // 1 at peaks, 0 at zero-crossings
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

    // Catmull-Rom to Bezier spline for smooth top edge
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
    return Array.from({ length: o.layers }, (_, i) => ({
      d: pathFor(i, phase, morphT),
      fill: colorAt(i),
      opacity: opacityAt(i)
    }));
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

  return { pathsAt, svgAt, width: o.width, height: o.height, blur: o.blur, config: o };
}
