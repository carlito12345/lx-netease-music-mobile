/**
 * MiniLyricPreview - 歌词预览组件(可调参数)
 * 显示当前行歌词居中, 前后行半透明(共 N 行)
 * 点击展开完整歌词页
 * 全部样式可配: 行数/字号/行间距/对齐/透明度
 */
import { memo, useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { useTheme } from '@/store/theme/hook'
import { useBackgroundColor } from '@/store/backgroundColor'
import { getTextColorByMode } from '@/utils/adaptiveTextColor'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

interface Props {
  /** 点击展开完整歌词页 */
  onPress?: () => void
  /** 显示总行数(当前行 + 前后), 默认 3, 建议 3-5 */
  lineCount?: number
  /** 基础字号(当前行), 默认取设置 lrcFontSize 的 80% */
  fontSize?: number
  /** 行间距, 默认 6 */
  lineGap?: number
  /** 非当前行透明度 0-1, 默认 0.55 */
  inactiveOpacity?: number
  /** 文字对齐 */
  align?: 'left' | 'center' | 'right'
  /** 垂直对齐 */
  justify?: 'center' | 'flex-start' | 'flex-end'
}

const styles = createStyle({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  line: {
    paddingVertical: 6,
  },
  empty: {
    alignSelf: 'center',
  },
})

const MiniLyricPreview = memo(({
  onPress,
  lineCount = 3,
  fontSize,
  lineGap = 6,
  inactiveOpacity = 0.55,
  align,
  justify = 'center',
}: Props) => {
  const theme = useTheme()
  const { line: activeLine } = useLrcPlay()
  const lines = useLrcSet()
  const settingAlign = useSettingValue('playDetail.style.align')
  const { textColorMode } = useBackgroundColor()
  const activeColor = getTextColorByMode(textColorMode, theme.isDark)

  // 兼容: 未传入时用设置值, 传入则优先 props
  const textAlign = align ?? settingAlign
  const settingFont = useSettingValue('playDetail.vertical.style.lrcFontSize')
  // 注意: lrcFontSize 是 10 倍值(如 200=20pt), 需先 /10 再缩放
  const baseSize = fontSize ?? Math.round((settingFont / 10) * 0.8)

  // 前后各 (lineCount-1)/2 行
  const half = Math.floor((lineCount - 1) / 2)

  const visible = useMemo(() => {
    if (!Array.isArray(lines) || lines.length === 0) return []
    const idx = activeLine < 0 ? 0 : Math.min(activeLine, lines.length - 1)
    const from = Math.max(0, idx - half)
    const to = Math.min(lines.length - 1, idx + half)
    return lines.slice(from, to + 1).map((line, offset) => ({
      text: line?.text ?? '',
      lineNum: from + offset,
      active: from + offset === idx,
    }))
  }, [lines, activeLine, half])

  return (
    <TouchableOpacity
      style={[styles.container, { justifyContent: justify }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {visible.length === 0 ? (
        <Text size={13} color={theme['c-font-label']} style={styles.empty}>...</Text>
      ) : (
        visible.map(item => (
          <View key={item.lineNum} style={[styles.line, { paddingVertical: lineGap }]}>
            <Text
              size={item.active ? Math.round(baseSize) : Math.max(Math.round(baseSize) - 2, 11)}
              color={item.active ? activeColor : theme['c-font-label']}
              style={{
                textAlign: textAlign as any,
                opacity: item.active ? 1 : inactiveOpacity,
              }}
              numberOfLines={1}
            >
              {String(item.text ?? '')}
            </Text>
          </View>
        ))
      )}
    </TouchableOpacity>
  )
})

export default MiniLyricPreview
