"use client";

import React from 'react';

type IconProps = { size?: number; color?: string; className?: string };

const Svg: React.FC<React.PropsWithChildren<IconProps>> = ({ size = 16, color = 'currentColor', className, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke={color}
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const WaveIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M2 12c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4"/></Svg>
);
export const LayersIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 3l8 4-8 4-8-4 8-4z"/><path d="M4 11l8 4 8-4"/></Svg>
);
export const SegmentsIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14"/></Svg>
);
export const HeightIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 3v18"/><path d="M8 7l4-4 4 4M8 17l4 4 4-4"/></Svg>
);
export const SpeedIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><path d="M13 13l4-4"/></Svg>
);
export const BlurIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="7"/><path d="M5 12h14" opacity=".6"/><path d="M7 9h10" opacity=".4"/><path d="M9 6h6" opacity=".2"/></Svg>
);
export const NoiseIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M3 12h2l2-4 2 8 2-10 2 12 2-6 2 0 2 0"/></Svg>
);
export const CurveIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M4 18c6-12 10-12 16 0"/></Svg>
);
export const ToggleIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="9" cy="12" r="3"/></Svg>
);
export const PaletteIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 0-6h-1"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="9.5" cy="6.5" r="1"/><circle cx="14.5" cy="6.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></Svg>
);
export const BaselineIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M3 18h18"/><path d="M5 12c3 0 3-4 6-4s3 4 6 4 3-4 6-4"/></Svg>
);
export const SeedIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M12 3c-4.5 5 4.5 7 0 12-4.5-5 4.5-7 0-12z"/><circle cx="12" cy="12" r="8" opacity=".2"/></Svg>
);

export const Icon = {
  wave: WaveIcon,
  layers: LayersIcon,
  segments: SegmentsIcon,
  height: HeightIcon,
  speed: SpeedIcon,
  blur: BlurIcon,
  noise: NoiseIcon,
  curve: CurveIcon,
  toggle: ToggleIcon,
  palette: PaletteIcon,
  baseline: BaselineIcon,
  seed: SeedIcon,
};

export default Icon;




