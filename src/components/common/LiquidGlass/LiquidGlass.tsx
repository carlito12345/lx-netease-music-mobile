/**
 * LiquidGlass - 毛玻璃面板(Glassmorphism,音乐播放器风格)
 * 实现: ImageBackground + blurRadius 原生模糊 + 光感叠加层
 * 自包含: 传入背景图 uri 即可获得毛玻璃效果,不依赖外部状态
 */
import { memo, useMemo } from 'react'
import {
  View,
  Image,
  type ViewStyle,
  type StyleProp,
  type ImageSourcePropType,
} from 'react-native'
import { createStyle } from '@/utils/tools'

interface Props {
  children?: React.ReactNode
  /** 背景图(会放大+模糊作为玻璃后面的内容) */
  source?: ImageSourcePropType | null
  /** 背景图模糊半径,默认 30 */
  blurRadius?: number
  /** 圆角,默认 24 */
  radius?: number
  /** 玻璃底色不透明度 0-1,默认 0.45(越低越透) */
  opacity?: number
  /** 光感强度 0-1,默认 0.7 */
  glowIntensity?: number
  /** 玻璃色调: 'light' 白色玻璃(Demo效果) | 'dark' 深色玻璃, 默认 dark */
  tone?: 'light' | 'dark'
  /** 容器样式(尺寸/位置) */
  style?: StyleProp<ViewStyle>
}

const styles = createStyle({
  container: {
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
})

const LiquidGlass = memo(({
  children,
  source,
  blurRadius = 30,
  radius = 24,
  opacity = 0.45,
  glowIntensity = 0.7,
  tone = 'dark',
  style,
}: Props) => {
  // 玻璃底色: light 白色玻璃(Demo效果) | dark 深色玻璃
  const tint = useMemo(() => {
    return tone === 'light'
      ? `rgba(255,255,255,${opacity})`
      : `rgba(12,18,32,${opacity})`
  }, [opacity, tone])

  return (
    <View style={[styles.container, { borderRadius: radius }, style]}>
      {/* 模糊背景层: 图片放大 + 高斯模糊(RN 原生, Image 在 Android 更可靠) */}
      {source ? (
        <Image
          source={source}
          style={styles.bg}
          blurRadius={blurRadius}
          resizeMode="cover"
        />
      ) : null}

      {/* 深色玻璃色罩: 控制透光率 */}
      <View
        style={{
          position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
          borderRadius: radius,
          backgroundColor: tint,
        }}
      />

      {/* 左上光斑(定向光源) */}
      <View
        style={{
          position: 'absolute', left: -30, top: -40,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: tone === 'light' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)',
          opacity: glowIntensity,
        }}
      />

      {/* 顶部反光线 */}
      <View
        style={{
          position: 'absolute', left: 16, top: 1, right: 16, height: 1.5,
          borderRadius: 1,
          backgroundColor: tone === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
          opacity: glowIntensity,
        }}
      />

      {/* 边缘高光描边 */}
      <View
        style={{
          position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
          borderRadius: radius,
          borderWidth: 0.5,
          borderColor: tone === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
        }}
      />

      {/* 内容层 */}
      <View style={styles.content}>{children}</View>
    </View>
  )
})

export default LiquidGlass
