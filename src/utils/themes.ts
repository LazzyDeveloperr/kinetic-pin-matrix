import { ColorTheme } from '../types.ts';

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'cerulean-crater',
    name: 'Cerulean (Original)',
    surfaceColor: '#E2E6EA',
    rimColor: '#7DD3FC',
    midColor: '#0284C7',
    deepColor: '#0369A1',
    backgroundColor: '#EDF1F5',
    ballMaterial: 'chrome',
  },
  {
    id: 'ultramarine-depths',
    name: 'Electric Cobalt',
    surfaceColor: '#E8ECF2',
    rimColor: '#818CF8',
    midColor: '#4F46E5',
    deepColor: '#312E81',
    backgroundColor: '#EEF2F6',
    ballMaterial: 'chrome',
  },
  {
    id: 'emerald-abyss',
    name: 'Emerald Lagoon',
    surfaceColor: '#E5EAE7',
    rimColor: '#6EE7B7',
    midColor: '#059669',
    deepColor: '#064E3B',
    backgroundColor: '#EDF4F0',
    ballMaterial: 'chrome',
  },
  {
    id: 'neon-amethyst',
    name: 'Neon Amethyst',
    surfaceColor: '#EDE8F2',
    rimColor: '#F472B6',
    midColor: '#C026D3',
    deepColor: '#701A75',
    backgroundColor: '#F3EEF6',
    ballMaterial: 'chrome',
  },
  {
    id: 'sunset-ember',
    name: 'Solar Ember',
    surfaceColor: '#ECE7E4',
    rimColor: '#FDBA74',
    midColor: '#EA580C',
    deepColor: '#9A3412',
    backgroundColor: '#F4EFEA',
    ballMaterial: 'gold',
  },
  {
    id: 'cyber-dark',
    name: 'Cyber Obsidian',
    surfaceColor: '#2D333B',
    rimColor: '#22D3EE',
    midColor: '#0284C7',
    deepColor: '#0369A1',
    backgroundColor: '#1E2228',
    ballMaterial: 'chrome',
  }
];

export function getTheme(id: string): ColorTheme {
  return COLOR_THEMES.find((t) => t.id === id) || COLOR_THEMES[0];
}
