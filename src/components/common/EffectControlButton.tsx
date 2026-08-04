/**
 * EffectControlButton - 特效控制按钮完整组件
 * 自包含: 内部读取 MagicRings 设置, 自动附加点击涟漪, 不干扰宿主
 * 未开启特效时退化为普通按钮(等价 TouchableOpacity)
 */
import { memo } from 'react'
import MagicRings from '@/components/common/MagicRings'
import { useSettingValue } from '@/store/setting/hook'

interface Props {
  /** 图标名 */
  icon: string
  /** 按钮尺寸 */
  size: number
  /** 图标颜色 */
  color: string
  /** 点击回调 */
  onPress: () => void
  /** 额外样式 */
  style?: any
  /** 按下透明度 */
  activeOpacity?: number
}

export default memo(({ icon, size, color, onPress, style, activeOpacity = 0.5 }: Props) => {
  const magicRingsEnabled = useSettingValue('playDetail.effect.magicRings.enabled')

  return (
    <MagicRings
      enabled={magicRingsEnabled}
      color={color}
      radius={size * 0.55}
      onPress={onPress}
      style={{ ...style, width: size, height: size }}
      activeOpacity={activeOpacity}
    >
      <IconInner name={icon} color={color} size={size} />
    </MagicRings>
  )
})

// 图标渲染(延迟引用避免循环依赖)
const IconInner = memo(({ name, color, size }: { name: string; color: string; size: number }) => {
  const { Icon } = require('@/components/common/Icon') as typeof import('@/components/common/Icon')
  return <Icon name={name} color={color} rawSize={size * 0.7} />
})
