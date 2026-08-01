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
}

// Helper to get a category's color from the user's dynamic category list
export function getCategoryColor(categories: UserCategory[], categoryId: string): string {
  const cat = categories.find(c => c.id === categoryId);
  return cat?.color || '#64748B';
}

// Helper to get a category's name
export function getCategoryName(categories: UserCategory[], categoryId: string): string {
  const cat = categories.find(c => c.id === categoryId);
  return cat?.name || categoryId;
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
  },
};

export const COLORS = THEMES.pure_white;
