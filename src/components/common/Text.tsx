import { memo, type ComponentProps } from 'react'
import { Text, type TextProps as _TextProps, StyleSheet, Animated, type ColorValue, type TextStyle } from 'react-native'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'
import { useAnimateColor } from '@/utils/hooks/useAnimateColor'
import { isGrayColor, getTextColorByMode } from '@/utils/adaptiveTextColor'
import { useBackgroundColor } from '@/store/backgroundColor'
import { DEFAULT_DURATION, useAnimateNumber } from '@/utils/hooks/useAnimateNumber'
// import { AppColors } from '@/theme'

export interface TextProps extends _TextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: ColorValue
}

// const warpText = <P extends TextProps>(Component: ComponentType<TextProps>) => {
//   return ({ style, size = 15, color, children, ...props }: P) => {
//     const theme = useTheme()
//     return (
//       <Component
//         style={StyleSheet.compose({ fontFamily: 'System', fontSize: setSpText(size), color: color ?? theme['c-font'] }, style)}
//         {...props}
//       >{children}</Component>
//     )
//   }
// }

export default memo(({ style, size = 15, color, children, ...props }: TextProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const { textColorMode } = useBackgroundColor()
  // 文字色: 根据背景模式针对性
  const adaptiveColor = getTextColorByMode(textColorMode, theme.isDark)
  const resolvedColor = color == null
    ? adaptiveColor
    : (typeof color === 'string' && isGrayColor(color) ? adaptiveColor : color)
  style = StyleSheet.compose(textShadow ? {
    // fontFamily: 'System',
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
    fontSize: setSpText(size),
    color: resolvedColor,
  } : {
    // fontFamily: 'System',
    fontSize: setSpText(size),
    color: resolvedColor,
  }, style)

  return (
    <Text
      style={style}
      {...props}
    >{children}</Text>
  )
})

export interface AnimatedTextProps extends _AnimatedTextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: ColorValue
}
export const AnimatedText = ({ style, size = 15, color, children, ...props }: AnimatedTextProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  style = StyleSheet.compose(textShadow ? {
    // fontFamily: 'System',
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
    fontSize: setSpText(size),
    color: color ?? theme['c-font'],
  } : {
    // fontFamily: 'System',
    fontSize: setSpText(size),
    color: color ?? theme['c-font'],
  }, style as TextStyle)

  return <Animated.Text style={style} {...props}>{children}</Animated.Text>
}


type _AnimatedTextProps = ComponentProps<(typeof Animated)['Text']>
export interface AnimatedColorTextProps extends _AnimatedTextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: string
  /**
   * 字体透明度
   */
  opacity?: number
}
export const AnimatedColorText = ({ style, size = 15, opacity: _opacity, color: _color, children, ...props }: AnimatedColorTextProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const { textColorMode } = useBackgroundColor()

  // 文字色: 根据背景模式针对性
  const adaptiveColor = getTextColorByMode(textColorMode, theme.isDark)
  const resolvedColor = _color == null
    ? adaptiveColor
    : (typeof _color === 'string' && isGrayColor(_color) ? adaptiveColor : _color)
  const [color] = useAnimateColor(resolvedColor)
  const [opacity] = useAnimateNumber(_opacity ?? 1, DEFAULT_DURATION, false)

  style = StyleSheet.compose(textShadow ? {
    // fontFamily: 'System',
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
    fontSize: setSpText(size),
    color: color as unknown as ColorValue,
    opacity,
  } : {
    // fontFamily: 'System',
    fontSize: setSpText(size),
    color: color as unknown as ColorValue,
    opacity,
  }, style as TextStyle)

  return <Animated.Text style={style} {...props}>{children}</Animated.Text>
}
