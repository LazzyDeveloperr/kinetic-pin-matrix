# Kinetic Pin Matrix

Interactive 3D pin-matrix simulation built with React, Three.js & TypeScript. A metallic ball rolls across a grid of spring-loaded pistons, physically depressing them into a reactive crater — with adjustable physics, camera views, color themes, and auto-roll choreography patterns.

## Features

- Real-time WebGL rendering (Three.js) with adjustable grid density (32×32 to 46×46+ pistons)
- Configurable spring stiffness, damping, friction, crater depth/radius, and ball material (chrome/gold)
- Auto-roll choreography patterns (figure-8, circle, spiral, Lissajous) or manual drag-to-roll interaction
- Shift-click to trigger a mechanical ripple/shockwave across the matrix
- Multiple camera views (studio/isometric/top) and six color theme presets, including a dark mode
- Live FPS and piston-count stats overlay

View your app in AI Studio: https://ai.studio/apps/121d456f-a01e-427f-9a8b-dcaade938470

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
