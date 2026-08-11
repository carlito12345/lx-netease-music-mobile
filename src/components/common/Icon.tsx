/**
 * Icon - 全局图标组件(Material Design)
 * 将现有 IcoMoon 图标名映射到 MaterialIcons, 调用方无需改动
 */
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { scaleSizeW } from '@/utils/pixelRatio'
import { memo, type ComponentProps } from 'react'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'
import { isGrayColor, getTextColorByMode } from '@/utils/adaptiveTextColor'
import { useBackgroundColor } from '@/store/backgroundColor'

// IcoMoon 图标名 → MaterialIcons 图标名 映射
const ICON_MAP: Record<string, string> = {
  'love-filled': 'favorite',
  'share': 'share',
  'full_stop': 'more-horiz',
  'sd-card': 'sd-card',
  'help': 'help-outline',
  'checkbox-blank-outline': 'check-box-outline-blank',
  'checkbox-marked': 'check-box',
  'minus-box': 'indeterminate-check-box',
  'home': 'home',
  'menu': 'menu',
  'chevron-left': 'arrow-back',
  'chevron-right': 'chevron-right',
  'back-2': 'arrow-back',
  'remove': 'remove',
  'chevron-left-2': 'chevron-left',
  'chevron-right-2': 'chevron-right',
  'slider': 'tune',
  'lyric-off': 'subtitles-off',
  'lyric-on': 'subtitles',
  'comment': 'comment',
  'playback-rate': 'speed',
  'volume-mute': 'volume-mute',
  'volume-off': 'volume-off',
  'volume-low': 'volume-down',
  'volume-medium': 'volume-up',
  'volume-higt': 'volume-up',
  'eraser': 'auto-fix-normal',
  'available_updates': 'system-update',
  'music_time': 'history',
  'list-loop': 'repeat',
  'list-random': 'shuffle',
  'list-order': 'queue-music',
  'single-loop': 'repeat-one',
  'single': 'music-note',
  'play-outline': 'play-circle-outline',
  'exit2': 'logout',
  'exit': 'exit-to-app',
  'logo': 'music-note',
  'add_folder': 'create-new-folder',
  'thumbs-up': 'thumb-up',
  'add-music': 'library-music',
  'dots-vertical': 'more-vert',
  'close': 'close',
  'pause': 'pause',
  'play': 'play-arrow',
  'prevMusic': 'skip-previous',
  'nextMusic': 'skip-next',
  'setting': 'settings',
  'download-2': 'download',
  'love': 'favorite-border',
  'leaderboard': 'leaderboard',
  'album': 'album',
  'search-2': 'search',
  'voice': 'mic',
  'voice-filled': 'mic',
  'calendar': 'event',
  'artist': 'person',
  'album-disc': 'album',
  'onedrive': 'cloud',
}

type IconType = typeof MaterialIcons

interface IconProps extends Omit<ComponentProps<IconType>, 'style'> {
  style?: StyleProp<TextStyle>
  rawSize?: number
}

// 从 style 中提取 color(兼容 style={{ color }} 与 style={[..., {color}]})
const extractStyleColor = (style: any): string | undefined => {
  if (Array.isArray(style)) {
    for (const s of style) {
      const c = extractStyleColor(s)
      if (c) return c
    }
    return undefined
  }
  if (style && typeof style === 'object') {
    return (style as TextStyle).color as string | undefined
  }
  return undefined
}

export const Icon = memo(({ size = 15, rawSize, color, style, name, ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const { textColorMode } = useBackgroundColor()
  const adaptiveColor = getTextColorByMode(textColorMode, theme.isDark)
  const materialName = ICON_MAP[name as string] || name
  let newStyle = textShadow
    ? StyleSheet.compose(
        {
          textShadowColor: theme['c-primary-dark-300-alpha-800'],
          textShadowOffset: { width: 0.2, height: 0.2 },
          textShadowRadius: 2,
        },
        style
      )
    : style

  // 统一语言: style 内的灰色系 color 也做自适应替换(与 color prop 一致)
  let resolvedColor = color == null
    ? adaptiveColor
    : (typeof color === 'string' && isGrayColor(color) ? adaptiveColor : color)
  if (color == null) {
    const styleColor = extractStyleColor(newStyle)
    if (typeof styleColor === 'string' && isGrayColor(styleColor)) {
      resolvedColor = adaptiveColor
      // 移除 style 中的灰色系 color, 避免覆盖 prop 的自适应色
      const stripColor = (st: any): any => {
        if (Array.isArray(st)) return st.map(stripColor).filter(Boolean)
        if (st && typeof st === 'object') {
          const { color: _c, ...rest } = st
          return Object.keys(rest).length ? rest : undefined
        }
        return st
      }
      newStyle = stripColor(newStyle) as any
    }
  }

  return (
    <MaterialIcons
      name={materialName}
      size={rawSize ?? scaleSizeW(size)}
      color={resolvedColor}
      style={newStyle as any}
      {...props}
    />
  )
})

export {}
