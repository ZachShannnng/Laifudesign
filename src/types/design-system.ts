/**
 * Lovable 设计系统类型定义
 * 参考 DESIGN.md 和 lovable-integration.md
 */

export interface DesignSystemColors {
  background: string
  foreground: string
  border: string
  borderInteractive: string
  muted: string
  card: string
  input: string
  ring: string
}

export interface TypographySize {
  size: string
  weight: number
  lineHeight: number
  letterSpacing: string
}

export interface DesignSystemTypography {
  fontFamily: string
  fontWeights: {
    body: 400
    display: 480
    heading: 600
  }
  sizes: {
    hero: TypographySize
    heading: TypographySize
    subheading: TypographySize
    body: TypographySize
  }
}

export interface DesignSystemSpacing {
  base: 8
  section: number[]
}

export interface DesignSystemBorderRadius {
  micro: 4
  standard: 6
  comfortable: 8
  card: 12
  container: 16
  full: 9999
}

export interface DesignSystemShadows {
  inset: string
  focus: string
  ring: string
}

export interface DesignSystemConfig {
  colors: DesignSystemColors
  typography: DesignSystemTypography
  spacing: DesignSystemSpacing
  borderRadius: DesignSystemBorderRadius
  shadows: DesignSystemShadows
}

/** Lovable 默认设计系统配置 */
export const DEFAULT_DESIGN_SYSTEM: DesignSystemConfig = {
  colors: {
    background: '#f7f4ed',
    foreground: '#1c1c1c',
    border: '#eceae4',
    borderInteractive: 'rgba(28,28,28,0.4)',
    muted: '#5f5f5d',
    card: '#f7f4ed',
    input: '#f7f4ed',
    ring: 'rgba(59,130,246,0.5)',
  },
  typography: {
    fontFamily: "'Camera Plain Variable', 'Inter', ui-sans-serif, system-ui, sans-serif",
    fontWeights: {
      body: 400,
      display: 480,
      heading: 600,
    },
    sizes: {
      hero: { size: '3.75rem', weight: 600, lineHeight: 1.10, letterSpacing: '-0.15em' },
      heading: { size: '3rem', weight: 600, lineHeight: 1.00, letterSpacing: '-0.12em' },
      subheading: { size: '2.25rem', weight: 600, lineHeight: 1.10, letterSpacing: '-0.09em' },
      body: { size: '1rem', weight: 400, lineHeight: 1.50, letterSpacing: '0' },
    },
  },
  spacing: {
    base: 8,
    section: [80, 96, 128, 176, 192, 208],
  },
  borderRadius: {
    micro: 4,
    standard: 6,
    comfortable: 8,
    card: 12,
    container: 16,
    full: 9999,
  },
  shadows: {
    inset: 'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
    focus: 'rgba(0,0,0,0.1) 0px 4px 12px',
    ring: '0 0 0 2px rgba(59,130,246,0.5)',
  },
}
