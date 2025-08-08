import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'src', 'config', 'cloudDefaults.json');

export async function GET() {
  try {
    const json = await fs.readFile(FILE_PATH, 'utf8');
    return NextResponse.json(JSON.parse(json), { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to read defaults' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // Whitelist shallow merge to avoid arbitrary writes
    const allowedKeys = new Set([
      'width','height','layers','segments','baseColor','speed','seed','blur','waveForm','noiseSmoothness','amplitudeJitter','amplitudeJitterScale','additiveBlending','curveType','curveTension','peakStability','peakNoiseDamping','peakNoisePower','peakHarmonicDamping','useSharedBaseline','morphStrength','morphPeriodSec','amplitudeEnvelopeStrength','amplitudeEnvelopeCycles','peakRoundness','peakRoundnessPower','staticPeaks','sunsetMode','sunsetPeriodSec','paletteIndex','hueShift','saturation','lightness','contrast','altHueDelta','altSatScale'
    ]);

    const current = JSON.parse(await fs.readFile(FILE_PATH, 'utf8'));
    const next: Record<string, unknown> = { ...current };
    for (const [k, v] of Object.entries(body || {})) {
      if (allowedKeys.has(k)) next[k] = v as unknown;
    }
    const pretty = JSON.stringify(next, null, 2) + '\n';
    await fs.writeFile(FILE_PATH, pretty, 'utf8');
    return NextResponse.json(next, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to write defaults' }, { status: 500 });
  }
}



