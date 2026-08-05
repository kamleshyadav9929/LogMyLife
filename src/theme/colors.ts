import { UserCategory } from '../types';

export type ThemeKey = 'pure_white' | 'slate_light' | 'minimal_white';

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  gradientBg: [string, string, string];
  cardGradient: [string, string];
  buttonGradient: [string, string];
  accentGlow: string;
  background: string;
  surfaceDark: string;
  cardBg: string;
  cardBgLight: string;
  cardBorder: string;
  cardBorderHover: string;
  primary: string;
  primaryLight: string;
  accentCyan: string;
  accentViolet: string;
  warning: string;
  danger: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  mood: {
    energized: string;
    content: string;
    deep_work: string;
    tired: string;
  };
  // Material Design 3 color roles
  surfaceContainer: string;       // Main card / sheet background
  surfaceContainerLow: string;    // Subtle recessed areas
  surfaceContainerHigh: string;   // Elevated card surfaces
  surfaceVariant: string;         // Chip / tag backgrounds
  onSurfaceVariant: string;       // Secondary icon & label color
  primaryContainer: string;       // Tonal button / selected chip bg
  onPrimaryContainer: string;     // Text/icon on primary container
  secondaryContainer: string;     // Tonal FAB / secondary button bg
  onSecondaryContainer: string;   // Text/icon on secondary container
  outline: string;                // Border color for inputs & cards
  outlineVariant: string;         // Subtle divider color
  scrim: string;                  // Modal backdrop scrim
  inverseSurface: string;         // Snackbar / toast background
  inverseOnSurface: string;       // Snackbar / toast text
}

// Helper to get a category's color from the user's dynamic category list
export function getCategoryColor(categories: UserCategory[], categoryId: string): string {
  const cat = categories.find(c => c.id === categoryId);
  return cat?.color || '#64748B';
}

// Helper to get a category's name
export function getCategoryName(categories: UserCategory[], categoryId: string): string {
  const cat = categories.find(c => c.id === categoryId);
  if (cat) return cat.name;
  if (categoryId === 'cat-work') return 'Work & Projects';
  if (categoryId?.startsWith('cat-')) return categoryId.replace('cat-', '');
  return categoryId || '';
}

// Helper function to safely parse hex to RGB
function parseHexColor(color: string): { r: number; g: number; b: number } {
  if (!color || typeof color !== 'string') return { r: 100, g: 116, b: 139 };
  let hex = color.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return { r: 100, g: 116, b: 139 };

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return { r: 100, g: 116, b: 139 };
  return { r, g, b };
}

// Generate a light background color from a hex color (for category card fills)
export function getCategoryLightBg(color: string): string {
  const { r, g, b } = parseHexColor(color);
  const mixR = Math.round(r * 0.12 + 255 * 0.88);
  const mixG = Math.round(g * 0.12 + 255 * 0.88);
  const mixB = Math.round(b * 0.12 + 255 * 0.88);
  return `rgb(${mixR}, ${mixG}, ${mixB})`;
}

// Generate a darker text color from a category's color
export function getCategoryTextColor(color: string): string {
  const { r, g, b } = parseHexColor(color);
  const mixR = Math.max(0, r - 60);
  const mixG = Math.max(0, g - 60);
  const mixB = Math.max(0, b - 60);
  return `rgb(${mixR}, ${mixG}, ${mixB})`;
}

export const WHITE_PALETTE = {
  white: '#FFFFFF',
  lightSurface: '#F8FAFC',
  cardBg: '#FFFFFF',
  borderLight: '#E2E8F0',
  borderMedium: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  blueAccent: '#0F172A',
  purpleAccent: '#7C3AED',
  cyanAccent: '#0EA5E9',
  emeraldAccent: '#10B981',
  coralDanger: '#EF4444',
  amberWarning: '#F59E0B',
};

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  pure_white: {
    key: 'pure_white',
    name: 'Pure White & Slate',
    gradientBg: ['#FFFFFF', '#F8FAFC', '#FFFFFF'],
    cardGradient: ['#FFFFFF', '#F8FAFC'],
    buttonGradient: ['#0F172A', '#1E293B'],
    accentGlow: 'rgba(15, 23, 42, 0.08)',
    background: '#FFFFFF',
    surfaceDark: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBgLight: '#F1F5F9',
    cardBorder: '#E2E8F0',
    cardBorderHover: '#CBD5E1',
    primary: '#0F172A',
    primaryLight: '#0F172A',
    accentCyan: '#0EA5E9',
    accentViolet: '#7C3AED',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    mood: {
      energized: '#F59E0B',
      content: '#10B981',
      deep_work: '#0F172A',
      tired: '#64748B',
    },
    // M3 color roles
    surfaceContainer: '#F3F4F6',
    surfaceContainerLow: '#F8FAFC',
    surfaceContainerHigh: '#ECEEF2',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    primaryContainer: '#E8EAF6',
    onPrimaryContainer: '#1A1B52',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    outline: '#CAC4D0',
    outlineVariant: '#E7E0EC',
    scrim: 'rgba(0,0,0,0.32)',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
  },

  slate_light: {
    key: 'slate_light',
    name: 'Slate Minimal',
    gradientBg: ['#F8FAFC', '#FFFFFF', '#F8FAFC'],
    cardGradient: ['#F8FAFC', '#F1F5F9'],
    buttonGradient: ['#0F172A', '#1E293B'],
    accentGlow: 'rgba(15, 23, 42, 0.08)',
    background: '#FFFFFF',
    surfaceDark: '#F1F5F9',
    cardBg: '#F8FAFC',
    cardBgLight: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardBorderHover: '#94A3B8',
    primary: '#1E293B',
    primaryLight: '#1E293B',
    accentCyan: '#0284C7',
    accentViolet: '#6D28D9',
    warning: '#D97706',
    danger: '#DC2626',
    success: '#059669',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    mood: {
      energized: '#D97706',
      content: '#059669',
      deep_work: '#1E293B',
      tired: '#64748B',
    },
    // M3 color roles
    surfaceContainer: '#EEF0F5',
    surfaceContainerLow: '#F4F6FA',
    surfaceContainerHigh: '#E4E7ED',
    surfaceVariant: '#DCE0E8',
    onSurfaceVariant: '#42484F',
    primaryContainer: '#DCE4F0',
    onPrimaryContainer: '#0E1820',
    secondaryContainer: '#D8E4F0',
    onSecondaryContainer: '#111C28',
    outline: '#BDC5CF',
    outlineVariant: '#DCE0E8',
    scrim: 'rgba(0,0,0,0.32)',
    inverseSurface: '#2A2F35',
    inverseOnSurface: '#EFF0F4',
  },

  minimal_white: {
    key: 'minimal_white',
    name: 'Crisp Light Mode',
    gradientBg: ['#FFFFFF', '#FFFFFF', '#F8FAFC'],
    cardGradient: ['#FFFFFF', '#FFFFFF'],
    buttonGradient: ['#0F172A', '#334155'],
    accentGlow: 'rgba(15, 23, 42, 0.08)',
    background: '#FFFFFF',
    surfaceDark: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBgLight: '#F8FAFC',
    cardBorder: '#E2E8F0',
    cardBorderHover: '#CBD5E1',
    primary: '#0F172A',
    primaryLight: '#0F172A',
    accentCyan: '#0EA5E9',
    accentViolet: '#7C3AED',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    mood: {
      energized: '#F59E0B',
      content: '#10B981',
      deep_work: '#0F172A',
      tired: '#64748B',
    },
    // M3 color roles
    surfaceContainer: '#F5F5F5',
    surfaceContainerLow: '#F9FAFB',
    surfaceContainerHigh: '#EBEBEB',
    surfaceVariant: '#E8E5EC',
    onSurfaceVariant: '#4A4650',
    primaryContainer: '#E8EAF6',
    onPrimaryContainer: '#1A1B52',
    secondaryContainer: '#EDE7F6',
    onSecondaryContainer: '#21005D',
    outline: '#C9C3D0',
    outlineVariant: '#E6E0EB',
    scrim: 'rgba(0,0,0,0.32)',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
  },
};

export const COLORS = THEMES.pure_white;
