/**
 * ShinyTitle - 歌名标题完整组件
 * 自包含: 内部读取 ShinyText 设置, 自动决定闪光/普通渲染, 不干扰宿主
 */
import { memo } from 'react'
import { Text as RNText, type TextStyle } from 'react-native'
import Text from '@/components/common/Text'
import ShinyText from '@/components/common/ShinyText'
import { useSettingValue } from '@/store/setting/hook'

interface Props {
  /** 歌名 */
  text: string
  /** 别名(附加显示) */
  alias?: string | null
  /** 标题样式 */
  style?: TextStyle | TextStyle[]
  /** 字号 */
  size?: number
  /** 别名颜色 */
  aliasColor?: string
  /** 主文字颜色 */
  color?: string
}

export default memo(({ text, alias, style, size = 16, aliasColor, color }: Props) => {
  const shinyEnabled = useSettingValue('playDetail.effect.shinyText.enabled')

  if (shinyEnabled) {
    return (
      <ShinyText
        text={text || ''}
        color={color}
        style={style}
        enabled={shinyEnabled}
      />
    )
  }

  return (
    <RNText numberOfLines={1} style={[{ fontSize: size }, style]}>
      <Text size={size} color={color}>{text}</Text>
      {alias ? <Text color={aliasColor}> ({alias})</Text> : null}
    </RNText>
  )
})
