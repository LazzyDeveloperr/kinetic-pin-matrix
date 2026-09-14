export interface ColorStop {
  stop: number; // 0 to 1
  color: string; // hex
}

export interface ColorTheme {
  id: string;
  name: string;
  surfaceColor: string; // pin at 0 depth
  rimColor: string; // pin at shallow depth
  midColor: string; // pin at medium depth
  deepColor: string; // pin at deep crater
  backgroundColor: string;
  ballMaterial: 'chrome' | 'gold' | 'matte-white' | 'iridescent';
}

export interface MatrixConfig {
  gridRows: number;
  gridCols: number;
  cylinderRadius: number;
  cylinderHeight: number;
  spacingFactor: number;
  ballRadius: number;
  maxDepression: number;
  craterRadius: number;
  springStiffness: number;
  springDamping: number;
  friction: number;
  themeId: string;
  autoRoll: boolean;
  autoRollSpeed: number;
  autoRollPattern: 'figure8' | 'circle' | 'spiral' | 'lissajous';
  soundEnabled: boolean;
}
