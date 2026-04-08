import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565C0',
    primaryContainer: '#E3F2FD',
    onPrimaryContainer: '#0D47A1',
    secondary: '#FF6F00',
    secondaryContainer: '#FFF3E0',
    onSecondaryContainer: '#E65100',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F4FF',
    error: '#C62828',
    errorContainer: '#FFEBEE',
  },
};

export const COLORS = {
  primary: '#1565C0',
  secondary: '#FF6F00',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57F17',
  warningLight: '#FFFDE7',
  error: '#C62828',
  errorLight: '#FFEBEE',
  info: '#01579B',
  infoLight: '#E1F5FE',
  grey: '#757575',
  greyLight: '#F5F5F5',
  greyMed: '#E0E0E0',
  white: '#FFFFFF',
  text: '#212121',
  textSecondary: '#616161',
};

export const STATUS_COLORS = {
  task: {
    pendente: { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D' },
    em_andamento: { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6' },
    concluido: { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784' },
    bloqueado: { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' },
  },
  project: {
    pendente: { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D' },
    em_andamento: { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6' },
    concluido: { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784' },
  },
  event: {
    planejamento: { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
    ativo: { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7' },
    concluido: { bg: '#ECEFF1', text: '#37474F', border: '#B0BEC5' },
  },
};
