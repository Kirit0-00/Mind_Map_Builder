const sharedTheme = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    circle: '50%'
  },
  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.1)',
    md: '0 4px 8px rgba(0,0,0,0.12)',
    lg: '0 8px 16px rgba(0,0,0,0.14)',
    xl: '0 12px 24px rgba(0,0,0,0.16)'
  }
};

const darkTheme = {
  background: '#1a1a1a',
  surface: '#2a2a2a',
  primary: '#6eb9f7',
  secondary: '#4a9eff',
  accent: '#00ff9d',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#404040',
  danger: '#ff4d4d',
  success: '#2ecc71',
  nodeColors: [
    '#2a3f50',  // Deep blue
    '#2d4a3e',  // Deep green
    '#4a3d50',  // Deep purple
    '#503d3d',  // Deep red
    '#3d4a50'   // Deep cyan
  ],
  pastelColors: {
    blue: '#6eb9f7',
    pink: '#ff9ecd',
    green: '#7affa7',
    orange: '#ffa756',
    purple: '#c4b5ff',
    red: '#ff9999',
    cyan: '#62efff'
  }
};

const lightTheme = {
  background: '#ffffff',
  surface: '#f5f5f5',
  primary: '#4A90E2',
  secondary: '#357ABD',
  accent: '#00c853',
  text: '#2d2d2d',
  textSecondary: '#666666',
  border: '#e0e0e0',
  danger: '#e74c3c',
  success: '#2ecc71',
  nodeColors: [
    '#E6F3FF',  // Light blue
    '#E6FFE6',  // Light green
    '#FFE6F3',  // Light pink
    '#FFE6E6',  // Light red
    '#E6E6FF'   // Light purple
  ],
  pastelColors: {
    blue: '#E6F3FF',
    pink: '#FFE6F3',
    green: '#E6FFE6',
    orange: '#FFE6E6',
    purple: '#F3E6FF',
    red: '#FFE6E6',
    cyan: '#E6FFFF'
  }
};

export const theme = {
  dark: { ...darkTheme, ...sharedTheme },
  light: { ...lightTheme, ...sharedTheme }
}; 