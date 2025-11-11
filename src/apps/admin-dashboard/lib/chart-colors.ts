/**
 * Consistent color schemes for charts and visualizations
 */

export const CHART_COLORS = {
  primary: '#3B82F6', // blue-500
  success: '#10B981', // green-500
  warning: '#F59E0B', // yellow-500
  danger: '#EF4444', // red-500
  info: '#6366F1', // indigo-500
  purple: '#A855F7', // purple-500
  pink: '#EC4899', // pink-500
  cyan: '#06B6D4', // cyan-500
} as const;

export const STATUS_COLORS = {
  ACTIVE: CHART_COLORS.success,
  SUSPENDED: CHART_COLORS.danger,
  TRIAL: CHART_COLORS.warning,
  CANCELLED: CHART_COLORS.danger,
  PENDING: CHART_COLORS.warning,
  ACCEPTED: CHART_COLORS.success,
  EXPIRED: CHART_COLORS.danger,
  REVOKED: CHART_COLORS.danger,
} as const;

export const ROLE_COLORS = {
  ADMIN: CHART_COLORS.danger,
  ACCOUNTANT: CHART_COLORS.info,
  USER: CHART_COLORS.primary,
} as const;

export const PLAN_COLORS = {
  FREE: CHART_COLORS.info,
  PRO: CHART_COLORS.primary,
  ENTERPRISE: CHART_COLORS.purple,
} as const;

/**
 * Get a color from a palette by index (cycles through colors)
 */
export function getColorByIndex(index: number): string {
  const colors = Object.values(CHART_COLORS);
  return colors[index % colors.length];
}

/**
 * Get status-specific color
 */
export function getStatusColor(status: keyof typeof STATUS_COLORS): string {
  return STATUS_COLORS[status] || CHART_COLORS.primary;
}

/**
 * Get role-specific color
 */
export function getRoleColor(role: keyof typeof ROLE_COLORS): string {
  return ROLE_COLORS[role] || CHART_COLORS.primary;
}

/**
 * Get plan-specific color
 */
export function getPlanColor(plan: keyof typeof PLAN_COLORS): string {
  return PLAN_COLORS[plan] || CHART_COLORS.primary;
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get color with opacity
 */
export function colorWithOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}
