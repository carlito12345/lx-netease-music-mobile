/**
 * IconButton - 统一图标按钮
 * 收敛 TouchableOpacity + Icon 散落写法:
 * 默认用主题按钮色, 统一尺寸/按压反馈, 可选涟漪
 */
import { memo } from 'react'
import { TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { DESIGN } from '@/theme/design'

interface IconButtonProps {
  /** 图标名 */
  name: string
  /** 图标尺寸 */
  size?: number
  /** 图标颜色(默认主题按钮色) */
  color?: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  /** 按钮整体尺寸(点击区域, 默认 = size * 1.6) */
  hitSize?: number
  disabled?: boolean
  activeOpacity?: number
}

export default memo(({
  name, size = 24, color, onPress, style, hitSize, disabled = false, activeOpacity = 0.5,
}: IconButtonProps) => {
  const theme = useTheme()
  const iconColor = color ?? theme['c-button-font']
  const box = hitSize ?? size * 1.6

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[
        {
          width: box,
          height: box,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: DESIGN.radius.md,
        },
        style,
      ]}
    >
      <Icon name={name} color={iconColor} size={size} />
    </TouchableOpacity>
  )
})
