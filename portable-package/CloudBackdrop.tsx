"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { createCloudEngine } from './cloud_maker';

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
  waveForm?: 'sin' | 'cos' | 'sincos';
  noiseSmoothness?: number;
  amplitudeJitter?: number;
  amplitudeJitterScale?: number;
  additiveBlending?: boolean;
  curveType?: 'linear' | 'spline';
  curveTension?: number;
  peakStability?: number;
  peakNoiseDamping?: number;
  peakNoisePower?: number;
  peakHarmonicDamping?: number;
  useSharedBaseline?: boolean;
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
};

const CloudMaker: React.FC<CloudMakerProps> = ({
  width = 1200,
  height = 380,
  layers = 7,
  segments = 450,
  baseColor = '#ffffff',
  layerColors = [],
  layerOpacities,
  speed = 60,
  seed = 1337,
  blur = 2.2,
  waveForm = 'sincos',
  noiseSmoothness = 0.45,
  amplitudeJitter = 0,
  amplitudeJitterScale = 0.25,
  additiveBlending = false,
  curveType = 'spline',
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
  seamlessLoop = true,
  animate = true,
  phase = 0,
  morphT = 0,
  cycleIndex = 0,
  className,
  style,
  fit = 'stretch',
  background = false
}) => {
  const engine = useMemo(
    () => createCloudEngine({ width, height, layers, segments, baseColor, layerColors, layerOpacities, seed, blur, waveForm, noiseSmoothness, amplitudeJitter, amplitudeJitterScale, curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, peakRoundness, peakRoundnessPower }),
    [width, height, layers, segments, baseColor, layerColors, layerOpacities, seed, blur, waveForm, noiseSmoothness, amplitudeJitter, amplitudeJitterScale, curveType, curveTension, peakStability, peakNoiseDamping, peakNoisePower, peakHarmonicDamping, useSharedBaseline, morphStrength, morphPeriodSec, amplitudeEnvelopeStrength, amplitudeEnvelopeCycles, peakRoundness, peakRoundnessPower]
  );

  const initial = useMemo(() => engine.pathsAt(phase, morphT, cycleIndex), [engine, phase, morphT, cycleIndex]);
  const refs = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    if (!animate) return;
    if (typeof window === 'undefined') return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      const elapsedSec = (t - t0) / 1000;
      const phase = speed * elapsedSec;
      const period = Math.max(0.0001, engine.config.morphPeriodSec);
      const morphT = (elapsedSec / period) % 1;
      const cycleIndex = seamlessLoop ? 0 : Math.floor(elapsedSec / period);
      engine.pathsAt(phase, morphT, cycleIndex).forEach((p, i) => refs.current[i]?.setAttribute('d', p.d));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, speed, animate, seamlessLoop]);

  const preserve = fit === 'stretch' ? 'none' : (fit === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet');

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
        <filter id="cloud-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={engine.blur} />
        </filter>
      </defs>
      <g filter="url(#cloud-blur)" style={{ mixBlendMode: additiveBlending ? 'screen' as const : 'normal' }}>
        {initial.map((p, i) => (
          <path
            key={i}
            ref={el => { if (el) refs.current[i] = el; }}
            d={p.d}
            fill={p.fill}
            fillOpacity={layerOpacities?.[i] ?? (additiveBlending ? Math.max(0.06, (i + 1) / (engine.config.layers || initial.length) * 0.7) : p.opacity)}
          />
        ))}
      </g>
    </svg>
  );
};

export default CloudMaker;


