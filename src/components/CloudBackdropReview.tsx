"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import CloudBackdrop from './CloudBackdrop';
import Icon from './icons';
import SettingsPanel from './settings/SettingsPanel';
import type { SectionSchema, ControlSchema } from './settings/types';
import { getThemePalette, interpolateThemePalettes, paletteNames } from '@/utils/palettes';
import { loadCloudDefaults, fetchCloudDefaults, persistCloudDefaults } from '@/config/cloudDefaults';

type Num = number;
const clamp = (n: Num, a: Num, b: Num) => (n < a ? a : n > b ? b : n);

function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([e]) => setW(e.contentRect.width));
    obs.observe(ref.current);
    return () => obs.disconnect();
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
      onChange={e => onChange(clamp(+e.target.value, min, max))}
      style={{ width: '100%', height: 28 }}
    />
    {numberBox && (
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(clamp(+e.target.value, min, max))}
        style={{ width: 88, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'inherit', padding: '6px 8px', borderRadius: 8 }}
      />
    )}
  </div>
);

type Init = Partial<{
  width: number; height: number; layers: number; segments: number; baseColor: string;
  speed: number; seed: number; blur: number;
  waveForm: 'sin' | 'cos' | 'sincos';
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
  peakRoundness: number;
  peakRoundnessPower: number;
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
      onChange={e => onChange(e.target.checked)}
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
  const [hostRef, widthPx] = useElementWidth<HTMLDivElement>();
  const defaults = useMemo(() => loadCloudDefaults(), []);
  const width = Math.max(600, Math.round(widthPx || (initial?.width ?? defaults.width ?? 1200)));

  const [height, setHeight] = useState(initial?.height ?? defaults.height ?? 500);
  const [layers, setLayers] = useState(initial?.layers ?? defaults.layers ?? 6);
  const [segments, setSegments] = useState(initial?.segments ?? defaults.segments ?? 450);
  const [baseColor, setBaseColor] = useState(initial?.baseColor ?? defaults.baseColor ?? '#ffffff');
  const [speed, setSpeed] = useState(initial?.speed ?? defaults.speed ?? 32);
  const [seed, setSeed] = useState(initial?.seed ?? defaults.seed ?? 1337);
  const [blur, setBlur] = useState(initial?.blur ?? defaults.blur ?? 0);
  const [paused, setPaused] = useState(false);
  const [waveForm, setWaveForm] = useState<"sin" | "cos" | "sincos">(initial?.waveForm ?? defaults.waveForm ?? 'sincos');
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
  const [peakRoundness, setPeakRoundness] = useState(initial?.peakRoundness ?? defaults.peakRoundness ?? 0.8);
  const [peakRoundnessPower, setPeakRoundnessPower] = useState(initial?.peakRoundnessPower ?? defaults.peakRoundnessPower ?? 10);
  const [sunsetMode, setSunsetMode] = useState(initial?.sunsetMode ?? defaults.sunsetMode ?? false);
  const [sunsetPeriodSec, setSunsetPeriodSec] = useState(initial?.sunsetPeriodSec ?? defaults.sunsetPeriodSec ?? 12);
  const [autoCyclePalettes, setAutoCyclePalettes] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(defaults.paletteIndex ?? 0);
  const [smoothTransitionT, setSmoothTransitionT] = useState(0);
  const [hueShift, setHueShift] = useState(defaults.hueShift ?? 0);
  const [saturation, setSaturation] = useState(defaults.saturation ?? 1);
  const [lightness, setLightness] = useState(defaults.lightness ?? 0);
  const [contrast, setContrast] = useState(defaults.contrast ?? 0);
  const [altHueDelta, setAltHueDelta] = useState(defaults.altHueDelta ?? -30);
  const [altSatScale, setAltSatScale] = useState(defaults.altSatScale ?? 1.40);
  const [cloudsEnabled, setCloudsEnabled] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
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
      setPeakRoundness(initial?.peakRoundness ?? d.peakRoundness);
      setPeakRoundnessPower(initial?.peakRoundnessPower ?? d.peakRoundnessPower);
      setSunsetMode(initial?.sunsetMode ?? d.sunsetMode);
      setSunsetPeriodSec(initial?.sunsetPeriodSec ?? d.sunsetPeriodSec);
      setPaletteIndex(d.paletteIndex);
      setHueShift(d.hueShift);
      setSaturation(d.saturation);
      setLightness(d.lightness);
      setContrast(d.contrast);
      setAltHueDelta(d.altHueDelta);
      setAltSatScale(d.altSatScale);
    })();
  }, [initial]);

  const shuffle = () => setSeed(Math.floor(Math.random() * 1e9));

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
      amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, peakRoundness, peakRoundnessPower,
      staticPeaks, sunsetMode, sunsetPeriodSec, paletteIndex, hueShift, saturation,
      lightness, contrast, altHueDelta, altSatScale, defaultPaletteColors,
    });
  }, [
    width, height, layers, segments, baseColor, speed, seed, blur, waveForm, noiseSmoothness, amplitudeJitter, amplitudeJitterScale, additiveBlending, curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, peakRoundness, peakRoundnessPower, staticPeaks, sunsetMode, sunsetPeriodSec, paletteIndex, hueShift, saturation, lightness, contrast, altHueDelta, altSatScale, layers
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
    return () => cancelAnimationFrame(raf);
  }, [sunsetMode, autoCyclePalettes, sunsetPeriodSec]);

  const containerStyle: React.CSSProperties = useMemo(() => {
    let bg = 'linear-gradient(180deg, #071122 0%, #0b1530 60%, #0e1838 100%)';
    if (sunsetMode) {
      let theme;
      if (autoCyclePalettes && smoothTransitionT > 0) {
        const currentPalette = paletteNames[paletteIndex % paletteNames.length] || 'sunset';
        const nextPalette = paletteNames[(paletteIndex + 1) % paletteNames.length] || 'sunset';
        theme = interpolateThemePalettes(currentPalette, nextPalette, smoothTransitionT, layers, { reverse: false }, {
          hueShiftDeg: hueShift,
          saturationScale: saturation,
          lightnessShift: lightness,
          contrast,
          alternateLayerHueDelta: altHueDelta,
          alternateLayerSaturationScale: altSatScale,
        });
      } else {
        theme = getThemePalette(paletteNames[paletteIndex % paletteNames.length] || 'sunset', layers);
      }
      if (theme.backgroundCSS) bg = theme.backgroundCSS;
    }
    return {
      width: '66.666%',
      margin: '0 auto',
      height,
      borderRadius: 14,
      overflow: 'hidden',
      background: bg
    };
  }, [height, sunsetMode, paletteIndex, layers, autoCyclePalettes, smoothTransitionT, hueShift, saturation, lightness, contrast, altHueDelta, altSatScale]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto 1fr', minHeight: '100vh', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div ref={hostRef} style={containerStyle} className={className}>
      {/* Compute effective parameters if static peaks mode is enabled; also handle color palettes */}
      {(() => {
        const paletteName = paletteNames[paletteIndex % paletteNames.length] || 'sunset';
        let p = null;
        if (sunsetMode) {
          if (autoCyclePalettes && smoothTransitionT > 0) {
            const nextPaletteName = paletteNames[(paletteIndex + 1) % paletteNames.length] || 'sunset';
            p = interpolateThemePalettes(paletteName, nextPaletteName, smoothTransitionT, layers, { reverse: false }, {
              hueShiftDeg: hueShift,
              saturationScale: saturation,
              lightnessShift: lightness,
              contrast,
              alternateLayerHueDelta: altHueDelta,
              alternateLayerSaturationScale: altSatScale,
            });
          } else {
            p = getThemePalette(paletteName, layers, { reverse: false }, {
              hueShiftDeg: hueShift,
              saturationScale: saturation,
              lightnessShift: lightness,
              contrast,
              alternateLayerHueDelta: altHueDelta,
              alternateLayerSaturationScale: altSatScale,
            });
          }
        }
        const effectiveBaseColor = sunsetMode ? '#ffffff' : baseColor;
        const effectiveLayerColors = sunsetMode ? p?.colors : undefined;
        const effectiveLayerOpacities = sunsetMode ? p?.opacities : undefined;
        const effectiveCurveType = staticPeaks ? 'spline' : curveType;
        const effectiveCurveTension = staticPeaks ? 0.8 : curveTension;
        const effectiveNoiseSmoothness = staticPeaks ? Math.max(noiseSmoothness, 0.4) : noiseSmoothness;
        const effectiveAmplitudeJitter = staticPeaks ? 0 : amplitudeJitter;
        const effectivePeakStability = staticPeaks ? 1 : peakStability;
        const effectivePeakNoiseDamping = staticPeaks ? 1 : peakNoiseDamping;
        const effectivePeakNoisePower = staticPeaks ? Math.max(peakNoisePower, 4) : peakNoisePower;
        const effectivePeakHarmonicDamping = staticPeaks ? 1 : peakHarmonicDamping;

        return cloudsEnabled && mounted ? (
      <CloudBackdrop
        key={`${sunsetMode ? 'sun' : 'base'}-${paletteIndex}-${layers}-${baseColor}`}
        width={width}
        height={height}
        layers={layers}
        segments={segments}
        baseColor={effectiveBaseColor}
        layerColors={effectiveLayerColors}
        layerOpacities={effectiveLayerOpacities}
        speed={paused ? 0 : speed}
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
        peakRoundness={peakRoundness}
        peakRoundnessPower={peakRoundnessPower}
      />
        ) : (<div style={{ width: '100%', height }} />);
      })()}

      </div>
      </div>

      <div />

      {controlsVisible && (
      <div style={{ ...panelStyle, height, width: '85vw', maxWidth: '1000px', margin: '0 auto', background: sunsetMode && paletteNames[paletteIndex] ? 'rgba(12,16,28,.6)' : panelStyle.background }}>
        {(() => {
          const theme = sunsetMode ? getThemePalette(paletteNames[paletteIndex % paletteNames.length] || 'sunset', layers) : null;
           const sections: SectionSchema[] = [
            { id: 'key', title: 'Key Controls', order: 1 },
            { id: 'appearance', title: 'Appearance', order: 2 },
            { id: 'motion', title: 'Motion & Shape', order: 3 },
            { id: 'compositing', title: 'Compositing & Baseline', order: 4 },
            { id: 'variation', title: 'Variation', order: 5 },
            { id: 'palette', title: 'Palette Adjustments', order: 6 },
          ];
           const controls: ControlSchema[] = [
            { id: 'actions-top', label: 'Actions', sectionId: 'key', order: 0, type: 'buttons', fullRow: true, render: () => (
              <Row label="Actions">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button style={btn} onClick={() => setPaused(p => !p)}>{paused ? 'resume' : 'pause'}</button>
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
                    setPeakRoundness(0.8); setPeakRoundnessPower(10);
                    setSunsetMode(false); setPaletteIndex(0);
                  }}>reset</button>
                  <button style={btn} onClick={handleSaveTsx}>save .tsx</button>
                </div>
              </Row>
            ) },
            { id: 'static', label: 'Static peaks', sectionId: 'key', order: 1, type: 'toggle', render: () => <Row label="Static peaks" icon={<Icon.toggle size={16} />} right={<Toggle checked={staticPeaks} onChange={setStaticPeaks} />} /> },
            { id: 'clouds', label: 'Clouds on/off', sectionId: 'key', order: 2, type: 'toggle', render: () => <Row label="Clouds on/off" icon={<Icon.wave size={16} />} right={<Toggle checked={cloudsEnabled} onChange={setCloudsEnabled} />} /> },
            { id: 'amp-env', label: 'Amp envelope', sectionId: 'key', order: 3, type: 'slider', fullRow: true, render: () => <Row label="Amp envelope"><Range min={0} max={1} step={0.02} value={amplitudeEnvelopeStrength} onChange={setAmplitudeEnvelopeStrength} /></Row> },
            { id: 'env-cycles', label: 'Envelope cycles', sectionId: 'key', order: 4, type: 'slider', fullRow: true, render: () => <Row label="Envelope cycles"><Range min={1} max={10} step={1} value={amplitudeEnvelopeCycles} onChange={setAmplitudeEnvelopeCycles} /></Row> },
            // removed peak roundness and roundness power per UX request

            { id: 'base-color', label: 'Base color', sectionId: 'appearance', order: 1, type: 'color', render: () => <Row label="Base color" right={<input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)} style={{ width: 36, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />} /> },
            { id: 'layers', label: 'Layers', sectionId: 'appearance', order: 2, type: 'slider', fullRow: true, render: () => <Row label="Layers"><Range min={3} max={12} value={layers} onChange={setLayers} /></Row> },
            // removed segments control per UX request
            { id: 'height', label: 'Height', sectionId: 'appearance', order: 4, type: 'slider', fullRow: true, render: () => <Row label="Height"><Range min={200} max={640} step={2} value={height} onChange={setHeight} /></Row> },
            { id: 'speed', label: 'Speed', sectionId: 'appearance', order: 5, type: 'slider', fullRow: true, render: () => <Row label="Speed"><Range min={0} max={140} step={1} value={speed} onChange={setSpeed} /></Row> },
            { id: 'blur', label: 'Blur', sectionId: 'appearance', order: 6, type: 'slider', fullRow: true, render: () => <Row label="Blur"><Range min={0} max={6} step={0.2} value={blur} onChange={setBlur} /></Row> },

            { id: 'waveform', label: 'Wave form', sectionId: 'motion', order: 1, type: 'select', render: () => <Row label="Wave form" right={<select value={waveForm} onChange={e => setWaveForm(e.target.value as 'sin' | 'cos' | 'sincos')} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '6px 8px' }}><option value="sincos">sin + harmonic</option><option value="sin">sin</option><option value="cos">cos</option></select>} /> },
            // removed noise smoothness, amplitude jitter, and jitter scale per UX request
            { id: 'blend', label: 'Additive blending', sectionId: 'motion', order: 5, type: 'toggle', render: () => <Row label="Additive blending" right={<Toggle checked={additiveBlending} onChange={setAdditiveBlending} />} /> },
            // removed Curve type per UX request
            // removed Curve tension per UX request
            // removed Peak stability per UX request
            // { id: 'pnoise', label: 'Peak noise damping', sectionId: 'motion', order: 9, type: 'slider', render: () => <Row label="Peak noise damping"><Range min={0} max={1} step={0.02} value={peakNoiseDamping} onChange={setPeakNoiseDamping} /></Row> },
            // { id: 'ppow', label: 'Peak damping power', sectionId: 'motion', order: 10, type: 'slider', render: () => <Row label="Peak damping power"><Range min={1} max={10} step={0.1} value={peakNoisePower} onChange={setPeakNoisePower} /></Row> },
            // removed Peak harmonic damping per UX request

            // removed Shared baseline per UX request

            // removed Morph controls per UX request
            { id: 'sunset', label: 'Sunset mode', sectionId: 'variation', order: 3, type: 'toggle', render: () => <Row label="Sunset mode" right={<Toggle checked={sunsetMode} onChange={setSunsetMode} />} /> },
            { id: 'sunsets', label: 'Sunset speed (s)', sectionId: 'variation', order: 4, type: 'slider', render: () => <Row label="Sunset speed (s)"><Range min={4} max={60} step={1} value={sunsetPeriodSec} onChange={setSunsetPeriodSec} /></Row> },
            { id: 'palette-names', label: 'Palette', sectionId: 'variation', order: 5, type: 'palette', fullRow: true, render: () => (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {paletteNames.slice(0,8).map((name, i) => (
                    <button
                      key={name}
                      style={{ ...btn, opacity: paletteIndex === i ? 1 : 0.7 }}
                      onPointerDown={() => { setPaletteIndex(i); setSunsetMode(true); setAutoCyclePalettes(false); }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {theme?.colors && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, theme.colors.length)})`, gap: 4 }}>
                    {theme.colors.map((c, idx) => (
                      <button
                        key={idx}
                        title={c}
                        style={{ height: 18, background: c, borderRadius: 4, border: '1px solid rgba(255,255,255,.35)', cursor: 'pointer' }}
                        onPointerDown={() => setPaletteIndex(paletteIndex)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) },
            { id: 'cycle', label: 'Auto-cycle palettes', sectionId: 'variation', order: 6, type: 'toggle', render: () => <Row label="Auto-cycle palettes" right={<Toggle checked={autoCyclePalettes} onChange={setAutoCyclePalettes} />} /> },
            { id: 'hue', label: 'Hue shift', sectionId: 'palette', order: 1, type: 'slider', fullRow: true, render: () => <Row label="Hue shift" icon={<Icon.palette size={14} />}><Range min={-180} max={180} step={1} value={hueShift} onChange={setHueShift} /></Row> },
            { id: 'sat', label: 'Saturation', sectionId: 'palette', order: 2, type: 'slider', fullRow: true, render: () => <Row label="Saturation" icon={<Icon.palette size={14} />}><Range min={0} max={2} step={0.02} value={saturation} onChange={setSaturation} /></Row> },
            { id: 'light', label: 'Lightness', sectionId: 'palette', order: 3, type: 'slider', fullRow: true, render: () => <Row label="Lightness" icon={<Icon.palette size={14} />}><Range min={-0.5} max={0.5} step={0.01} value={lightness} onChange={setLightness} /></Row> },
            { id: 'ctr', label: 'Contrast', sectionId: 'palette', order: 4, type: 'slider', fullRow: true, render: () => <Row label="Contrast" icon={<Icon.palette size={14} />}><Range min={-1} max={1} step={0.02} value={contrast} onChange={setContrast} /></Row> },
            { id: 'altdh', label: 'Alt hue Δ (odd layers)', sectionId: 'palette', order: 5, type: 'slider', fullRow: true, render: () => <Row label="Alt hue Δ (odd layers)" icon={<Icon.layers size={14} />}><Range min={-90} max={90} step={1} value={altHueDelta} onChange={setAltHueDelta} /></Row> },
            { id: 'altds', label: 'Alt sat × (odd layers)', sectionId: 'palette', order: 6, type: 'slider', fullRow: true, render: () => <Row label="Alt sat × (odd layers)" icon={<Icon.layers size={14} />}><Range min={0.5} max={1.5} step={0.01} value={altSatScale} onChange={setAltSatScale} /></Row> },
            { id: 'seed', label: 'Seed', sectionId: 'variation', order: 98, type: 'button', render: () => <Row label="Seed" right={<button style={btn} onClick={shuffle}>shuffle</button>}><input type="number" value={seed} onChange={e => setSeed(clamp(+e.target.value || 0, 0, 2 ** 31 - 1))} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'inherit', padding: '6px 8px', borderRadius: 8 }} /></Row> },
          ];
          return <SettingsPanel sections={sections} controls={controls} />;
        })()}
      </div>
      )}
      {!controlsVisible && (
        <div style={{ gridRow: 3, textAlign: 'center', marginTop: 8 }}>
          <button onClick={() => setControlsVisible(true)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.06)', color: 'inherit' }}>menu</button>
        </div>
      )}
    </div>
  );
};


export default CloudBackdropReview;
