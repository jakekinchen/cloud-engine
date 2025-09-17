import type { CloudConfig } from './types';

export { default as CloudMaker } from './CloudBackdrop';
export { createCloudEngine } from './cloud_maker';
export { default as cloudDefaults } from './cloudDefaults.json';
export type { CloudMakerProps, CloudConfig } from './types';

export function renderSvg(config: CloudConfig = {}, opts: { phase?: number; morphT?: number; cycleIndex?: number } = {}) {
  const { createCloudEngine } = require('./cloud_maker');
  const engine = createCloudEngine(config);
  return engine.svgAt(opts.phase ?? 0, opts.morphT ?? 0, opts.cycleIndex ?? 0);
}

export const presets = {
  default: {
    width: 1200,
    height: 380,
    layers: 7,
    segments: 450,
    baseColor: '#ffffff',
    seed: 1337,
    blur: 2.2,
    waveForm: 'round' as const,
    noiseSmoothness: 0.45,
    amplitudeJitter: 0,
    amplitudeJitterScale: 0.25,
    backOpacity: 0.12,
    frontOpacity: 0.96,
    opacityCurvePower: 2.4,
    curveType: 'spline' as const,
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
    peakRoundnessPower: 10,
  },
};
