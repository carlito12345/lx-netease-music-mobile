/**
 * Chip - 统一选择标签组件(深色卡片设计语言)
 * 用法: <Chip active={isActive} label="纯色" onPress={fn} />
 * 未选中: 半透明灰底 + 主题文字色(深色卡上自动白字)
 * 选中: 主色背景 + 白字
 */
import { memo } from 'react'
import { TouchableOpacity, type ViewStyle, type StyleProp } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { DESIGN } from '@/theme/design'
import Text from '@/components/common/Text'
import { setSpText } from '@/utils/pixelRatio'

interface ChipProps {
  label: string
  active?: boolean
  onPress?: () => void
  /** 文字大小 */
  size?: number
  /** 自定义样式 */
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  /** 前置元素(色点/图标等), 与文字水平排列 */
  leading?: React.ReactNode
}

export default memo(({ label, active = false, onPress, size = 12, style, disabled = false, leading }: ChipProps) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: DESIGN.chipRadius,
          backgroundColor: active ? theme['c-primary'] : DESIGN.chipBg,
          borderWidth: 1,
          borderColor: active ? theme['c-primary'] : DESIGN.separator,
        },
        style,
      ]}
    >
      {leading}
      <Text
        size={size}
        color={active ? theme['c-primary-font-on-primary'] : theme['c-font']}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
})
