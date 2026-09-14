import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Camera,
  Waves,
  Palette,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { MatrixConfig } from '../types.ts';
import { COLOR_THEMES } from '../utils/themes.ts';

interface ControlsOverlayProps {
  config: MatrixConfig;
  onChangeConfig: (newConfig: Partial<MatrixConfig>) => void;
  cameraView: 'video' | 'top' | 'isometric' | 'side';
  onChangeCameraView: (view: 'video' | 'top' | 'isometric' | 'side') => void;
  onResetBall: () => void;
  fps: number;
  pinCount: number;
  onTriggerShockwave: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  config,
  onChangeConfig,
  cameraView,
  onChangeCameraView,
  onResetBall,
  fps,
  pinCount,
  onTriggerShockwave,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const currentTheme = COLOR_THEMES.find((t) => t.id === config.themeId) || COLOR_THEMES[0];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-3 pointer-events-auto">
        {/* Brand & Stats */}
        <div
          id="brand-header"
          className="bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm px-4 py-2.5 rounded-2xl flex items-center gap-3 transition-all"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.7)] animate-pulse" />
          <div>
            <h1 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              Kinetic Pin Matrix
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Interactive 3D
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
              <span>{pinCount.toLocaleString()} pistons</span>
              <span>•</span>
              <span id="live-fps-badge" className={fps >= 55 ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                <span id="live-fps-value">{fps}</span> FPS
              </span>
            </p>
          </div>
        </div>

        {/* Camera & Sound Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Camera View Selector */}
          <div
            id="camera-selector"
            className="bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm p-1 rounded-2xl flex items-center gap-1"
          >
            <span className="text-slate-400 pl-2 pr-1">
              <Camera className="w-3.5 h-3.5" />
            </span>
            <button
              id="cam-video-btn"
              onClick={() => onChangeCameraView('video')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xl transition-colors ${
                cameraView === 'video'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Studio
            </button>
            <button
              id="cam-iso-btn"
              onClick={() => onChangeCameraView('isometric')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xl transition-colors ${
                cameraView === 'isometric'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Iso
            </button>
            <button
              id="cam-top-btn"
              onClick={() => onChangeCameraView('top')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xl transition-colors ${
                cameraView === 'top'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Top
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => onChangeConfig({ soundEnabled: !config.soundEnabled })}
            aria-label={config.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95"
          >
            {config.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </header>

      {/* Floating Theme Drawer (when open) */}
      {showThemes && (
        <div
          id="theme-picker-panel"
          className="pointer-events-auto self-center bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl rounded-3xl p-4 mb-3 max-w-md w-full animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-sky-600" />
              Matrix Color Palettes
            </h3>
            <button
              onClick={() => setShowThemes(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COLOR_THEMES.map((theme) => {
              const isSelected = theme.id === config.themeId;
              return (
                <button
                  key={theme.id}
                  id={`theme-btn-${theme.id}`}
                  onClick={() => {
                    onChangeConfig({ themeId: theme.id });
                    setShowThemes(false);
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-200"
                      style={{ backgroundColor: theme.surfaceColor }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-inner"
                      style={{ backgroundColor: theme.midColor }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-inner"
                      style={{ backgroundColor: theme.deepColor }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-800 truncate">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Fine-Tuning Drawer (when open) */}
      {showSettings && (
        <div
          id="tuning-settings-panel"
          className="pointer-events-auto self-center bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl rounded-3xl p-5 mb-3 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              Kinetic & Physics Parameters
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            {/* Crater Depth */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1.5">
                <span className="font-medium">Crater Depth</span>
                <span className="font-mono text-slate-500">{config.maxDepression.toFixed(1)}</span>
              </div>
              <input
                id="depth-slider"
                type="range"
                min="1.0"
                max="4.5"
                step="0.1"
                value={config.maxDepression}
                onChange={(e) => onChangeConfig({ maxDepression: parseFloat(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Crater Bowl Radius */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1.5">
                <span className="font-medium">Depression Radius</span>
                <span className="font-mono text-slate-500">{config.craterRadius.toFixed(1)}</span>
              </div>
              <input
                id="radius-slider"
                type="range"
                min="3.5"
                max="9.0"
                step="0.2"
                value={config.craterRadius}
                onChange={(e) => onChangeConfig({ craterRadius: parseFloat(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Auto-Roll Speed */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1.5">
                <span className="font-medium">Auto-Roll Speed</span>
                <span className="font-mono text-slate-500">{config.autoRollSpeed.toFixed(1)}x</span>
              </div>
              <input
                id="speed-slider"
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={config.autoRollSpeed}
                onChange={(e) => onChangeConfig({ autoRollSpeed: parseFloat(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Choreography Pattern */}
            <div>
              <span className="text-xs font-medium text-slate-700 block mb-2">
                Auto-Choreography Pattern
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['figure8', 'circle', 'spiral', 'lissajous'] as const).map((pat) => (
                  <button
                    key={pat}
                    id={`pattern-${pat}`}
                    onClick={() => onChangeConfig({ autoRollPattern: pat, autoRoll: true })}
                    className={`px-2 py-1.5 text-xs rounded-xl capitalize font-medium transition-colors ${
                      config.autoRollPattern === pat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pat === 'figure8' ? 'Figure-8' : pat}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Density / Performance */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-2">
                <span className="font-medium">Matrix Grid Density</span>
                <span className="font-mono text-slate-500">
                  {config.gridRows}×{config.gridCols} ({config.gridRows * config.gridCols} pistons)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Fluid (32×32)', rows: 32, cols: 32 },
                  { label: 'Studio (40×40)', rows: 40, cols: 40 },
                  { label: 'Detailed (46×46)', rows: 46, cols: 46 },
                ].map((item) => {
                  const isCurrent = config.gridRows === item.rows;
                  return (
                    <button
                      key={item.label}
                      id={`density-btn-${item.rows}`}
                      onClick={() => onChangeConfig({ gridRows: item.rows, gridCols: item.cols })}
                      className={`px-2.5 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corner Guidance Chip */}
      {showHint && (
        <div
          id="interaction-hint-chip"
          className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-20 pointer-events-auto flex items-center gap-2 bg-slate-900/75 backdrop-blur-md text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md border border-white/10 transition-all hover:bg-slate-900/90"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Drag ball to roll • Shift-click for mechanical wave</span>
          <button
            onClick={() => setShowHint(false)}
            aria-label="Dismiss note"
            className="ml-1 text-slate-400 hover:text-white transition-colors p-0.5 rounded-full"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Bottom Control Dock */}
      <footer className="self-center pointer-events-auto flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-lg px-3 py-2 rounded-full transition-all">
        {/* Play/Pause Auto-Roll */}
        <button
          id="play-pause-btn"
          onClick={() => onChangeConfig({ autoRoll: !config.autoRoll })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 ${
            config.autoRoll
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {config.autoRoll ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Auto-Rolling</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Manual Physics</span>
            </>
          )}
        </button>

        <div className="h-5 w-[1px] bg-slate-200" />

        {/* Pulse Shockwave */}
        <button
          id="shockwave-btn"
          onClick={onTriggerShockwave}
          title="Send kinetic ripple shockwave"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Waves className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline">Pulse Wave</span>
        </button>

        {/* Theme Palette Toggle */}
        <button
          id="theme-toggle-dock-btn"
          onClick={() => {
            setShowThemes(!showThemes);
            setShowSettings(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
            showThemes
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">{currentTheme.name.split(' ')[0]}</span>
          {showThemes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        {/* Settings Sliders Toggle */}
        <button
          id="settings-toggle-dock-btn"
          onClick={() => {
            setShowSettings(!showSettings);
            setShowThemes(false);
          }}
          className={`p-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
            showSettings ? 'bg-slate-100' : ''
          }`}
          title="Adjust matrix parameters"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Reset Ball Position */}
        <button
          id="reset-ball-btn"
          onClick={onResetBall}
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Center ball"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
