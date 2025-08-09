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
    background?: false | string;
};
declare const CloudMaker: React.FC<CloudMakerProps>;

declare function createCloudEngine(opts?: {}): {
    pathsAt: (phase?: number, morphT?: number, cycleIndex?: number) => {
        d: string;
        fill: string | undefined;
        opacity: number;
    }[];
    svgAt: (phase?: number) => string;
    width: number;
    height: number;
    blur: number;
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
        blur: number;
        seed: number;
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
    };
};

var width = 800;
var height = 458;
var layers = 6;
var segments = 450;
var baseColor = "#ffffff";
var speed = 34;
var seed = 1337;
var blur = 0;
var waveForm = "sincos";
var noiseSmoothness = 0.45;
var amplitudeJitter = 0;
var amplitudeJitterScale = 0.25;
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
var peakRoundness = 0.8;
var peakRoundnessPower = 10;
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
	peakRoundness: peakRoundness,
	peakRoundnessPower: peakRoundnessPower,
	staticPeaks: staticPeaks,
	sunsetMode: sunsetMode,
	sunsetPeriodSec: sunsetPeriodSec,
	paletteIndex: paletteIndex,
	hueShift: hueShift,
	saturation: saturation,
	lightness: lightness,
	contrast: contrast,
	altHueDelta: altHueDelta,
	altSatScale: altSatScale
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
    useSharedBaseline: boolean;
    morphStrength: number;
    morphPeriodSec: number;
    amplitudeEnvelopeStrength: number;
    amplitudeEnvelopeCycles: number;
    peakRoundness: number;
    peakRoundnessPower: number;
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
        waveForm: "sincos";
        noiseSmoothness: number;
        amplitudeJitter: number;
        amplitudeJitterScale: number;
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
