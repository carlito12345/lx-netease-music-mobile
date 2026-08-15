/**
 * MiniLyricPreview - 歌词预览组件(可调参数)
 * 显示当前行歌词居中, 前后行半透明(共 N 行)
 * 点击展开完整歌词页
 * 歌词舞台(跟随歌词页 lyricStage 设置): 当前行文字发光 + 弹入动画
 */
import { memo, useMemo, useEffect, useRef } from 'react'
import { View, TouchableOpacity, Animated, Easing } from 'react-native'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { useTheme } from '@/store/theme/hook'
import { useBackgroundColor } from '@/store/backgroundColor'
import { getTextColorByMode } from '@/utils/adaptiveTextColor'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import Text, { AnimatedColorText } from '@/components/common/Text'

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
  // 歌词舞台(跟随歌词页设置): 当前行发光 + 弹入
  const stageEnabled = useSettingValue('playDetail.effect.lyricStage.enabled')
  const scaleAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!stageEnabled) return
    scaleAnim.setValue(0.88)
    glowAnim.setValue(0)
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 1, duration: 420, useNativeDriver: false }),
    ]).start()
  }, [activeLine, stageEnabled, scaleAnim, glowAnim])

  // 文字对齐
  const textAlign = align ?? settingAlign
  const settingFont = useSettingValue('playDetail.vertical.style.lrcFontSize')
  const baseSize = fontSize ?? Math.round((settingFont / 10) * 0.8)

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
        visible.map(item => {
          const isActive = item.active
          const lineColor = isActive ? activeColor : theme['c-font-label']
          const lineOpacity = isActive ? 1 : inactiveOpacity
          const lineSize = isActive ? Math.round(baseSize) : Math.max(Math.round(baseSize) - 2, 11)

          // 歌词舞台: 当前行 Animated 缩放 + 发光(跟随 lyricStage 设置)
          const useStage = isActive && stageEnabled
          const glow = glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.85],
          })
          const stageStyle = useStage
            ? {
                transform: [{ scale: scaleAnim }],
                textShadowColor: activeColor,
                textShadowRadius: 6,
                textShadowOffset: { width: 0, height: 0 },
                shadowOpacity: glow,
              }
            : null

          return (
            <View key={item.lineNum} style={[styles.line, { paddingVertical: lineGap }]}>
              {useStage ? (
                <AnimatedColorText
                  size={lineSize}
                  color={lineColor}
                  style={[{
                    textAlign: textAlign as any,
                    opacity: lineOpacity,
                    ...stageStyle,
                  }]}
                  numberOfLines={1}
                >
                  {String(item.text ?? '')}
                </AnimatedColorText>
              ) : (
                <Text
                  size={lineSize}
                  color={lineColor}
                  style={{
                    textAlign: textAlign as any,
                    opacity: lineOpacity,
                  }}
                  numberOfLines={1}
                >
                  {String(item.text ?? '')}
                </Text>
              )}
            </View>
          )
        })
      )}
    </TouchableOpacity>
  )
})

export default MiniLyricPreview
