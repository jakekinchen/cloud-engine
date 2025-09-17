import React from 'react';

type CloudMakerProps = {
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
    background?: false | string;
    motionAngleDeg?: number;
    periodicAngleDeg?: number;
    paused?: boolean;
    glowEnabled?: boolean;
    glowIntensity?: number;
    glowHueShift?: number;
};
declare const CloudMaker: React.FC<CloudMakerProps>;

declare function createCloudEngine(opts?: {}): {
    pathsAt: (phase?: number, morphT?: number, cycleIndex?: number) => {
        d: string;
        topPath: string;
        fill: string | undefined;
        opacity: any;
    }[];
    svgAt: (phase?: number) => string;
    width: number;
    height: number;
    blur: number;
    opacityRamp: any[];
    config: {
        width: number;
        height: number;
        layers: number;
        segments: number;
        baseAmplitude: number;
        baseFrequency: number;
        baseRandom: number;
        layerAmplitudeStep: number;
        layerFrequencyStep: number;
        layerRandomStep: number;
        layerVerticalSpacing: number;
        secondaryWaveFactor: number;
        baseColor: string;
        layerColors: never[];
        layerOpacities: undefined;
        blur: number;
        seed: number;
        backOpacity: number;
        frontOpacity: number;
        opacityCurvePower: number;
        waveForm: string;
        noiseSmoothness: number;
        amplitudeJitter: number;
        amplitudeJitterScale: number;
        curveType: string;
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
        amplitudeLayerCycleVariance: number;
        motionAngleDeg: number;
        periodicAngleDeg: number;
    };
};

var width = 800;
var height = 458;
var layers = 5;
var segments = 450;
var baseColor = "#ffffff";
var speed = 34;
var seed = 1337;
var blur = 0;
var waveForm = "round";
var noiseSmoothness = 0.45;
var amplitudeJitter = 0;
var amplitudeJitterScale = 0.25;
var backOpacity = 0.12;
var frontOpacity = 0.96;
var opacityCurvePower = 2.4;
var additiveBlending = false;
var curveType = "spline";
var curveTension = 0.85;
var peakStability = 1;
var peakNoiseDamping = 1;
var peakNoisePower = 4;
var peakHarmonicDamping = 1;
var useSharedBaseline = true;
var morphStrength = 0;
var morphPeriodSec = 18;
var amplitudeEnvelopeStrength = 0.36;
var amplitudeEnvelopeCycles = 2;
var staticPeaks = true;
var sunsetMode = true;
var sunsetPeriodSec = 12;
var paletteIndex = 4;
var hueShift = 0;
var saturation = 1;
var lightness = 0.02;
var contrast = 0.04;
var altHueDelta = -30;
var altSatScale = 1.41;
var motionAngleDeg = 0;
var periodicAngleDeg = 0;
var glowEnabled = false;
var glowIntensity = 1;
var glowHueShift = 180;
var cloudDefaults = {
	width: width,
	height: height,
	layers: layers,
	segments: segments,
	baseColor: baseColor,
	speed: speed,
	seed: seed,
	blur: blur,
	waveForm: waveForm,
	noiseSmoothness: noiseSmoothness,
	amplitudeJitter: amplitudeJitter,
	amplitudeJitterScale: amplitudeJitterScale,
	backOpacity: backOpacity,
	frontOpacity: frontOpacity,
	opacityCurvePower: opacityCurvePower,
	additiveBlending: additiveBlending,
	curveType: curveType,
	curveTension: curveTension,
	peakStability: peakStability,
	peakNoiseDamping: peakNoiseDamping,
	peakNoisePower: peakNoisePower,
	peakHarmonicDamping: peakHarmonicDamping,
	useSharedBaseline: useSharedBaseline,
	morphStrength: morphStrength,
	morphPeriodSec: morphPeriodSec,
	amplitudeEnvelopeStrength: amplitudeEnvelopeStrength,
	amplitudeEnvelopeCycles: amplitudeEnvelopeCycles,
	staticPeaks: staticPeaks,
	sunsetMode: sunsetMode,
	sunsetPeriodSec: sunsetPeriodSec,
	paletteIndex: paletteIndex,
	hueShift: hueShift,
	saturation: saturation,
	lightness: lightness,
	contrast: contrast,
	altHueDelta: altHueDelta,
	altSatScale: altSatScale,
	motionAngleDeg: motionAngleDeg,
	periodicAngleDeg: periodicAngleDeg,
	glowEnabled: glowEnabled,
	glowIntensity: glowIntensity,
	glowHueShift: glowHueShift
};

type CloudConfig = Partial<{
    width: number;
    height: number;
    layers: number;
    segments: number;
    baseColor: string;
    layerColors: string[];
    layerOpacities: number[];
    seed: number;
    blur: number;
    waveForm: 'sin' | 'cos' | 'sincos' | 'round';
    noiseSmoothness: number;
    amplitudeJitter: number;
    amplitudeJitterScale: number;
    backOpacity: number;
    frontOpacity: number;
    opacityCurvePower: number;
    curveType: 'linear' | 'spline';
    curveTension: number;
    peakStability: number;
    peakNoiseDamping: number;
    peakNoisePower: number;
    peakHarmonicDamping: number;
    useSharedBaseline: boolean;
    baseAmplitude: number;
    baseFrequency: number;
    layerFrequencyStep: number;
    secondaryWaveFactor: number;
    layerVerticalSpacing: number;
    morphStrength: number;
    morphPeriodSec: number;
    amplitudeEnvelopeStrength: number;
    amplitudeEnvelopeCycles: number;
    peakRoundness: number;
    peakRoundnessPower: number;
    motionAngleDeg: number;
    periodicAngleDeg: number;
    glowEnabled: boolean;
    glowIntensity: number;
    glowHueShift: number;
}>;
declare function renderSvg(config?: CloudConfig, opts?: {
    phase?: number;
    morphT?: number;
    cycleIndex?: number;
}): any;
declare const presets: {
    default: {
        width: number;
        height: number;
        layers: number;
        segments: number;
        baseColor: string;
        seed: number;
        blur: number;
        waveForm: "round";
        noiseSmoothness: number;
        amplitudeJitter: number;
        amplitudeJitterScale: number;
        backOpacity: number;
        frontOpacity: number;
        opacityCurvePower: number;
        curveType: "spline";
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
    };
};

export { type CloudConfig, CloudMaker, type CloudMakerProps, cloudDefaults, createCloudEngine, presets, renderSvg };
