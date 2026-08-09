/**
 * 自适应文字颜色工具
 * 根据文字色模式返回高对比度颜色
 */
import type { TextColorMode } from '@/store/backgroundColor'

// hex -> {r,g,b}
const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '')
  if (m.length === 3) {
    return {
      r: parseInt(m[0] + m[0], 16),
      g: parseInt(m[1] + m[1], 16),
      b: parseInt(m[2] + m[2], 16),
    }
  }
  if (m.length === 6) {
    return {
      r: parseInt(m.substring(0, 2), 16),
      g: parseInt(m.substring(2, 4), 16),
      b: parseInt(m.substring(4, 6), 16),
    }
  }
  return null
}

// 判断颜色是否为灰色系(RGB 接近相等, 排除接近纯白/纯黑)
// 支持 rgb()/rgba()/hex 格式
export function isGrayColor(color: string): boolean {
  let r: number, g: number, b: number
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) {
    r = parseInt(m[1]); g = parseInt(m[2]); b = parseInt(m[3])
  } else if (color.startsWith('#')) {
    const rgb = hexToRgb(color)
    if (!rgb) return false
    ;({ r, g, b } = rgb)
  } else {
    return false
  }
  // 排除接近纯白(>240)或纯黑(<15), 这些不算灰
  const maxVal = Math.max(r, g, b)
  const minVal = Math.min(r, g, b)
  if (maxVal > 240 || minVal < 15) return false
  return Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20
}

// 根据主题明暗返回自适应文字色
export function getAdaptiveTextColor(isDark: boolean): string {
  return isDark ? '#FFFFFF' : '#000000'
}

// 根据文字色模式返回文字色
// 'theme' = 跟随主题明暗 | 'white' = 白色 | 'black' = 黑色
export function getTextColorByMode(mode: TextColorMode, isDark: boolean): string {
  switch (mode) {
    case 'white': return '#FFFFFF'
    case 'black': return '#000000'
    case 'theme':
    default: return isDark ? '#FFFFFF' : '#000000'
  }
}
