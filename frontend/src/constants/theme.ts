import { Platform } from 'react-native';

export const ThemeTokens = {
  // Base
  background: '#0D0B1A',
  surface: '#17142B',
  surfaceTrack: '#241F42',
  borderSubtle: '#2E2757',
  borderDashed: '#4A4178',
  textPrimary: '#F2EEFC',
  textSecondary: '#B4A9E0',
  textTertiary: '#8A7FBD',
  placeholder: '#6E6494',

  // Brand
  brandText: '#B84FFF',
  brandFill: '#7C3AED',
  brandDeepSurface: '#26134D',
  brandSoftText: '#C7A9FF',

  // Semantics
  incomeText: '#39FFC4',
  incomeFill: '#0FAE7C',
  expenseText: '#FF5C7A',
  expenseFill: '#D6294B',
  pendingText: '#FFC94D',
  pendingBg: '#3A2B12',
  paidBg: '#0F3324',
  overdueBg: '#3A0F1A',

  // Category Colors
  categories: {
    Alimentación: '#FF9142',
    Transporte: '#4D9EFF',
    Servicios: '#FFD23F',
    Entretenimiento: '#E14FFF',
    Salud: '#FF6FB3',
    Hogar: '#2DE1C2',
    Compras: '#9B6BFF',
    Otros: '#8B82B8',
    Nómina: '#39FFC4',
    Freelance: '#4D9EFF',
  } as Record<string, string>,
} as const;

export const Colors = {
  dark: {
    text: ThemeTokens.textPrimary,
    background: ThemeTokens.background,
    backgroundElement: ThemeTokens.surface,
    backgroundSelected: ThemeTokens.surfaceTrack,
    textSecondary: ThemeTokens.textSecondary,
    border: ThemeTokens.borderSubtle,
    primary: ThemeTokens.brandFill,
  },
  light: {
    // Defaulting to the dark neon theme as specified in extra.md
    text: ThemeTokens.textPrimary,
    background: ThemeTokens.background,
    backgroundElement: ThemeTokens.surface,
    backgroundSelected: ThemeTokens.surfaceTrack,
    textSecondary: ThemeTokens.textSecondary,
    border: ThemeTokens.borderSubtle,
    primary: ThemeTokens.brandFill,
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Manrope',
    display: 'Sora',
    mono: 'Courier',
  },
  default: {
    sans: 'normal',
    display: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  base: 8,
  half: 4,
  one: 8,
  two: 16,
  three: 20,
  four: 24,
  five: 32,
  six: 40,
} as const;

export const Radii = {
  full: 999,
  card: 20,
  button: 14,
  input: 14,
  icon: 12,
  sm: 6,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 80;
export const MaxContentWidth = 800;
