# CloudEngine (package) + Demo App
(https://github.com/jakekinchen/cloud-engine)

## Installation

```bash
npm install cloud-engine
```

Or with yarn:
```bash
yarn add cloud-engine
```

Or with pnpm:
```bash
pnpm add cloud-engine
```

This repo contains a Next.js demo and a publishable package `cloud-engine` that provides:
- React component: `CloudMaker`
- Headless engine: `createCloudEngine`
- Helper: `renderSvg`

## Quick Start - New Project Setup

Here's how to integrate CloudEngine into a new React project:

### 1. Create a new React project

```bash
npx create-react-app my-cloud-app
cd my-cloud-app
npm install cloud-engine
```

### 2. Create a CloudHero component

```tsx
// src/components/CloudHero.tsx
import React from 'react';
import { CloudMaker } from 'cloud-engine';

interface CloudHeroProps {
  width?: number;
  height?: number;
  className?: string;
}

export const CloudHero: React.FC<CloudHeroProps> = ({
  width = 1920,
  height = 600,
  className = ''
}) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: height,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      }}
    >
      <CloudMaker
        width={width}
        height={height}
        layers={8}
        baseColor="#e0f2fe"
        seed={42} // Consistent clouds across renders
        speed={40}
        blur={3.0}
        waveForm="round"
        noiseSmoothness={0.6}
        amplitudeJitter={0.1}
        curveType="spline"
        curveTension={0.8}
        peakStability={0.9}
        morphStrength={0.3}
        morphPeriodSec={15}
        amplitudeEnvelopeStrength={0.8}
        amplitudeEnvelopeCycles={6}
        peakRoundness={0.7}
        peakRoundnessPower={8}
        layerColors={[
          '#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1',
          '#94a3b8', '#64748b', '#475569', '#334155'
        ]}
        layerOpacities={[0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]}
        animate={true}
        seamlessLoop={true}
        background="#0f172a"
        fit="stretch"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {/* Your content overlay */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Welcome</h1>
          <p className="text-xl opacity-90">Beautiful animated clouds</p>
        </div>
      </div>
    </div>
  );
};
```

### 3. Use it in your App

```tsx
// src/App.tsx
import React from 'react';
import { CloudHero } from './components/CloudHero';

function App() {
  return (
    <div className="App">
      <CloudHero height={800} />
      <main className="p-8">
        <h2>Your content here</h2>
        <p>The cloud animation runs independently in the background.</p>
      </main>
    </div>
  );
}

export default App;
```

### 4. Run your project

```bash
npm start
```

This gives you a fully configured cloud background with all the visual settings optimized for a hero section.

## Screenshots

![Screenshot 1](./screenshot1.png)
![Screenshot 2](./screenshot2.png)
![Screenshot 3](./screenshot3.png)

## Package usage (React)

### Basic Usage

```tsx
import { CloudMaker } from 'cloud-engine';

export default function Hero() {
  return (
    <div style={{ width: '100%', height: 380 }}>
      <CloudMaker
        width={1200}
        height={380}
        layers={7}
        style={{ width: '100%', height: '100%' }}
        fit="stretch"
        background={false}
      />
    </div>
  );
}
```

### Advanced Usage with All Settings

```tsx
import { CloudMaker, presets } from 'cloud-engine';

export default function CustomCloudHero() {
  // Start with the default preset and override specific settings
  const cloudSettings = {
    ...presets.default,
    // Override specific settings
    width: 1920,
    height: 600,
    layers: 8,
    baseColor: '#e0f2fe', // Light blue base
    seed: 42, // Deterministic seed for consistent clouds
    speed: 40, // Animation speed
    blur: 3.0, // More blur for softer look
    waveForm: 'round' as const,
    noiseSmoothness: 0.6,
    amplitudeJitter: 0.1,
    curveType: 'spline' as const,
    curveTension: 0.8,
    peakStability: 0.9,
    morphStrength: 0.3,
    morphPeriodSec: 15,
    amplitudeEnvelopeStrength: 0.8,
    amplitudeEnvelopeCycles: 6,
    peakRoundness: 0.7,
    peakRoundnessPower: 8,
    // Layer-specific colors (optional - will use baseColor if not provided)
    layerColors: [
      '#ffffff', // Top layer - pure white
      '#f8fafc', // Second layer - very light gray
      '#e2e8f0', // Third layer
      '#cbd5e1', // Fourth layer
      '#94a3b8', // Fifth layer
      '#64748b', // Sixth layer
      '#475569', // Seventh layer
      '#334155', // Bottom layer - darker
    ],
    // Custom opacity for each layer (optional)
    layerOpacities: [
      0.9,  // Top layer - most opaque
      0.8,
      0.7,
      0.6,
      0.5,
      0.4,
      0.3,
      0.2,  // Bottom layer - least opaque
    ],
    // Animation settings
    animate: true,
    seamlessLoop: true,
    // Styling
    background: '#0f172a', // Dark navy background
    fit: 'stretch' as const,
  };

  return (
    <div style={{
      width: '100%',
      height: 600,
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      <CloudMaker
        {...cloudSettings}
        style={{ width: '100%', height: '100%' }}
        className="hero-clouds"
      />
    </div>
  );
}
```

### Using Presets

```tsx
import { CloudMaker, presets } from 'cloud-engine';

// Use the built-in default preset
export function DefaultClouds() {
  return (
    <CloudMaker
      {...presets.default}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Extend a preset with custom settings
export function SunsetClouds() {
  return (
    <CloudMaker
      {...presets.default}
      baseColor="#ff6b35" // Orange sunset color
      layerColors={['#ff8c42', '#ff6b35', '#e85d75', '#c05867']}
      background="#2d1b69" // Deep purple background
      morphStrength={0.5}
      morphPeriodSec={20}
    />
  );
}
```

## Package usage (Headless)

```ts
import { renderSvg, createCloudEngine } from 'cloud-engine';

// Simple usage - render SVG at default state
const svg = renderSvg({ width: 1200, height: 380, layers: 7, seed: 1337 });

// Advanced usage - control animation phase
const svgAtPhase = renderSvg(
  {
    width: 1200,
    height: 380,
    layers: 8,
    baseColor: '#ffffff',
    seed: 1337,
    morphStrength: 0.5,
    morphPeriodSec: 15,
  },
  {
    phase: 100,      // Animation phase (affects wave movement)
    morphT: 0.3,     // Morph progression (0-1)
    cycleIndex: 0,   // Which morph cycle to show
  }
);

// For more control, use the engine directly
const engine = createCloudEngine({
  width: 1200,
  height: 380,
  layers: 8,
  baseColor: '#ffffff',
  seed: 1337,
});

// Get SVG at specific animation state
const svgString = engine.svgAt(100, 0.3, 0); // phase, morphT, cycleIndex

// Get path data for manual rendering
const paths = engine.pathsAt(100, 0.3, 0); // Returns array of path objects
```

## Develop the demo

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view.

## Build and publish the package

```bash
cd portable-package
npm run build
# optional version bump
npm version patch
npm publish --access public
```
