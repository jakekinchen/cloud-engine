export type GradientStop = { color: string; pos: number };
export type BackgroundSpec = {
  angle: number; // degrees for linear-gradient
  stops: GradientStop[]; // 0..100 positions
  overlay?: { angle?: number; stops: GradientStop[] };
};

export type PaletteSpec = {
  name: string;
  colors: string[]; // cloud layer colors (front to back)
  opacities?: number[]; // optional per-layer opacities (front to back)
  background?: BackgroundSpec; // complementary gradient for background
  tags?: string[];
};

// Some curated palettes (light, saturated, sunset-like, cool, aurora, glacier)
export const curatedPalettes: Record<string, PaletteSpec> = {
  sunset: {
    name: 'sunset',
    colors: ['#FFF6E9','#FFE3C0','#FFC997','#FFAC71','#FF8B54','#F56C49','#D7504B'],
    opacities: [1,0.92,0.84,0.76,0.68,0.6,0.54],
    background: {
      angle: 180,
      stops: [
        { color: '#0A1124', pos: 0 },
        { color: '#0E1934', pos: 58 },
        { color: '#162247', pos: 100 }
      ],
      overlay: {
        angle: 0,
        stops: [
          { color: '#FFB28833', pos: 0 },
          { color: '#00000000', pos: 55 }
        ]
      }
    },
    tags: ['warm','sunset']
  },
  dusk: {
    name: 'dusk',
    colors: ['#F0E8FF','#E2D4FF','#C9B7FF','#AE9DFF','#8C85F7','#6D74E8','#5662D5'],
    opacities: [1,0.93,0.86,0.79,0.72,0.66,0.6],
    background: {
      angle: 180,
      stops: [
        { color: '#0A0F26', pos: 0 },
        { color: '#121A39', pos: 54 },
        { color: '#1A2450', pos: 100 }
      ],
      overlay: {
        angle: 0,
        stops: [
          { color: '#8D95FF22', pos: 0 },
          { color: '#00000000', pos: 68 }
        ]
      }
    },
    tags: ['twilight','cool-warm']
  },
  aurora: {
    name: 'aurora',
    colors: ['#E7FFF5','#C7FFE9','#97FCD7','#6EF7C5','#4AE6B6','#3BC4A3','#329D8C'],
    opacities: [1,0.92,0.85,0.78,0.71,0.64,0.58],
    background: {
      angle: 180,
      stops: [
        { color: '#07131F', pos: 0 },
        { color: '#0A1C29', pos: 54 },
        { color: '#0B2736', pos: 100 }
      ],
      overlay: {
        angle: 0,
        stops: [
          { color: '#4EE1BF33', pos: 0 },
          { color: '#00000000', pos: 58 }
        ]
      }
    },
    tags: ['cool','aurora']
  },
  rose: {
    name: 'rose',
    colors: ['#FFF0F6','#FFD6E6','#FFBDD4','#FFA6C3','#FF90B4','#FF7BA7','#F26C98'],
    opacities: [1,0.92,0.84,0.77,0.7,0.63,0.57],
    background: {
      angle: 180,
      stops: [
        { color: '#110A1A', pos: 0 },
        { color: '#190E28', pos: 54 },
        { color: '#23133A', pos: 100 }
      ],
      overlay: {
        angle: 0,
        stops: [
          { color: '#FFA1C622', pos: 0 },
          { color: '#00000000', pos: 66 }
        ]
      }
    },
    tags: ['romantic','warm']
  }
};

function parseHex(hex: string) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function rgbToHex(r: number, g: number, b: number) {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Resample a palette to N entries via linear interpolation in RGB
function resampleColors(colors: string[], layers: number): string[] {
  const source = colors.length > 0 ? colors : ['#ffffff'];
  if (source.length === layers) return source.slice();
  if (layers <= 1) return [source[0] ?? '#ffffff'];
  const result: string[] = [];
  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(1, layers - 1);
    const f = t * (source.length - 1);
    const i0 = Math.floor(f);
    const i1 = Math.min(source.length - 1, i0 + 1);
    const tt = f - i0;
    const c0 = parseHex(source[i0] ?? source[0] ?? '#ffffff');
    const c1 = parseHex(source[i1] ?? source[i0] ?? source[0] ?? '#ffffff');
    result.push(
      rgbToHex(
        lerp(c0.r, c1.r, tt),
        lerp(c0.g, c1.g, tt),
        lerp(c0.b, c1.b, tt)
      )
    );
  }
  return result;
}

export type GetPaletteOptions = {
  reverse?: boolean;
  opacityScale?: number; // multiply opacities
};

export function getPalette(name: string, layers: number, opts: GetPaletteOptions = {}) {
  const spec = curatedPalettes[name] ?? curatedPalettes.sunset!;
  const colors = resampleColors(spec.colors, layers);
  if (opts.reverse) colors.reverse();
  const op = spec.opacities ? resampleColors(spec.opacities.map(x => `#${Math.round((+x * 255)).toString(16).padStart(2,'0').repeat(3)}`), layers)
    : null;
  let opacities: number[] | undefined;
  if (op) {
    // convert back by reading red channel as opacity
    opacities = op.map(hex => parseInt(hex.slice(1,3), 16) / 255);
  } else {
    opacities = Array.from({ length: layers }, (_, i) => Math.max(0, +(1 - i * 0.12).toFixed(2)));
  }
  const s = Math.max(0, opts.opacityScale ?? 1);
  opacities = opacities.map(v => Math.max(0, Math.min(1, v * s)));
  return { colors, opacities };
}

export const paletteNames = Object.keys(curatedPalettes);

export function gradientToCSS(bg: BackgroundSpec) {
  const mk = (b: BackgroundSpec) => `linear-gradient(${b.angle}deg, ${b.stops.map(s => `${s.color} ${s.pos}%`).join(', ')})`;
  const base = mk(bg);
  if (!bg.overlay) return base;
  const ov = mk({ angle: bg.overlay.angle ?? bg.angle, stops: bg.overlay.stops });
  return `${ov}, ${base}`;
}

// ---------- Color adjustment utilities ----------

type HSL = { h: number; s: number; l: number };
function hexToHsl(hex: string): HSL {
  const { r, g, b } = parseHex(hex);
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  let h = 0, s = 0; const l = (max + min) / 2;
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
}
function hslToHex({ h, s, l }: HSL): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const col = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return col * 255;
  };
  return `#${c(f(0))}${c(f(8))}${c(f(4))}`;
}

export type ThemeAdjust = {
  hueShiftDeg?: number;            // -180..180
  saturationScale?: number;        // multiply
  lightnessShift?: number;         // -1..1 add to l
  contrast?: number;               // -1..1 (simple curve)
  alternateLayerHueDelta?: number; // degrees applied to every other layer
  alternateLayerSaturationScale?: number; // multiply for every other layer
};

function applyAdjust(hex: string, adj: ThemeAdjust): string {
  const hsl = hexToHsl(hex);
  if (adj.hueShiftDeg) hsl.h = (hsl.h + adj.hueShiftDeg + 360) % 360;
  if (adj.saturationScale) hsl.s = Math.max(0, Math.min(1, hsl.s * adj.saturationScale));
  if (adj.lightnessShift) hsl.l = Math.max(0, Math.min(1, hsl.l + adj.lightnessShift));
  if (typeof adj.contrast === 'number' && adj.contrast !== 0) {
    const c = Math.max(-1, Math.min(1, adj.contrast));
    const pivot = 0.5;
    hsl.l = Math.max(0, Math.min(1, pivot + (hsl.l - pivot) * (1 + c * 1.5)));
  }
  return hslToHex(hsl);
}

function adjustColors(colors: string[], adj: ThemeAdjust, layers: number): string[] {
  const out = colors.map((c, i) => {
    const a: ThemeAdjust = { ...adj };
    if (adj.alternateLayerHueDelta && i % 2 === 1) a.hueShiftDeg = (a.hueShiftDeg ?? 0) + adj.alternateLayerHueDelta;
    if (adj.alternateLayerSaturationScale && i % 2 === 1) a.saturationScale = (a.saturationScale ?? 1) * adj.alternateLayerSaturationScale;
    return applyAdjust(c, a);
  });
  return resampleColors(out, layers);
}

function adjustBackgroundCSS(bg: BackgroundSpec | undefined, adj: ThemeAdjust): string | undefined {
  if (!bg) return undefined;
  const tweak = (c: string) => applyAdjust(c, adj);
  const overlay = bg.overlay
    ? {
        ...(bg.overlay.angle !== undefined ? { angle: bg.overlay.angle } : {}),
        stops: bg.overlay.stops.map(s => ({ color: tweak(s.color), pos: s.pos })),
      }
    : undefined;
  const baseWithoutOverlay: BackgroundSpec = {
    angle: bg.angle,
    stops: bg.stops.map(s => ({ color: tweak(s.color), pos: s.pos })),
  };
  const base: BackgroundSpec = overlay
    ? { ...baseWithoutOverlay, overlay }
    : baseWithoutOverlay;
  return gradientToCSS(base);
}

export function getThemePalette(name: string, layers: number, opts: GetPaletteOptions = {}, adjust?: ThemeAdjust) {
  const spec = curatedPalettes[name] ?? curatedPalettes.sunset;
  const { colors, opacities } = getPalette(name, layers, opts);
  const adjustedColors = adjust ? adjustColors(colors, adjust, layers) : colors;
  const backgroundCSS = spec?.background ? (adjust ? adjustBackgroundCSS(spec.background, adjust) : gradientToCSS(spec.background)) : undefined;
  return { colors: adjustedColors, opacities, backgroundCSS, spec };
}

export function interpolateThemePalettes(
  fromName: string, 
  toName: string, 
  t: number, 
  layers: number, 
  opts: GetPaletteOptions = {}, 
  adjust?: ThemeAdjust
) {
  const fromPalette = getThemePalette(fromName, layers, opts, adjust);
  const toPalette = getThemePalette(toName, layers, opts, adjust);
  
  const interpolatedColors = fromPalette.colors.map((fromColor, i) => {
    const toColor = toPalette.colors[i] ?? toPalette.colors[toPalette.colors.length - 1] ?? '#ffffff';
    const a = hexToHsl(fromColor);
    const b = hexToHsl(toColor);
    const dh = ((b.h - a.h + 540) % 360) - 180; // shortest hue path
    const h = (a.h + dh * t + 360) % 360;
    const s = lerp(a.s, b.s, t);
    const l = lerp(a.l, b.l, t);
    return hslToHex({ h, s, l });
  });
  
  const interpolatedOpacities = fromPalette.opacities.map((fromOpacity, i) => 
    lerp(fromOpacity, toPalette.opacities[i] ?? toPalette.opacities[toPalette.opacities.length - 1] ?? fromOpacity, t)
  );
  
  return {
    colors: interpolatedColors,
    opacities: interpolatedOpacities,
    backgroundCSS: fromPalette.backgroundCSS,
    spec: fromPalette.spec
  };
}


