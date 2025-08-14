export type CloudDefaults = {
  width: number;
  height: number;
  layers: number;
  segments: number;
  baseColor: string;
  speed: number;
  seed: number;
  blur: number;
  waveForm: 'sin' | 'cos' | 'sincos';
  noiseSmoothness: number;
  amplitudeJitter: number;
  amplitudeJitterScale: number;
  additiveBlending: boolean;
  curveType: 'linear' | 'spline';
  curveTension: number;
  peakStability: number;
  peakNoiseDamping: number;
  peakNoisePower: number;
  peakHarmonicDamping: number;
  useSharedBaseline: boolean;
  morphStrength: number;
  morphPeriodSec: number;
  amplitudeEnvelopeStrength: number;
  amplitudeEnvelopeCycles: number;
  peakRoundness: number;
  peakRoundnessPower: number;
  staticPeaks: boolean;
  sunsetMode: boolean;
  sunsetPeriodSec: number;
  paletteIndex: number;
  hueShift: number;
  saturation: number;
  lightness: number;
  contrast: number;
  altHueDelta: number;
  altSatScale: number;
  defaultPaletteColors?: Record<string, string[]>;
};

const STORAGE_KEY = 'cloud-defaults-v1';

export const defaultCloudDefaults: CloudDefaults = {
  width: 1200,
  height: 380,
  layers: 7,
  segments: 450,
  baseColor: '#ffffff',
  speed: 60,
  seed: 1337,
  blur: 2.2,
  waveForm: 'sincos',
  noiseSmoothness: 0.45,
  amplitudeJitter: 0,
  amplitudeJitterScale: 0.25,
  additiveBlending: false,
  curveType: 'spline',
  curveTension: 0.85,
  peakStability: 1.0,
  peakNoiseDamping: 1.0,
  peakNoisePower: 4,
  peakHarmonicDamping: 1.0,
  useSharedBaseline: true,
  morphStrength: 0,
  morphPeriodSec: 18,
  amplitudeEnvelopeStrength: 0.7,
  amplitudeEnvelopeCycles: 10,
  peakRoundness: 0.8,
  peakRoundnessPower: 10,
  staticPeaks: true,
  sunsetMode: false,
  sunsetPeriodSec: 12,
  paletteIndex: 0,
  hueShift: 0,
  saturation: 1,
  lightness: 0,
  contrast: 0,
  altHueDelta: 0,
  altSatScale: 1,
};

export function loadCloudDefaults(): CloudDefaults {
  if (typeof window === 'undefined') return defaultCloudDefaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCloudDefaults;
    const parsed = JSON.parse(raw);
    return normalizeDefaults({ ...defaultCloudDefaults, ...parsed } as CloudDefaults);
  } catch {
    return defaultCloudDefaults;
  }
}

export function saveCloudDefaults(next: Partial<CloudDefaults>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadCloudDefaults();
    const merged = { ...current, ...next } as CloudDefaults;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

// Network helpers: JSON file is the source of truth
export async function fetchCloudDefaults(): Promise<CloudDefaults> {
  try {
    const res = await fetch('/api/cloud-defaults', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed');
    const data = (await res.json()) as CloudDefaults;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return normalizeDefaults({ ...defaultCloudDefaults, ...data });
  } catch {
    return loadCloudDefaults();
  }
}

export async function persistCloudDefaults(next: Partial<CloudDefaults>): Promise<CloudDefaults | null> {
  try {
    const res = await fetch('/api/cloud-defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!res.ok) throw new Error('Failed');
    const data = (await res.json()) as CloudDefaults;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return normalizeDefaults(data);
  } catch {
    return null;
  }
}

function clamp(n: number, a: number, b: number) {
  return n < a ? a : n > b ? b : n;
}

function normalizeDefaults(d: CloudDefaults): CloudDefaults {
  // Ensure palette-related adjustments are within safe/neutralizable ranges
  const hueShift = Math.round(clamp(d.hueShift ?? 0, -180, 180));
  const saturation = Math.round(clamp(d.saturation ?? 1, 0, 2) * 100) / 100;
  const lightness = Math.round(clamp(d.lightness ?? 0, -0.5, 0.5) * 100) / 100;
  const contrast = Math.round(clamp(d.contrast ?? 0, -1, 1) * 100) / 100;
  const altHueDelta = Math.round(clamp(d.altHueDelta ?? 0, -90, 90));
  const altSatScale = Math.round(clamp(d.altSatScale ?? 1, 0.5, 1.5) * 100) / 100;

  return {
    ...d,
    hueShift,
    saturation,
    lightness,
    contrast,
    altHueDelta,
    altSatScale,
  };
}


