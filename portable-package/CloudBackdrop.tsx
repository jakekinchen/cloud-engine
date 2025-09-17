"use client";

import React, { useEffect, useMemo, useRef, useId } from 'react';
import { createCloudEngine } from './cloud_maker';
import cloudDefaults from './cloudDefaults.json';

export type CloudMakerProps = {
  width?: number;
  height?: number;
  layers?: number;
  segments?: number;
  baseColor?: string;
  layerColors?: string[];
  layerOpacities?: number[];
  speed?: number;
  seed?: number;
  blur?: number;
  waveForm?: 'sin' | 'cos' | 'sincos' | 'round';
  noiseSmoothness?: number;
  amplitudeJitter?: number;
  amplitudeJitterScale?: number;
  additiveBlending?: boolean;
  backOpacity?: number;
  frontOpacity?: number;
  opacityCurvePower?: number;
  curveType?: 'linear' | 'spline';
  curveTension?: number;
  peakStability?: number;
  peakNoiseDamping?: number;
  peakNoisePower?: number;
  peakHarmonicDamping?: number;
  useSharedBaseline?: boolean;
  baseAmplitude?: number;
  baseFrequency?: number;
  layerFrequencyStep?: number;
  secondaryWaveFactor?: number;
  layerVerticalSpacing?: number;
  morphStrength?: number;
  morphPeriodSec?: number;
  amplitudeEnvelopeStrength?: number;
  amplitudeEnvelopeCycles?: number;
  peakRoundness?: number;
  peakRoundnessPower?: number;
  seamlessLoop?: boolean;
  animate?: boolean;
  phase?: number;
  morphT?: number;
  cycleIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'stretch' | 'meet' | 'slice';
  background?: false | string; // false: transparent, string: solid fill color
  motionAngleDeg?: number;
  periodicAngleDeg?: number;
  paused?: boolean;
  glowEnabled?: boolean;
  glowIntensity?: number;
  glowHueShift?: number;
};

type GlowConfig = {
  enabled: boolean;
  intensity: number;
  hueShift: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const hexToHsl = (hex: string) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
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

const hslToHex = ({ h, s, l }: { h: number; s: number; l: number }) => {
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const hh = ((h % 360) + 360) % 360 / 360;
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, hh + 1 / 3);
    g = hueToRgb(p, q, hh);
    b = hueToRgb(p, q, hh - 1 / 3);
  }

  const toHex = (x: number) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const shiftHue = (hex: string, delta: number) => {
  const hsl = hexToHsl(hex);
  return hslToHex({ h: hsl.h + delta, s: hsl.s, l: hsl.l });
};

const sanitizeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '');

const partialDefaults = cloudDefaults as Partial<CloudMakerProps>;

const CloudMaker: React.FC<CloudMakerProps> = ({
  width = cloudDefaults.width,
  height = cloudDefaults.height,
  layers = cloudDefaults.layers,
  segments = cloudDefaults.segments,
  baseColor = cloudDefaults.baseColor,
  layerColors = [],
  layerOpacities,
  speed = cloudDefaults.speed,
  seed = cloudDefaults.seed,
  blur = cloudDefaults.blur,
  waveForm = cloudDefaults.waveForm as CloudMakerProps['waveForm'],
  noiseSmoothness = cloudDefaults.noiseSmoothness,
  amplitudeJitter = cloudDefaults.amplitudeJitter,
  amplitudeJitterScale = cloudDefaults.amplitudeJitterScale,
  additiveBlending = cloudDefaults.additiveBlending,
  backOpacity = cloudDefaults.backOpacity ?? 0.12,
  frontOpacity = cloudDefaults.frontOpacity ?? 0.96,
  opacityCurvePower = cloudDefaults.opacityCurvePower ?? 2.4,
  curveType = cloudDefaults.curveType as CloudMakerProps['curveType'],
  curveTension = cloudDefaults.curveTension,
  peakStability = cloudDefaults.peakStability,
  peakNoiseDamping = cloudDefaults.peakNoiseDamping,
  peakNoisePower = cloudDefaults.peakNoisePower,
  peakHarmonicDamping = cloudDefaults.peakHarmonicDamping,
  useSharedBaseline = cloudDefaults.useSharedBaseline,
  baseAmplitude = partialDefaults.baseAmplitude,
  baseFrequency = partialDefaults.baseFrequency,
  layerFrequencyStep = partialDefaults.layerFrequencyStep,
  secondaryWaveFactor = partialDefaults.secondaryWaveFactor,
  layerVerticalSpacing = partialDefaults.layerVerticalSpacing,
  morphStrength = cloudDefaults.morphStrength,
  morphPeriodSec = cloudDefaults.morphPeriodSec,
  amplitudeEnvelopeStrength = cloudDefaults.amplitudeEnvelopeStrength,
  amplitudeEnvelopeCycles = cloudDefaults.amplitudeEnvelopeCycles,
  seamlessLoop = true,
  animate = true,
  phase = 0,
  morphT = 0,
  cycleIndex = 0,
  className,
  style,
  fit = 'stretch',
  background = false,
  motionAngleDeg = cloudDefaults.motionAngleDeg ?? 0,
  periodicAngleDeg = cloudDefaults.periodicAngleDeg ?? 0,
  paused = false,
  glowEnabled = cloudDefaults.glowEnabled ?? false,
  glowIntensity = cloudDefaults.glowIntensity ?? 1,
  glowHueShift = cloudDefaults.glowHueShift ?? 0,
}) => {
  const glow: GlowConfig = {
    enabled: !!glowEnabled,
    intensity: Math.max(0, glowIntensity),
    hueShift: glowHueShift ?? 0,
  };

  const blurFilterBaseId = useId();
  const glowFilterBaseId = useId();
  const blurFilterId = useMemo(() => `cloud-blur-${sanitizeId(blurFilterBaseId)}`, [blurFilterBaseId]);
  const glowFilterId = useMemo(() => `cloud-glow-${sanitizeId(glowFilterBaseId)}`, [glowFilterBaseId]);

  const engine = useMemo(
    () =>
      createCloudEngine({
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
        ...(baseAmplitude !== undefined ? { baseAmplitude } : {}),
        ...(baseFrequency !== undefined ? { baseFrequency } : {}),
        ...(layerFrequencyStep !== undefined ? { layerFrequencyStep } : {}),
        ...(secondaryWaveFactor !== undefined ? { secondaryWaveFactor } : {}),
        ...(layerVerticalSpacing !== undefined ? { layerVerticalSpacing } : {}),
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
      layerVerticalSpacing,
    ]
  );

  const initial = useMemo(() => engine.pathsAt(phase, morphT, cycleIndex), [engine, phase, morphT, cycleIndex]);
  const refs = useRef<SVGPathElement[]>([]);
  const glowRefs = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    if (!glow.enabled) {
      glowRefs.current = [];
    }
  }, [glow.enabled]);

  const shouldAnimate = animate && !paused;

  useEffect(() => {
    if (!shouldAnimate) return;
    if (typeof window === 'undefined') return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      const elapsedSec = (t - t0) / 1000;
      const phase = speed * elapsedSec;
      const period = Math.max(0.0001, engine.config.morphPeriodSec);
      const nextMorphT = (elapsedSec / period) % 1;
      const cycleIndex = seamlessLoop ? 0 : Math.floor(elapsedSec / period);
      engine.pathsAt(phase, nextMorphT, cycleIndex).forEach((p, i) => {
        const fillPath = p.d;
        refs.current[i]?.setAttribute('d', fillPath);
        if (glow.enabled) {
          glowRefs.current[i]?.setAttribute('d', fillPath);
        }
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); };
  }, [engine, speed, phase, seamlessLoop, glow.enabled, shouldAnimate]);

  const preserve = fit === 'stretch' ? 'none' : (fit === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet');

  const glowGroupOpacity = glow.enabled ? clamp01(0.45 * glow.intensity) : 0;
  const glowBlur = Math.max(engine.blur * 1.4, 12 * glow.intensity);

  return (
    <svg
      viewBox={`0 0 ${engine.width} ${engine.height}`}
      preserveAspectRatio={preserve}
      width="100%"
      height="100%"
      className={className}
      style={style}
      suppressHydrationWarning
      aria-hidden
    >
      {typeof background === 'string' && (
        <rect x={0} y={0} width="100%" height="100%" fill={background} />
      )}
      <defs>
        <filter
          id={blurFilterId}
          filterUnits="userSpaceOnUse"
          x={-engine.width * 0.2}
          y={-engine.height * 0.2}
          width={engine.width * 1.4}
          height={engine.height * 1.4}
        >
          <feGaussianBlur stdDeviation={engine.blur} />
        </filter>
        {glow.enabled && (
          <filter
            id={glowFilterId}
            filterUnits="userSpaceOnUse"
            x={-engine.width * 0.6}
            y={-engine.height * 0.8}
            width={engine.width * 2.2}
            height={engine.height * 2.6}
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={glowBlur} result="blur" />
            <feComponentTransfer in="blur" result="softGlow">
              <feFuncA type="linear" slope={glowGroupOpacity} />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="softGlow" />
            </feMerge>
          </filter>
        )}
      </defs>
      {glow.enabled && (
        <g
          filter={`url(#${glowFilterId})`}
          style={{ mixBlendMode: additiveBlending ? 'screen' as const : 'lighten' }}
        >
          {initial.map((p, i) => (
            <path
              key={`glow-${i}`}
              ref={el => {
                if (el) glowRefs.current[i] = el;
              }}
              d={p.d}
              fill={shiftHue(p.fill ?? baseColor, glow.hueShift)}
              fillOpacity={clamp01((layerOpacities?.[i] ?? p.opacity ?? 1) * glow.intensity)}
            />
          ))}
        </g>
      )}
      <g filter={`url(#${blurFilterId})`} style={{ mixBlendMode: additiveBlending ? 'screen' as const : 'normal' }}>
        {initial.map((p, i) => (
          <path
            key={i}
            ref={el => { if (el) refs.current[i] = el; }}
            d={p.d}
            fill={p.fill}
            fillOpacity={layerOpacities?.[i] ?? p.opacity}
          />
        ))}
      </g>
    </svg>
  );
};

export default CloudMaker;
