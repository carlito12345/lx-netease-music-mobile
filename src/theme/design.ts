/**
 * 统一设计令牌(Design Tokens)
 * 深色卡片设计语言(A 方案):
 *  - 卡片: 深紫黑 #1B1722 / #2F293A 两级, 圆角 18
 *  - chip: 半透明灰底, 圆角 14, 选中主色
 *  - 按钮: 圆角 12, 主色背景或半透明灰
 * 所有新组件/改造统一引用此处, 禁止散落魔法值。
 */
export const DESIGN = {
  // 深色卡片背景(与 App 设置/播放器设置一致)
  cardDark: '#1B1722',
  cardDark2: '#2F293A',

  // 全局背景色(背景模式统一语言)
  background: {
    /** 封面主色降级色(无调色板模块时兜底) */
    fallbackCover: '#1a1a2e',
    /** 纯色背景色板(背景模式>纯色) */
    solid: {
      deepBlue: '#1a1a2e',
      deepSpace: '#0d1117',
      darkPurple: '#1a0d2e',
      darkGreen: '#0d2818',
      wineRed: '#2e0d1a',
      darkGray: '#1c1c1c',
      midnightBlue: '#0d1b2a',
      charcoal: '#121212',
    },
    /** 星云壁纸默认色(跟随主题) */
    wallpaperDefault: '',
  },

  // 圆角
  radius: {
    sm: 8,   // 输入框/小控件
    md: 12,  // 按钮/常规控件
    lg: 18,  // 卡片(与 Section 一致)
  },

  // 间距
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  // chip 背景(半透明灰, 深浅主题通用; 深色卡上自动白字)
  chipBg: 'rgba(128,128,128,0.15)',
  chipBgActive: 'rgba(128,128,128,0.28)',
  chipRadius: 14,

  // 分隔线
  separator: 'rgba(128,128,128,0.2)',
} as const

export type DesignTokens = typeof DESIGN
