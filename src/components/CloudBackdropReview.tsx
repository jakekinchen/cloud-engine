"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CloudMaker } from 'cloud-engine';
import Icon from './icons';
import SettingsPanel from './settings/SettingsPanel';
import type { SectionSchema, ControlSchema } from './settings/types';
import { getThemePalette, interpolateThemePalettes, paletteNames } from '@/utils/palettes';
import { defaultCloudDefaults, fetchCloudDefaults, persistCloudDefaults } from '@/config/cloudDefaults';

type Num = number;
const clamp = (n: Num, a: Num, b: Num) => (n < a ? a : n > b ? b : n);

function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      setW(entry.contentRect.width);
    });
    obs.observe(ref.current);
    return () => { obs.disconnect(); };
  }, []);
  return [ref, w];
}

const Row: React.FC<{ label: string; right?: React.ReactNode; children?: React.ReactNode; icon?: React.ReactNode }> = ({ label, right, children, icon }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: 12,
      alignItems: 'center',
      marginBottom: 10
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        opacity: 0.9,
        fontFamily: 'monospace'
      }}
    >
      {icon}
      <span>{label}</span>
    </span>
    <div style={{ gridColumn: '2 / 3', width: '100%' }}>{children}</div>
    <div style={{ gridColumn: '3 / 4', justifySelf: 'end', display: 'inline-flex', alignItems: 'center' }}>{right}</div>
  </div>
);

const Range: React.FC<{
  min: number; max: number; step?: number; value: number;
  onChange: (v: number) => void; numberBox?: boolean;
}> = ({ min, max, step = 1, value, onChange, numberBox = true }) => (
  <div style={{ display: 'grid', gridTemplateColumns: numberBox ? '1fr 88px' : '1fr', gap: 10, width: '100%' }}>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => { onChange(clamp(+e.target.value, min, max)); }}
      style={{ width: '100%', height: 28, accentColor: '#9cc2ff' }}
    />
    {numberBox && (
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={e => { onChange(clamp(+e.target.value, min, max)); }}
        style={{ width: 88, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'inherit', padding: '6px 8px', borderRadius: 8 }}
      />
    )}
  </div>
);

export type Init = Partial<{
  width: number; height: number; layers: number; segments: number; baseColor: string;
  speed: number; seed: number; blur: number;
  waveForm: 'sin' | 'cos' | 'sincos' | 'round';
  noiseSmoothness: number;
  amplitudeJitter: number;
  amplitudeJitterScale: number;
  curveType: 'linear' | 'spline';
  curveTension: number;
  peakStability: number;
  peakNoiseDamping: number;
  peakNoisePower: number;
  peakHarmonicDamping: number;
  staticPeaks: boolean;
  useSharedBaseline: boolean;
  morphStrength: number;
  morphPeriodSec: number;
  amplitudeEnvelopeStrength: number;
  amplitudeEnvelopeCycles: number;
  sunsetMode: boolean;
  sunsetPeriodSec: number;
}>;

const panelStyle: React.CSSProperties = {
  position: 'relative',
  background: 'rgba(12,16,28,.6)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  padding: 16,
  color: '#fff',
  width: 420,
  maxHeight: 640,
  overflowY: 'auto',
  fontFamily: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial`
};

const btn: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid rgba(255,255,255,.25)',
  background: 'rgba(255,255,255,.06)',
  color: 'inherit',
  borderRadius: 8,
  cursor: 'pointer'
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => { onChange(e.target.checked); }}
      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
    />
    <span
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        background: checked ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.14)',
        position: 'relative',
        transition: 'background .2s ease, box-shadow .2s ease',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,.45), inset 0 0 0 1px rgba(0,0,0,.35)'
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: checked ? 24 : 3, width: 20, height: 20,
          borderRadius: '50%', background: checked ? '#0b1530' : '#ffffff',
          boxShadow: checked ? '0 0 10px rgba(120,180,255,.8)' : '0 1px 2px rgba(0,0,0,.35)',
          transition: 'left .2s ease, background .2s ease, box-shadow .2s ease'
        }}
      />
    </span>
  </label>
);

const CloudBackdropReview: React.FC<{ className?: string; initial?: Init }> = ({ className, initial }) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const [hostRef, widthPx] = useElementWidth<HTMLDivElement>();
  // Use static defaults for initial render to avoid SSR/CSR mismatch
  const defaults = defaultCloudDefaults;
  const width = Math.max(600, Math.round(widthPx || (initial?.width ?? defaults.width ?? 1200)));

  const [height, setHeight] = useState(initial?.height ?? defaults.height ?? 500);
  const [layers, setLayers] = useState(initial?.layers ?? defaults.layers ?? 6);
  const [segments, setSegments] = useState(initial?.segments ?? defaults.segments ?? 450);
  const [baseColor, setBaseColor] = useState(initial?.baseColor ?? defaults.baseColor ?? '#ffffff');
  const [speed, setSpeed] = useState(initial?.speed ?? defaults.speed ?? 32);
  const [seed, setSeed] = useState(initial?.seed ?? defaults.seed ?? 1337);
  const [blur, setBlur] = useState(initial?.blur ?? defaults.blur ?? 0);
  const [paused, setPaused] = useState(false);
  const [waveForm, setWaveForm] = useState<"sin" | "cos" | "sincos" | "round">(initial?.waveForm ?? defaults.waveForm ?? 'round');
  const [noiseSmoothness, setNoiseSmoothness] = useState(initial?.noiseSmoothness ?? defaults.noiseSmoothness ?? 0.45);
  const [amplitudeJitter, setAmplitudeJitter] = useState(initial?.amplitudeJitter ?? defaults.amplitudeJitter ?? 0);
  const [amplitudeJitterScale, setAmplitudeJitterScale] = useState(initial?.amplitudeJitterScale ?? defaults.amplitudeJitterScale ?? 0.25);
  const [additiveBlending, setAdditiveBlending] = useState(false);
  const [curveType, setCurveType] = useState<'linear' | 'spline'>(initial?.curveType ?? defaults.curveType ?? 'spline');
  const [curveTension, setCurveTension] = useState(initial?.curveTension ?? defaults.curveTension ?? 0.85);
  const [peakStability, setPeakStability] = useState(initial?.peakStability ?? defaults.peakStability ?? 1.0);
  const [peakNoiseDamping, setPeakNoiseDamping] = useState(initial?.peakNoiseDamping ?? defaults.peakNoiseDamping ?? 1.0);
  const [peakNoisePower, setPeakNoisePower] = useState(initial?.peakNoisePower ?? defaults.peakNoisePower ?? 4);
  const [peakHarmonicDamping, setPeakHarmonicDamping] = useState(initial?.peakHarmonicDamping ?? defaults.peakHarmonicDamping ?? 1.0);
  const [staticPeaks, setStaticPeaks] = useState(initial?.staticPeaks ?? defaults.staticPeaks ?? true);
  const [useSharedBaseline, setUseSharedBaseline] = useState(initial?.useSharedBaseline ?? defaults.useSharedBaseline ?? true);
  const [morphStrength, setMorphStrength] = useState(initial?.morphStrength ?? defaults.morphStrength ?? 0.35);
  const [morphPeriodSec, setMorphPeriodSec] = useState(initial?.morphPeriodSec ?? defaults.morphPeriodSec ?? 18);
  const [amplitudeEnvelopeStrength, setAmplitudeEnvelopeStrength] = useState(initial?.amplitudeEnvelopeStrength ?? defaults.amplitudeEnvelopeStrength ?? 0.36);
  const [amplitudeEnvelopeCycles, setAmplitudeEnvelopeCycles] = useState(initial?.amplitudeEnvelopeCycles ?? defaults.amplitudeEnvelopeCycles ?? 2);
  const [seamlessLoop, setSeamlessLoop] = useState(true);
  const [solidBgEnabled, setSolidBgEnabled] = useState(true);
  const [solidBgHue, setSolidBgHue] = useState(222);
  const [solidBgSat, setSolidBgSat] = useState(0.65);
  const [solidBgLight, setSolidBgLight] = useState(0.14);
  // Topology controls
  const [topologyAmplitude, setTopologyAmplitude] = useState(6);
  const [topologyFrequency, setTopologyFrequency] = useState(0.036);
  const [topologyFreqStep, setTopologyFreqStep] = useState(0.001);
  const [topologySecondary, setTopologySecondary] = useState(0.0);
  // Palette tinting controls
  const [tintEnabled, setTintEnabled] = useState(true);
  const [tintStrength, setTintStrength] = useState(0.4);
  const [layerSpacing, setLayerSpacing] = useState(16);
  const [sunsetMode, setSunsetMode] = useState(initial?.sunsetMode ?? defaults.sunsetMode ?? false);
  const [sunsetPeriodSec, setSunsetPeriodSec] = useState(initial?.sunsetPeriodSec ?? defaults.sunsetPeriodSec ?? 12);
  const [motionAngleDeg, setMotionAngleDeg] = useState(defaults.motionAngleDeg ?? 0);
  const [periodicAngleDeg, setPeriodicAngleDeg] = useState(defaults.periodicAngleDeg ?? 0);
  const [autoCyclePalettes, setAutoCyclePalettes] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(defaults.paletteIndex ?? 0);
  const [smoothTransitionT, setSmoothTransitionT] = useState(0);
  const [hueShift, setHueShift] = useState(defaults.hueShift ?? 0);
  const [saturation, setSaturation] = useState(defaults.saturation ?? 1);
  const [lightness, setLightness] = useState(defaults.lightness ?? 0);
  const [contrast, setContrast] = useState(defaults.contrast ?? 0);
  const [altHueDelta, setAltHueDelta] = useState(defaults.altHueDelta ?? -30);
  const [altSatScale, setAltSatScale] = useState(defaults.altSatScale ?? 1.40);
   const [cloudsEnabled] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Background glow controls
  const [backgroundGlowEnabled, setBackgroundGlowEnabled] = useState(defaults.glowEnabled ?? true);
  const [bgGlowIntensity, setBgGlowIntensity] = useState(defaults.glowIntensity ?? 1);
  const [bgGlowHueShift, setBgGlowHueShift] = useState(defaults.glowHueShift ?? 0);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const exportPreviewRef = useRef<HTMLTextAreaElement | null>(null);


  const resetPaletteAdjustments = React.useCallback(() => {
    setHueShift(0);
    setSaturation(1);
    setLightness(0);
    setContrast(0);
    setAltHueDelta(0);
    setAltSatScale(1);
  }, []);

  // Shared color helpers (used by palette tinting and background composition)
  const parseHex = (hex: string) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    let a = 255;
    if (h.length === 8) {
      a = parseInt(h.slice(6, 8), 16);
      h = h.slice(0, 6);
    }
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  };
  const toRgba = (r: number, g: number, b: number, a01: number) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0, Math.min(1, a01)).toFixed(3)})`;
  const hexToHsl = (hex: string) => {
    const { r, g, b } = parseHex(hex);
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h = 0; const l = (max + min) / 2; let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break;
        case gg: h = (bb - rr) / d + 2; break;
        case bb: h = (rr - gg) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, l };
  };
  const hslToHex = ({ h, s, l }: { h: number; s: number; l: number }) => {
    const c = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const col = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
      return col * 255;
    };
    return `#${c(f(0))}${c(f(8))}${c(f(4))}`;
  };

  const paletteNameCurrent = useMemo(() => paletteNames[paletteIndex % paletteNames.length] || 'sunset', [paletteIndex]);

  const themeForBackground = useMemo(() => {
    if (!sunsetMode) return null as ReturnType<typeof getThemePalette> | null;
    if (autoCyclePalettes && smoothTransitionT > 0) {
      const nextPalette = paletteNames[(paletteIndex + 1) % paletteNames.length] || 'sunset';
      return interpolateThemePalettes(paletteNameCurrent, nextPalette, smoothTransitionT, layers, { reverse: false });
    }
    return getThemePalette(paletteNameCurrent, layers);
  }, [sunsetMode, autoCyclePalettes, smoothTransitionT, paletteIndex, paletteNameCurrent, layers]);

  const layerTheme = useMemo(() => {
    if (!sunsetMode) return null as ReturnType<typeof getThemePalette> | null;
    const applyTint = (colors: string[]) => {
      if (!tintEnabled || tintStrength <= 0) return colors;
      const t = Math.max(0, Math.min(1, tintStrength));
      const base = hexToHsl(baseColor);
      return colors.map(hex => {
        const a = hexToHsl(hex);
        const dh = ((base.h - a.h + 540) % 360) - 180;
        const h = (a.h + dh * t + 360) % 360;
        const s = a.s + (base.s - a.s) * t;
        const l = a.l + (base.l - a.l) * t;
        return hslToHex({ h, s, l });
      });
    };
    if (autoCyclePalettes && smoothTransitionT > 0) {
      const nextPalette = paletteNames[(paletteIndex + 1) % paletteNames.length] || 'sunset';
      const th = interpolateThemePalettes(paletteNameCurrent, nextPalette, smoothTransitionT, layers, { reverse: false });
      return { ...th, colors: applyTint(th.colors) };
    }
    const th = getThemePalette(paletteNameCurrent, layers, { reverse: false }, {
      hueShiftDeg: hueShift,
      saturationScale: saturation,
      lightnessShift: lightness,
      contrast,
      alternateLayerHueDelta: altHueDelta,
      alternateLayerSaturationScale: altSatScale,
    });
    return { ...th, colors: applyTint(th.colors) };
  }, [sunsetMode, autoCyclePalettes, smoothTransitionT, paletteIndex, paletteNameCurrent, layers, hueShift, saturation, lightness, contrast, altHueDelta, altSatScale, tintEnabled, tintStrength, baseColor]); // eslint-disable-line react-hooks/exhaustive-deps

   useEffect(() => {
     setMounted(true);
     void (async () => {
      const d = await fetchCloudDefaults();
      setHeight(initial?.height ?? d.height);
      setLayers(initial?.layers ?? d.layers);
      setSegments(initial?.segments ?? d.segments);
      setBaseColor(initial?.baseColor ?? d.baseColor);
      setSpeed(initial?.speed ?? d.speed);
      setSeed(initial?.seed ?? d.seed);
      setBlur(initial?.blur ?? d.blur);
      setWaveForm(initial?.waveForm ?? d.waveForm);
      setNoiseSmoothness(initial?.noiseSmoothness ?? d.noiseSmoothness);
      setAmplitudeJitter(initial?.amplitudeJitter ?? d.amplitudeJitter);
      setAmplitudeJitterScale(initial?.amplitudeJitterScale ?? d.amplitudeJitterScale);
      setAdditiveBlending(d.additiveBlending);
      setCurveType(initial?.curveType ?? d.curveType);
      setCurveTension(initial?.curveTension ?? d.curveTension);
      setPeakStability(initial?.peakStability ?? d.peakStability);
      setPeakNoiseDamping(initial?.peakNoiseDamping ?? d.peakNoiseDamping);
      setPeakNoisePower(initial?.peakNoisePower ?? d.peakNoisePower);
      setPeakHarmonicDamping(initial?.peakHarmonicDamping ?? d.peakHarmonicDamping);
      setStaticPeaks(initial?.staticPeaks ?? d.staticPeaks);
      setUseSharedBaseline(initial?.useSharedBaseline ?? d.useSharedBaseline);
      setMorphStrength(initial?.morphStrength ?? d.morphStrength);
      setMorphPeriodSec(initial?.morphPeriodSec ?? d.morphPeriodSec);
      setAmplitudeEnvelopeStrength(initial?.amplitudeEnvelopeStrength ?? d.amplitudeEnvelopeStrength);
      setAmplitudeEnvelopeCycles(initial?.amplitudeEnvelopeCycles ?? d.amplitudeEnvelopeCycles);
      setSunsetMode(initial?.sunsetMode ?? d.sunsetMode);
      setSunsetPeriodSec(initial?.sunsetPeriodSec ?? d.sunsetPeriodSec);
      setPaletteIndex(d.paletteIndex);
      setHueShift(d.hueShift);
      setSaturation(d.saturation);
      setLightness(d.lightness);
      setContrast(d.contrast);
      setAltHueDelta(d.altHueDelta);
      setAltSatScale(d.altSatScale);
      setMotionAngleDeg(d.motionAngleDeg ?? 0);
      setPeriodicAngleDeg(d.periodicAngleDeg ?? 0);
      setBackgroundGlowEnabled(d.glowEnabled ?? defaults.glowEnabled ?? true);
      setBgGlowIntensity(d.glowIntensity ?? defaults.glowIntensity ?? 1);
      setBgGlowHueShift(d.glowHueShift ?? defaults.glowHueShift ?? 0);
     })();
  }, [initial]);

  const shuffle = () => { setSeed(Math.floor(Math.random() * 1e9)); };

  const exportCloudConfig = React.useCallback(() => {
    // Mirror the effective props passed to <CloudMaker /> so the exported snippet matches the UI.
    const themedLayers = layerTheme;
    const effectiveBaseColor = sunsetMode ? '#ffffff' : baseColor;
    const effectiveLayerColors = sunsetMode ? themedLayers?.colors : undefined;
    const effectiveLayerOpacities = sunsetMode ? themedLayers?.opacities : undefined;

    const effectiveCurveType = staticPeaks ? 'spline' : curveType;
    const effectiveCurveTension = staticPeaks ? 0.8 : curveTension;
    const effectiveNoiseSmoothness = staticPeaks ? Math.max(noiseSmoothness, 0.4) : noiseSmoothness;
    const effectiveAmplitudeJitter = staticPeaks ? 0 : amplitudeJitter;
    const effectivePeakStability = staticPeaks ? 1 : peakStability;
        const effectivePeakNoiseDamping = staticPeaks ? 1 : peakNoiseDamping;
        const effectivePeakNoisePower = staticPeaks ? Math.max(peakNoisePower, 4) : peakNoisePower;
        const effectivePeakHarmonicDamping = staticPeaks ? 1 : peakHarmonicDamping;
        const effectiveLayerSpacing = Math.max(12, Math.min(24, layerSpacing));

    // Calculate effective roundness values (using default since UI controls removed)
    const effRound = 0.3;
    const effRoundPower = Math.max(1, Math.min(4, 3.5 - 2.0 * effRound));

    const cloudProps = {
      width,
      height,
      layers,
      segments,
      baseColor: effectiveBaseColor,
      ...(effectiveLayerColors ? { layerColors: effectiveLayerColors } : {}),
      ...(effectiveLayerOpacities ? { layerOpacities: effectiveLayerOpacities } : {}),
      speed,
      seed,
      blur,
      waveForm,
      noiseSmoothness: effectiveNoiseSmoothness,
      amplitudeJitter: effectiveAmplitudeJitter,
      amplitudeJitterScale,
      additiveBlending,
      curveType: effectiveCurveType,
      curveTension: effectiveCurveTension,
      peakStability: effectivePeakStability,
      peakNoiseDamping: effectivePeakNoiseDamping,
      peakNoisePower: effectivePeakNoisePower,
      peakHarmonicDamping: effectivePeakHarmonicDamping,
      useSharedBaseline,
      morphStrength,
      morphPeriodSec,
      amplitudeEnvelopeStrength,
      amplitudeEnvelopeCycles,
      peakRoundness: effRound,
      peakRoundnessPower: effRoundPower,
      seamlessLoop,
      animate: !paused,
      background: false as const,
      fit: 'stretch' as const,
      motionAngleDeg,
      periodicAngleDeg,
      baseAmplitude: topologyAmplitude,
      baseFrequency: topologyFrequency,
      layerFrequencyStep: topologyFreqStep,
      secondaryWaveFactor: topologySecondary,
      layerVerticalSpacing: effectiveLayerSpacing,
      glowEnabled: backgroundGlowEnabled,
      glowIntensity: bgGlowIntensity,
      glowHueShift: bgGlowHueShift,
    };

    const propsString = Object.entries(cloudProps)
      .map(([key, value]) => {
        if (value === undefined) return null;
        if (typeof value === 'string') return `${key}="${value}"`;
        if (Array.isArray(value)) return `${key}={${JSON.stringify(value)}}`;
        return `${key}={${value}}`;
      })
      .filter(Boolean)
      .join('\n        ');

    const jsxSnippet = `<CloudMaker
        ${propsString}
        style={{ width: '100%', height: '100%' }}
      />`;

    const copySupported = typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';

    if (copySupported) {
      navigator.clipboard!.writeText(jsxSnippet).then(() => {
        alert('CloudMaker configuration copied to clipboard!\n\n' + jsxSnippet);
      }).catch(() => {
        setExportPreview(jsxSnippet);
      });
      return;
    }

    // Fallback when Clipboard API is not available (e.g., insecure context).
    setExportPreview(jsxSnippet);
  }, [
    width, height, layers, segments, baseColor, speed, seed, blur, waveForm,
    noiseSmoothness, amplitudeJitter, amplitudeJitterScale, additiveBlending, curveType, curveTension,
    peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline,
    morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles,
    sunsetMode, layerTheme, staticPeaks, paused, seamlessLoop,
    motionAngleDeg, periodicAngleDeg,
    topologyAmplitude, topologyFrequency, topologyFreqStep, topologySecondary, layerSpacing,
    backgroundGlowEnabled, bgGlowIntensity, bgGlowHueShift
  ]);

  const copyPreviewToClipboard = React.useCallback(() => {
    if (!exportPreview) return;
    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
      navigator.clipboard.writeText(exportPreview).then(() => {
        alert('CloudMaker configuration copied to clipboard!');
        setExportPreview(null);
      }).catch(() => {
        alert('Clipboard access is blocked. Select the text in the panel and copy manually.');
      });
      return;
    }
    alert('Clipboard unavailable. Select the text in the panel and copy manually.');
  }, [exportPreview]);

  React.useEffect(() => {
    if (!exportPreview) return;
    const node = exportPreviewRef.current;
    if (!node) return;
    // Delay selection until after modal renders
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        node.focus();
        node.select();
      });
    } else {
      node.focus();
      node.select();
    }
  }, [exportPreview]);

  const handleSaveTsx = React.useCallback(async () => {
    const defaultPaletteColors: Record<string, string[]> = {};
    paletteNames.forEach(paletteName => {
      const palette = getThemePalette(paletteName, layers);
      defaultPaletteColors[paletteName] = palette.colors;
    });

    await persistCloudDefaults({
      width, height, layers, segments, baseColor, speed, seed, blur, waveForm,
      noiseSmoothness, amplitudeJitter, amplitudeJitterScale, additiveBlending,
      curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower,
      peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec,
      amplitudeEnvelopeStrength, amplitudeEnvelopeCycles,
      staticPeaks, sunsetMode, sunsetPeriodSec, paletteIndex, hueShift, saturation,
      lightness, contrast, altHueDelta, altSatScale, motionAngleDeg, periodicAngleDeg,
      glowEnabled: backgroundGlowEnabled,
      glowIntensity: bgGlowIntensity,
      glowHueShift: bgGlowHueShift,
      defaultPaletteColors,
    });
  }, [
    width, height, layers, segments, baseColor, speed, seed, blur, waveForm, noiseSmoothness, amplitudeJitter, amplitudeJitterScale, additiveBlending, curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, staticPeaks, sunsetMode, sunsetPeriodSec, paletteIndex, hueShift, saturation, lightness, contrast, altHueDelta, altSatScale, motionAngleDeg, periodicAngleDeg, backgroundGlowEnabled, bgGlowIntensity, bgGlowHueShift
  ]);

  // Sunset palette auto-cycling with smooth transitions
  React.useEffect(() => {
    if (!sunsetMode || !autoCyclePalettes) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const elapsed = (t - t0) / 1000;
      const period = Math.max(1, sunsetPeriodSec);
      const totalCycle = elapsed / period;
      const idx = Math.floor(totalCycle) % paletteNames.length;
      const transitionT = totalCycle - Math.floor(totalCycle);
      
      setPaletteIndex(idx);
      setSmoothTransitionT(transitionT);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); };
  }, [sunsetMode, autoCyclePalettes, sunsetPeriodSec]);

  // Helpers for background CSS composition
  const mkLinear = (angle: number, stops: { color: string; pos: number }[]) =>
    `linear-gradient(${angle}deg, ${stops.map(s => `${s.color} ${s.pos}%`).join(', ')})`;

  const containerStyle: React.CSSProperties = useMemo(() => {
    let bg = 'linear-gradient(180deg, #071122 0%, #0b1530 60%, #0e1838 100%)';
    if (sunsetMode && themeForBackground) {
      const theme = themeForBackground;
      if (theme.backgroundCSS) {
        // Compose background base and overlay with optional glow controls
        const spec = theme.spec?.background;
        if (spec) {
          const baseCSS = mkLinear(spec.angle, spec.stops);
          const mkOverlay = (intensity: number) => {
            if (!spec.overlay) return undefined;
            const stops = spec.overlay.stops.map(s => {
              const { a } = parseHex(s.color);
              const hsl = hexToHsl(s.color);
              const hh = (hsl.h + bgGlowHueShift + 360) % 360;
              const shiftedHex = hslToHex({ h: hh, s: hsl.s, l: hsl.l });
              const rgb = parseHex(shiftedHex);
              const alpha = Math.max(0, Math.min(1, (a / 255) * intensity));
              return { color: toRgba(rgb.r, rgb.g, rgb.b, alpha), pos: s.pos };
            });
            return mkLinear(spec.overlay.angle ?? spec.angle, stops);
          };
          if (!backgroundGlowEnabled) {
            bg = baseCSS;
          } else {
            const i1 = Math.min(1, Math.max(0, bgGlowIntensity));
            const i2 = Math.max(0, Math.min(1, bgGlowIntensity - 1));
            const ov1 = mkOverlay(i1);
            const ov2 = i2 > 0 ? mkOverlay(i2) : undefined;
            bg = [ov2, ov1, baseCSS].filter(Boolean).join(', ');
          }
        } else {
          bg = theme.backgroundCSS;
        }
      }
    }
    return {
      width: '66.666%',
      margin: '0 auto',
      height,
      borderRadius: 14,
      overflow: 'hidden',
      background: bg
    };
  }, [height, sunsetMode, themeForBackground, backgroundGlowEnabled, bgGlowIntensity, bgGlowHueShift]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div style={{ display: 'grid', gridTemplateRows: '1fr auto 1fr', minHeight: '100vh', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={hostRef} style={containerStyle} className={className}>
      {/* Compute effective parameters if static peaks mode is enabled; also handle color palettes */}
      {(() => {
        const p = layerTheme;
        const effectiveBaseColor = sunsetMode ? '#ffffff' : baseColor;
        const effectiveLayerColors = sunsetMode ? p?.colors : undefined;
        const effectiveLayerOpacities = sunsetMode ? p?.opacities : undefined;
        const effectiveCurveType = staticPeaks ? 'spline' : curveType;
        const effectiveCurveTension = staticPeaks ? 0.8 : curveTension;
        const effectiveNoiseSmoothness = staticPeaks ? Math.max(noiseSmoothness, 0.4) : noiseSmoothness;
        const effectiveAmplitudeJitter = staticPeaks ? 0 : amplitudeJitter;
        // Effective mappings
        const effLayerSpacing = Math.max(12, Math.min(24, layerSpacing));
        const effectivePeakStability = staticPeaks ? 1 : peakStability;
        const effectivePeakNoiseDamping = staticPeaks ? 1 : peakNoiseDamping;
        const effectivePeakNoisePower = staticPeaks ? Math.max(peakNoisePower, 4) : peakNoisePower;
        const effectivePeakHarmonicDamping = staticPeaks ? 1 : peakHarmonicDamping;

        return cloudsEnabled && mounted ? (
          <CloudMaker
            key={`cloud-${sunsetMode ? 'sun' : 'base'}-${autoCyclePalettes ? 'cycling' : paletteIndex}-${layers}-${baseColor}-${seed}`}
            width={width}
            height={height}
            layers={layers}
            segments={segments}
            baseColor={effectiveBaseColor}
            {...(effectiveLayerColors ? { layerColors: effectiveLayerColors } : {})}
            {...(effectiveLayerOpacities ? { layerOpacities: effectiveLayerOpacities } : {})}
            speed={speed}
            paused={paused}
            seed={seed}
            blur={blur}
            waveForm={waveForm}
            noiseSmoothness={effectiveNoiseSmoothness}
            amplitudeJitter={effectiveAmplitudeJitter}
            amplitudeJitterScale={amplitudeJitterScale}
            additiveBlending={additiveBlending}
            curveType={effectiveCurveType}
            curveTension={effectiveCurveTension}
            peakStability={effectivePeakStability}
            peakNoiseDamping={effectivePeakNoiseDamping}
            peakNoisePower={effectivePeakNoisePower}
            peakHarmonicDamping={effectivePeakHarmonicDamping}
            useSharedBaseline={useSharedBaseline}
            morphStrength={morphStrength}
            morphPeriodSec={morphPeriodSec}
            amplitudeEnvelopeStrength={amplitudeEnvelopeStrength}
            amplitudeEnvelopeCycles={amplitudeEnvelopeCycles}
            seamlessLoop={seamlessLoop}
            motionAngleDeg={motionAngleDeg}
            periodicAngleDeg={periodicAngleDeg}
            background={solidBgEnabled ? `hsl(${solidBgHue}deg ${Math.round(solidBgSat*100)}% ${Math.round(solidBgLight*100)}%)` : false}
            baseAmplitude={topologyAmplitude}
            baseFrequency={topologyFrequency}
            layerFrequencyStep={topologyFreqStep}
            secondaryWaveFactor={topologySecondary}
            layerVerticalSpacing={effLayerSpacing}
            glowEnabled={backgroundGlowEnabled}
            glowIntensity={bgGlowIntensity}
            glowHueShift={bgGlowHueShift}
          />
        ) : (<div style={{ width: '100%', height }} />);
      })()}

          </div>
        </div>

        <div />

        {controlsVisible && (
          <div style={{ ...panelStyle, height, width: '85vw', maxWidth: '1000px', margin: '0 auto', background: sunsetMode && paletteNames[paletteIndex] ? 'rgba(12,16,28,.6)' : panelStyle.background }}>
            {(() => {
              const paletteNameCurrent = paletteNames[paletteIndex % paletteNames.length] || 'sunset';
              const adjustmentsNeutral = hueShift === 0 && saturation === 1 && lightness === 0 && contrast === 0 && altHueDelta === 0 && altSatScale === 1;
              const curatedTheme = sunsetMode ? getThemePalette(paletteNameCurrent, layers) : null;
              const adjustedTheme = sunsetMode ? getThemePalette(paletteNameCurrent, layers, { reverse: false }, {
                hueShiftDeg: hueShift,
                saturationScale: saturation,
                lightnessShift: lightness,
                contrast,
                alternateLayerHueDelta: altHueDelta,
                alternateLayerSaturationScale: altSatScale,
              }) : null;
              const sections: SectionSchema[] = [
                { id: 'key', title: 'Key Controls', order: 1 },
                { id: 'appearance', title: 'Appearance', order: 2 },
                { id: 'motion', title: 'Motion & Shape', order: 3 },
                { id: 'compositing', title: 'Compositing & Baseline', order: 4 },
                { id: 'variation', title: 'Variation', order: 5 },
                { id: 'palette', title: 'Palette Adjustments', order: 6 },
                { id: 'background', title: 'Background', order: 7 },
              ];
              const controls: ControlSchema[] = [
            { id: 'actions-top', label: 'Actions', sectionId: 'key', order: 0, type: 'buttons', fullRow: true, render: () => (
              <Row label="Actions">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    style={{
                      ...btn,
                      background: autoCyclePalettes ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)',
                      border: autoCyclePalettes ? '1px solid rgba(255,255,255,.4)' : btn.border,
                    }}
                    onClick={() => {
                      setAutoCyclePalettes(v => {
                        const next = !v;
                        if (next) {
                          if (!sunsetMode) setSunsetMode(true);
                          resetPaletteAdjustments();
                          setSmoothTransitionT(0);
                        }
                        return next;
                      });
                    }}
                  >cycle</button>
                  {/* clouds on/off UI removed per request */}
                  <button style={btn} onClick={() => { setPaused(p => !p); }}>{paused ? 'resume' : 'pause'}</button>
                  <button style={btn} onClick={() => {
                    // Randomize UI-focused values only; keep height, speed, blur, structure knobs unchanged
                    setSeed(Math.floor(Math.random() * 1e9));
                    setBaseColor(`#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6,'0')}`);
                    // Palette-related
                    setPaletteIndex(Math.floor(Math.random() * paletteNames.length));
                    setHueShift(Math.floor(Math.random() * 361) - 180);
                    // Tamed ranges to reduce extreme darkening or over-saturation
                    setSaturation(Math.round((0.8 + Math.random() * 0.4) * 100) / 100); // 0.8..1.2
                    setLightness(Math.round(((Math.random() - 0.5) * 0.3) * 100) / 100); // -0.15..0.15
                    setContrast(Math.round(((Math.random() - 0.5) * 0.8) * 100) / 100); // -0.4..0.4
                    setAltHueDelta(Math.floor(Math.random() * 91) - 45); // -45..45
                    setAltSatScale(Math.round((0.85 + Math.random() * 0.3) * 100) / 100); // 0.85..1.15
                    // Sunset options
                    setSunsetMode(Math.random() < 0.5);
                    setSunsetPeriodSec(6 + Math.floor(Math.random() * 30));
                    // Solid background HSL
                    setSolidBgEnabled(Math.random() < 0.7);
                    setSolidBgHue(Math.floor(Math.random() * 360));
                    setSolidBgSat(Math.round((0.3 + Math.random() * 0.7) * 100) / 100);
                    setSolidBgLight(Math.round((0.05 + Math.random() * 0.25) * 100) / 100);
                    // Morph (optional UI feel)
                    setMorphStrength(Math.round(Math.random() * 100) / 100);
                    setMorphPeriodSec(6 + Math.floor(Math.random() * 30));
                     // Topology (wave form) parameters
                     setTopologyAmplitude(Math.round((8 + Math.random() * 28) * 10) / 10); // 8..36
                     setTopologyFrequency(Math.round((0.01 + Math.random() * 0.07) * 1000) / 1000); // 0.01..0.08
                     setTopologyFreqStep(Math.round((0.001 + Math.random() * 0.009) * 10000) / 10000); // 0.001..0.01
                     setTopologySecondary(Math.round((Math.random()) * 100) / 100); // 0..1
                  }}>randomize</button>
                  <button style={btn} onClick={() => {
                    setLayers(7); setSegments(450); setHeight(380);
                    setSpeed(60); setBlur(2.2); setBaseColor('#ffffff'); setSeed(1337); setPaused(false);
                    setWaveForm('sincos'); setNoiseSmoothness(0.45); setAmplitudeJitter(0); setAmplitudeJitterScale(0.25);
                    setAdditiveBlending(false);
                    setCurveType('spline'); setCurveTension(0.85);
                    setPeakStability(1.0);
                    setPeakNoiseDamping(1.0); setPeakNoisePower(4); setPeakHarmonicDamping(1.0);
                    setStaticPeaks(true);
                    setUseSharedBaseline(true);
                    setMorphStrength(0); setMorphPeriodSec(18);
                    setAmplitudeEnvelopeStrength(0.7); setAmplitudeEnvelopeCycles(10);
                    setSunsetMode(false); setPaletteIndex(0);
                    setBackgroundGlowEnabled(defaults.glowEnabled ?? true);
                    setBgGlowIntensity(defaults.glowIntensity ?? 1);
                    setBgGlowHueShift(defaults.glowHueShift ?? 0);
                  }}>reset</button>
                  <button style={btn} onClick={handleSaveTsx}>save</button>
                  <button style={btn} onClick={exportCloudConfig}>export config</button>
                </div>
              </Row>
            ) },
            { id: 'palette-reset', label: 'Reset adjustments', sectionId: 'palette', order: 0, type: 'button', fullRow: true, render: () => (
              <Row label="Palette adjustments">
                <button style={btn} onClick={resetPaletteAdjustments}>reset</button>
              </Row>
            ) },
            { id: 'static', label: 'Static peaks', sectionId: 'palette', order: 20, type: 'toggle', render: () => <Row label="Static peaks" icon={<Icon.toggle size={16} />} right={<Toggle checked={staticPeaks} onChange={setStaticPeaks} />} /> },
            { id: 'seamless', label: 'Seamless morph loop', sectionId: 'palette', order: 21, type: 'toggle', render: () => <Row label="Seamless morph loop" icon={<Icon.toggle size={16} />} right={<Toggle checked={seamlessLoop} onChange={setSeamlessLoop} />} /> },
            { id: 'amp-env', label: 'Amp envelope', sectionId: 'palette', order: 22, type: 'slider', fullRow: true, render: () => <Row label="Amp envelope"><Range min={0} max={1} step={0.02} value={amplitudeEnvelopeStrength} onChange={setAmplitudeEnvelopeStrength} /></Row> },
            { id: 'env-cycles', label: 'Envelope cycles', sectionId: 'palette', order: 23, type: 'slider', fullRow: true, render: () => <Row label="Envelope cycles"><Range min={1} max={10} step={1} value={amplitudeEnvelopeCycles} onChange={setAmplitudeEnvelopeCycles} /></Row> },
            // removed peak roundness and roundness power per UX request

            { id: 'base-color', label: 'Base color', sectionId: 'appearance', order: 1, type: 'color', render: () => (
              <Row
                label="Base color"
                right={<input type="color" value={baseColor} disabled={sunsetMode} onChange={e => { setBaseColor(e.target.value); }} style={{ width: 36, height: 24, border: 'none', background: 'transparent', cursor: sunsetMode ? 'not-allowed' : 'pointer', opacity: sunsetMode ? 0.6 : 1 }} />}
              >
                {sunsetMode && <span style={{ fontSize: 11, opacity: 0.75 }}>Applies only when Sunset mode is off</span>}
              </Row>
            ) },
            { id: 'tint', label: 'Palette tint', sectionId: 'appearance', order: 1.1, type: 'toggle', render: () => <Row label="Palette tint (sunset)"><Toggle checked={tintEnabled} onChange={setTintEnabled} /></Row> },
            { id: 'tint-strength', label: 'Tint strength', sectionId: 'appearance', order: 1.2, type: 'slider', colSpan: 2, render: () => <Row label="Tint strength"><Range min={0} max={1} step={0.01} value={tintStrength} onChange={setTintStrength} /></Row> },
            { id: 'layers', label: 'Layers', sectionId: 'appearance', order: 2, type: 'slider', fullRow: true, render: () => <Row label="Layers"><Range min={3} max={12} value={layers} onChange={setLayers} /></Row> },
            // removed segments control per UX request
            { id: 'height', label: 'Height', sectionId: 'appearance', order: 4, type: 'slider', fullRow: true, render: () => <Row label="Height"><Range min={200} max={640} step={2} value={height} onChange={setHeight} /></Row> },
            { id: 'speed', label: 'Speed', sectionId: 'appearance', order: 5, type: 'slider', fullRow: true, render: () => <Row label="Speed"><Range min={0} max={140} step={1} value={speed} onChange={setSpeed} /></Row> },
            { id: 'blur', label: 'Blur', sectionId: 'appearance', order: 6, type: 'slider', fullRow: true, render: () => <Row label="Blur"><Range min={0} max={6} step={0.2} value={blur} onChange={setBlur} /></Row> },

            { id: 'waveform', label: 'Wave form', sectionId: 'motion', order: 1, type: 'select', render: () => <Row label="Wave form" right={<select value={waveForm} onChange={e => { setWaveForm(e.target.value as 'sin' | 'cos' | 'sincos' | 'round'); }} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '6px 8px' }}><option value="sincos">sin + harmonic</option><option value="sin">sin</option><option value="cos">cos</option><option value="round">rounded cos</option></select>} /> },
            // removed noise smoothness, amplitude jitter, and jitter scale per UX request
            { id: 'blend', label: 'Additive blending', sectionId: 'motion', order: 5, type: 'toggle', render: () => <Row label="Additive blending" right={<Toggle checked={additiveBlending} onChange={setAdditiveBlending} />} /> },
            { id: 'angle', label: 'Motion angle (deg)', sectionId: 'motion', order: 6, type: 'slider', fullRow: true, render: () => <Row label="Motion angle (deg)"><Range min={-60} max={60} step={1} value={motionAngleDeg} onChange={setMotionAngleDeg} /></Row> },
            { id: 'periodic-angle', label: 'Periodic angle (deg)', sectionId: 'motion', order: 7, type: 'slider', fullRow: true, render: () => <Row label="Periodic angle (deg)"><Range min={-60} max={60} step={1} value={periodicAngleDeg} onChange={setPeriodicAngleDeg} /></Row> },
            // removed Curve type per UX request
            // removed Curve tension per UX request
            // removed Peak stability per UX request
            // { id: 'pnoise', label: 'Peak noise damping', sectionId: 'motion', order: 9, type: 'slider', render: () => <Row label="Peak noise damping"><Range min={0} max={1} step={0.02} value={peakNoiseDamping} onChange={setPeakNoiseDamping} /></Row> },
            // { id: 'ppow', label: 'Peak damping power', sectionId: 'motion', order: 10, type: 'slider', render: () => <Row label="Peak damping power"><Range min={1} max={10} step={0.1} value={peakNoisePower} onChange={setPeakNoisePower} /></Row> },
            // removed Peak harmonic damping per UX request

            // removed Shared baseline per UX request

            // removed Morph controls per UX request
            { id: 'sunset', label: 'Sunset mode', sectionId: 'variation', order: 3, type: 'toggle', render: () => <Row label="Sunset mode" right={<Toggle checked={sunsetMode} onChange={(v) => { setSunsetMode(v); if (v) { resetPaletteAdjustments(); setSmoothTransitionT(0); } }} />} /> },
            { id: 'sunsets', label: 'Sunset speed (s)', sectionId: 'variation', order: 4, type: 'slider', render: () => <Row label="Sunset speed (s)"><Range min={4} max={60} step={1} value={sunsetPeriodSec} onChange={setSunsetPeriodSec} /></Row> },
            { id: 'palette-names', label: 'Palette', sectionId: 'key', order: 5, type: 'palette', fullRow: true, render: () => (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {paletteNames.slice(0,8).map((name, i) => (
                    <button
                      key={name}
                      style={{ ...btn, opacity: paletteIndex === i ? 1 : 0.7 }}
                      onPointerDown={() => { setPaletteIndex(i); setSunsetMode(true); setAutoCyclePalettes(false); resetPaletteAdjustments(); }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {curatedTheme?.colors && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ opacity: 0.8, fontSize: 11 }}>curated</div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, curatedTheme.colors.length)}, 1fr)`, gap: 4 }}>
                      {curatedTheme.colors.map((c, idx) => (
                        <button
                          key={`cur-${idx}`}
                          title={c}
                          style={{ height: 18, background: c, borderRadius: 4, border: '1px solid rgba(255,255,255,.35)', cursor: 'pointer' }}
                          onPointerDown={() => { setPaletteIndex(paletteIndex); }}
                        />
                      ))}
                    </div>
                    {!adjustmentsNeutral && adjustedTheme?.colors && (
                      <>
                        <div style={{ opacity: 0.8, fontSize: 11 }}>adjusted</div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, adjustedTheme.colors.length)}, 1fr)`, gap: 4 }}>
                          {adjustedTheme.colors.map((c, idx) => (
                            <button
                              key={`adj-${idx}`}
                              title={c}
                              style={{ height: 18, background: c, borderRadius: 4, border: '1px solid rgba(255,255,255,.35)', cursor: 'pointer' }}
                              onPointerDown={() => { setPaletteIndex(paletteIndex); }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) },
            
            { id: 'hue', label: 'Hue shift', sectionId: 'palette', order: 1, type: 'slider', colSpan: 2, render: () => <Row label="Hue shift" icon={<Icon.palette size={14} />}><Range min={-180} max={180} step={1} value={hueShift} onChange={setHueShift} /></Row> },
            { id: 'sat', label: 'Saturation', sectionId: 'palette', order: 2, type: 'slider', colSpan: 2, render: () => <Row label="Saturation" icon={<Icon.palette size={14} />}><Range min={0} max={2} step={0.02} value={saturation} onChange={setSaturation} /></Row> },
            { id: 'light', label: 'Lightness', sectionId: 'palette', order: 3, type: 'slider', colSpan: 2, render: () => <Row label="Lightness" icon={<Icon.palette size={14} />}><Range min={-0.5} max={0.5} step={0.01} value={lightness} onChange={setLightness} /></Row> },
            { id: 'ctr', label: 'Contrast', sectionId: 'palette', order: 4, type: 'slider', colSpan: 2, render: () => <Row label="Contrast" icon={<Icon.palette size={14} />}><Range min={-1} max={1} step={0.02} value={contrast} onChange={setContrast} /></Row> },
            // Topology-impacting sliders
            { id: 'topo-amp', label: 'Wave amplitude', sectionId: 'key', order: 7, type: 'slider', colSpan: 2, render: () => <Row label="Wave amplitude"><Range min={0} max={50} step={0.5} value={topologyAmplitude} onChange={(v) => { setTopologyAmplitude(v); }} /></Row> },
            { id: 'topo-freq', label: 'Base frequency', sectionId: 'key', order: 8, type: 'slider', colSpan: 2, render: () => <Row label="Base frequency"><Range min={0.01} max={0.08} step={0.001} value={topologyFrequency} onChange={(v) => { setTopologyFrequency(v); }} /></Row> },
            { id: 'topo-step', label: 'Layer frequency step', sectionId: 'key', order: 9, type: 'slider', colSpan: 2, render: () => <Row label="Layer frequency step"><Range min={0.001} max={0.01} step={0.0005} value={topologyFreqStep} onChange={(v) => { setTopologyFreqStep(v); }} /></Row> },
            { id: 'topo-harm', label: 'Secondary wave factor', sectionId: 'key', order: 10, type: 'slider', colSpan: 2, render: () => <Row label="Secondary wave factor"><Range min={0} max={1} step={0.01} value={topologySecondary} onChange={(v) => { setTopologySecondary(v); }} /></Row> },
            { id: 'macro-spacing', label: 'Layer spacing', sectionId: 'key', order: 14, type: 'slider', colSpan: 2, render: () => <Row label="Layer spacing (px)"><Range min={12} max={24} step={1} value={layerSpacing} onChange={setLayerSpacing} /></Row> },
            { id: 'altdh', label: 'Alt hue Δ (odd layers)', sectionId: 'palette', order: 5, type: 'slider', fullRow: true, render: () => <Row label="Alt hue Δ (odd layers)" icon={<Icon.layers size={14} />}><Range min={-90} max={90} step={1} value={altHueDelta} onChange={setAltHueDelta} /></Row> },
            { id: 'altds', label: 'Alt sat × (odd layers)', sectionId: 'palette', order: 6, type: 'slider', fullRow: true, render: () => <Row label="Alt sat × (odd layers)" icon={<Icon.layers size={14} />}><Range min={0.5} max={1.5} step={0.01} value={altSatScale} onChange={setAltSatScale} /></Row> },
            { id: 'seed', label: 'Seed', sectionId: 'variation', order: 98, type: 'button', render: () => <Row label="Seed" right={<button style={btn} onClick={shuffle}>shuffle</button>}><input type="number" value={seed} onChange={e => { setSeed(clamp(+e.target.value || 0, 0, 2 ** 31 - 1)); }} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'inherit', padding: '6px 8px', borderRadius: 8 }} /></Row> },

            // Background controls
            { id: 'bg-solid-toggle', label: 'Solid background', sectionId: 'background', order: 0, type: 'toggle', render: () => <Row label="Solid background" right={<Toggle checked={solidBgEnabled} onChange={setSolidBgEnabled} />} /> },
            { id: 'bg-solid-h', label: 'Bg hue', sectionId: 'background', order: 1, type: 'slider', colSpan: 2, render: () => <Row label="Bg hue"><Range min={0} max={360} step={1} value={solidBgHue} onChange={setSolidBgHue} /></Row> },
            { id: 'bg-solid-s', label: 'Bg saturation', sectionId: 'background', order: 2, type: 'slider', colSpan: 2, render: () => <Row label="Bg saturation"><Range min={0} max={1} step={0.01} value={solidBgSat} onChange={setSolidBgSat} /></Row> },
            { id: 'bg-solid-l', label: 'Bg lightness', sectionId: 'background', order: 3, type: 'slider', colSpan: 2, render: () => <Row label="Bg lightness"><Range min={0} max={1} step={0.01} value={solidBgLight} onChange={setSolidBgLight} /></Row> },
            { id: 'bg-toggle', label: 'Glow enabled', sectionId: 'background', order: 4, type: 'toggle', render: () => <Row label="Glow enabled" right={<Toggle checked={backgroundGlowEnabled} onChange={setBackgroundGlowEnabled} />} /> },
            { id: 'bg-intensity', label: 'Glow intensity', sectionId: 'background', order: 2, type: 'slider', colSpan: 2, render: () => <Row label="Glow intensity"><Range min={0} max={2} step={0.01} value={bgGlowIntensity} onChange={setBgGlowIntensity} /></Row> },
            { id: 'bg-hue', label: 'Glow hue shift', sectionId: 'background', order: 3, type: 'slider', colSpan: 2, render: () => <Row label="Glow hue shift"><Range min={-180} max={180} step={1} value={bgGlowHueShift} onChange={setBgGlowHueShift} /></Row> },
          ];
              return <SettingsPanel sections={sections} controls={controls} />;
            })()}
        </div>
        )}
        {!controlsVisible && (
          <div style={{ gridRow: 3, textAlign: 'center', marginTop: 8 }}>
            <button onClick={() => { setControlsVisible(true); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.06)', color: 'inherit' }}>menu</button>
          </div>
        )}
      </div>

      {exportPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5,8,15,0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: 'min(900px, 90vw)',
              maxHeight: '84vh',
              background: 'rgba(12,16,28,0.96)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              padding: 24,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.7 }}>CloudMaker export</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Copy configuration</div>
              </div>
              <button
                style={{
                  ...btn,
                  padding: '6px 10px',
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.08)'
                }}
                onClick={() => { setExportPreview(null); }}
              >close</button>
            </div>
            <textarea
              ref={exportPreviewRef}
              readOnly
              value={exportPreview}
              style={{
                flex: '1 1 auto',
                width: '100%',
                minHeight: '40vh',
                maxHeight: '60vh',
                background: 'rgba(4,6,14,0.9)',
                color: '#f5f8ff',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                padding: 16,
                fontFamily: 'SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                fontSize: 12,
                lineHeight: 1.6,
                resize: 'vertical',
                overflow: 'auto'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, opacity: 0.65 }}>Tip: If the copy button fails, press ⌘/Ctrl+A then ⌘/Ctrl+C.</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  style={{
                    ...btn,
                    padding: '10px 18px',
                    border: '1px solid rgba(255,255,255,0.45)',
                    background: 'rgba(255,255,255,0.14)',
                    fontWeight: 600
                  }}
                  onClick={copyPreviewToClipboard}
                >copy to clipboard</button>
                <button
                  style={{
                    ...btn,
                    padding: '10px 18px'
                  }}
                  onClick={() => { setExportPreview(null); }}
                >close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default CloudBackdropReview;
