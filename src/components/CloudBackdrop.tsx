"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { createCloudEngine } from '../utils/cloud_maker';

type Props = {
  width?: number;
  height?: number;
  layers?: number;
  segments?: number;
  baseColor?: string;
  layerColors?: string[];
  layerOpacities?: number[];
  speed?: number;   // outward px/s for the traveling wave
  seed?: number;
  blur?: number;
  waveForm?: 'sin' | 'cos' | 'sincos';
  noiseSmoothness?: number;       // 0..1
  amplitudeJitter?: number;       // 0..1
  amplitudeJitterScale?: number;  // 0..1
  additiveBlending?: boolean;     // if true, use additive-like blending for layers
  curveType?: 'linear' | 'spline';
  curveTension?: number;
  peakStability?: number;          // 0..1
  peakNoiseDamping?: number;       // 0..1
  peakNoisePower?: number;         // >=1
  peakHarmonicDamping?: number;    // 0..1
  useSharedBaseline?: boolean;     // prevent checkerboard by aligning fills to common base
  morphStrength?: number;          // 0..1
  morphPeriodSec?: number;         // seconds
  amplitudeEnvelopeStrength?: number; // 0..1
  amplitudeEnvelopeCycles?: number;   // cycles across width
  peakRoundness?: number;             // 0..1
  peakRoundnessPower?: number;        // >=1
  className?: string;
};

const CloudBackdrop: React.FC<Props> = ({
  width = 1440,
  height = 380,
  layers = 7,
  segments = 90,
  baseColor = '#ffffff',
  layerColors = [],
  layerOpacities,
  speed = 60,
  seed = 1337,
  blur = 2.2,
  waveForm = 'sincos',
  noiseSmoothness = 0,
  amplitudeJitter = 0,
  amplitudeJitterScale = 0.25,
  additiveBlending = false,
  curveType = 'spline',
  curveTension = 0.6,
  peakStability = 0,
  peakNoiseDamping = 0,
  peakNoisePower = 2,
  peakHarmonicDamping = 0,
  useSharedBaseline = false,
  morphStrength = 0,
  morphPeriodSec = 12,
  amplitudeEnvelopeStrength = 0.3,
  amplitudeEnvelopeCycles = 4,
  peakRoundness = 0.3,
  peakRoundnessPower = 2,
  className
}) => {
  const engine = useMemo(
    () =>
      createCloudEngine({
        width,
        height,
        layers,
        segments,
        baseColor,
        seed,
        blur,
        waveForm,
        noiseSmoothness,
        amplitudeJitter,
        amplitudeJitterScale,
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
        peakRoundness,
        peakRoundnessPower,
      }),
    [
      width,
      height,
      layers,
      segments,
      baseColor,
      seed,
      blur,
      waveForm,
      noiseSmoothness,
      amplitudeJitter,
      amplitudeJitterScale,
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
      peakRoundness,
      peakRoundnessPower,
    ]
  );

  const initial = useMemo(() => engine.pathsAt(0, 0, 0), [engine]);
  const refs = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      const elapsedSec = (t - t0) / 1000;
      const phase = speed * elapsedSec; // outward motion
      const period = Math.max(0.0001, engine.config.morphPeriodSec);
      const morphT = (elapsedSec / period) % 1;
      const cycleIndex = Math.floor(elapsedSec / period);
      engine.pathsAt(phase, morphT, cycleIndex).forEach((p, i) => refs.current[i]?.setAttribute('d', p.d));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, speed]);

  return (
    <svg
      viewBox={`0 0 ${engine.width} ${engine.height}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      className={className}
      suppressHydrationWarning
      aria-hidden
    >
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
            fill={layerColors?.[i] ?? p.fill}
            fillOpacity={layerOpacities?.[i] ?? (additiveBlending ? Math.max(0.06, (i + 1) / (engine.config.layers || initial.length) * 0.7) : p.opacity)}
          />
        ))}
      </g>
    </svg>
  );
};

export default CloudBackdrop;
