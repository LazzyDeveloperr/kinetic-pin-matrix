/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { PinMatrixCanvas } from './components/PinMatrixCanvas.tsx';
import { ControlsOverlay } from './components/ControlsOverlay.tsx';
import { MatrixConfig } from './types.ts';

const DEFAULT_CONFIG: MatrixConfig = {
  gridRows: 40,
  gridCols: 40,
  cylinderRadius: 0.46,
  cylinderHeight: 4.5,
  spacingFactor: 1.05,
  ballRadius: 1.35,
  maxDepression: 2.6,
  craterRadius: 6.2,
  springStiffness: 60,
  springDamping: 0.88,
  friction: 0.985,
  themeId: 'cerulean-crater',
  autoRoll: true,
  autoRollSpeed: 1.0,
  autoRollPattern: 'figure8',
  soundEnabled: false,
};

export default function App() {
  const [config, setConfig] = useState<MatrixConfig>(DEFAULT_CONFIG);
  const [cameraView, setCameraView] = useState<'video' | 'top' | 'isometric' | 'side'>('video');
  const [fps, setFps] = useState<number>(60);
  const [pinCount, setPinCount] = useState<number>(1600);
  const [canvasKey, setCanvasKey] = useState<number>(0);

  const handleConfigChange = (newValues: Partial<MatrixConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...newValues };
      if (
        (newValues.gridRows !== undefined && newValues.gridRows !== prev.gridRows) ||
        (newValues.gridCols !== undefined && newValues.gridCols !== prev.gridCols)
      ) {
        setCanvasKey((k) => k + 1);
        setPinCount((newValues.gridRows ?? prev.gridRows) * (newValues.gridCols ?? prev.gridCols));
      }
      return next;
    });
  };

  const handleStatsUpdate = useCallback((currFps: number, count: number) => {
    const fpsVal = document.getElementById('live-fps-value');
    if (fpsVal) fpsVal.textContent = `${currFps}`;
    const badge = document.getElementById('live-fps-badge');
    if (badge) {
      badge.className = currFps >= 55 ? 'text-emerald-600 font-medium' : 'text-amber-600';
    }
  }, []);

  const handleResetBall = useCallback(() => {
    // Re-mount canvas to smoothly reset ball position and physics
    setCanvasKey((k) => k + 1);
  }, []);

  const handleTriggerShockwave = useCallback(() => {
    // Send simulated keyboard or mouse event to canvas wrapper or re-trigger
    const container = document.getElementById('pin-matrix-three-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const event = new MouseEvent('contextmenu', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
      });
      container.dispatchEvent(event);
    }
  }, []);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-slate-100 font-sans"
      id="kinetic-pin-matrix-app"
    >
      {/* 3D WebGL Three.js Canvas */}
      <PinMatrixCanvas
        key={canvasKey}
        config={config}
        cameraView={cameraView}
        onStatsUpdate={handleStatsUpdate}
      />

      {/* Floating Modern UI Overlay */}
      <ControlsOverlay
        config={config}
        onChangeConfig={handleConfigChange}
        cameraView={cameraView}
        onChangeCameraView={setCameraView}
        onResetBall={handleResetBall}
        fps={fps}
        pinCount={pinCount}
        onTriggerShockwave={handleTriggerShockwave}
      />
    </main>
  );
}
