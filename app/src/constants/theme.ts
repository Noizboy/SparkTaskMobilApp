import { MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#044728',
  primaryDark: '#033520',
  primaryLight: '#055a32',
  primaryContainer: '#B8E6D5',
  background: '#F8F7F5',
  card: '#FFFFFF',
  foreground: '#1A1A1A',
  mutedForeground: '#6B6B6B',
  muted: '#E8E8E8',
  border: 'rgba(0, 0, 0, 0.08)',
  success: '#22c55e',
  successDark: '#15803d',
  successLight: '#dcfce7',
  successText: '#166534',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoText: '#1d4ed8',
  pastelYellow: '#FFD88A',
  pastelBlue: '#B8D4F1',
  pastelGreen: '#B8E6D5',
  pastelPink: '#F5C1D5',
  pastelPurple: '#D4C5F9',
  pastelOrange: '#FFB88C',
  navBackground: '#1A1A1A',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
};

export const FONTS = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const PASTEL_COLORS = [
  COLORS.pastelGreen,
  COLORS.pastelBlue,
  COLORS.pastelPink,
  COLORS.pastelPurple,
  COLORS.pastelOrange,
  COLORS.pastelYellow,
];

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.white,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: '#022814',
    secondary: COLORS.foreground,
    onSecondary: COLORS.white,
    secondaryContainer: COLORS.muted,
    onSecondaryContainer: COLORS.foreground,
    background: COLORS.background,
    onBackground: COLORS.foreground,
    surface: COLORS.white,
    onSurface: COLORS.foreground,
    surfaceVariant: COLORS.gray100,
    onSurfaceVariant: COLORS.mutedForeground,
    error: COLORS.error,
    onError: COLORS.white,
    outline: COLORS.border,
    outlineVariant: COLORS.gray200,
  },
};
