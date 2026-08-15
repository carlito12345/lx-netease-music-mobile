/**
 * ColorPicker - Material 风格颜色选择器(可复用)
 * 预设色板(Material 主色) + HSL 滑杆自定义 + 实时预览
 * 输出: hex 颜色字符串 (#RRGGBB)
 */
import { memo, useState, useCallback, useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Slider from '@/components/common/Slider'
import { DESIGN } from '@/theme/design'

// Material 调色板 500 档主色(带亮度, 适合深色背景)
const PALETTE = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548', '#607D8B', '#9E9E9E', '#00E5FF',
  '#2979FF', '#651FFF', '#D500F9', '#00C853', '#FF6E40',
]

// 深色/亮色系补充
const DARK_PALETTE = [
  '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#1A237E',
  '#0D47A1', '#006064', '#004D40', '#1B5E20', '#E65100',
  '#212121', '#263238', '#00B8D4', '#76FF03', '#F50057',
]

// HSL → RGB
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

// RGB → HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return null
  const v = parseInt(m[1], 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')

interface Props {
  value: string
  onChange: (color: string) => void
}

const ColorPicker = memo(({ value, onChange }: Props) => {
  const theme = useTheme()
  const [showCustom, setShowCustom] = useState(false)

  // 当前值解析为 HSL(用于滑杆)
  const hsl = useMemo(() => {
    const rgb = hexToRgb(value) ?? [255, 255, 255]
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
    return { h, s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 }
  }, [value])

  const setHsl = useCallback((h: number, s: number, l: number) => {
    const [r, g, b] = hslToRgb(h, s, l)
    onChange(rgbToHex(r, g, b))
  }, [onChange])

  return (
    <View style={styles.container}>
      {/* 预设色板 */}
      <View style={styles.swatchGrid}>
        {PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.swatch, { backgroundColor: c }, c === value && styles.swatchActive]}
            onPress={() => onChange(c)}
          />
        ))}
      </View>
      <View style={[styles.swatchGrid, styles.swatchGridDark]}>
        {DARK_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.swatch, { backgroundColor: c }, c === value && styles.swatchActive]}
            onPress={() => onChange(c)}
          />
        ))}
      </View>

      {/* 自定义开关 */}
      <TouchableOpacity style={styles.customToggle} onPress={() => setShowCustom(!showCustom)}>
        <Text size={12} color={theme['c-primary']}>
          {showCustom ? '▼ 收起自定义' : '▶ 自定义颜色'}
        </Text>
      </TouchableOpacity>

      {showCustom ? (
        <View style={styles.customArea}>
          {/* 预览 */}
          <View style={styles.previewRow}>
            <View style={[styles.preview, { backgroundColor: value }]} />
            <Text size={12} color={theme['c-font-label']}>{value.toUpperCase()}</Text>
          </View>
          {/* HSL 滑杆 */}
          <View style={styles.hslRow}>
            <Text size={11} color={theme['c-font-label']} style={styles.hslLabel}>色相</Text>
            <View style={styles.hslSlider}>
              <Slider value={hsl.h} minimumValue={0} maximumValue={360} step={1} onValueChange={(v) => setHsl(v, hsl.s, hsl.l)} />
            </View>
          </View>
          <View style={styles.hslRow}>
            <Text size={11} color={theme['c-font-label']} style={styles.hslLabel}>饱和</Text>
            <View style={styles.hslSlider}>
              <Slider value={hsl.s} minimumValue={0} maximumValue={1} step={0.01} onValueChange={(v) => setHsl(hsl.h, v, hsl.l)} />
            </View>
          </View>
          <View style={styles.hslRow}>
            <Text size={11} color={theme['c-font-label']} style={styles.hslLabel}>亮度</Text>
            <View style={styles.hslSlider}>
              <Slider value={hsl.l} minimumValue={0} maximumValue={1} step={0.01} onValueChange={(v) => setHsl(hsl.h, hsl.s, v)} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
})

// 色块尺寸(设计令牌无此语义, 用常量保持网格整齐)
const SWATCH_SIZE = DESIGN.spacing.xxl + 6 // 30
const styles = createStyle({
  container: { paddingHorizontal: DESIGN.spacing.xl },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN.spacing.sm,
  },
  swatchGridDark: { marginTop: DESIGN.spacing.xs },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: DESIGN.radius.sm,
    borderWidth: 1,
    borderColor: DESIGN.separator,
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: DESIGN.background.solid.charcoal,
  },
  customToggle: { marginTop: DESIGN.spacing.sm, paddingVertical: DESIGN.spacing.xs },
  customArea: { marginTop: DESIGN.spacing.xs },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: DESIGN.spacing.sm, marginBottom: DESIGN.spacing.xs },
  preview: { width: DESIGN.spacing.xxl + 12, height: DESIGN.spacing.lg + 8, borderRadius: DESIGN.radius.sm, borderWidth: 1, borderColor: DESIGN.separator },
  hslRow: { flexDirection: 'row', alignItems: 'center', marginTop: DESIGN.spacing.xs },
  hslLabel: { width: DESIGN.spacing.xl + 12 },
  hslSlider: { flex: 1, marginLeft: DESIGN.spacing.xs },
})

export default ColorPicker
