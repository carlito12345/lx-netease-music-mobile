/**
 * 自适应文字颜色工具
 * 根据文字色模式返回高对比度颜色
 */
import type { TextColorMode } from '@/store/backgroundColor'

// 判断颜色是否为灰色系(RGB 接近相等, 排除接近纯白/纯黑)
export function isGrayColor(color: string): boolean {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return false
  const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3])
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
