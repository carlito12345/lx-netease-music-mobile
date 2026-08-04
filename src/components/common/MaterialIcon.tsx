/**
 * MaterialIcon - Material Design 图标组件
 * 将现有 IcoMoon 图标名映射到 MaterialIcons
 */
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { scaleSizeW } from '@/utils/pixelRatio'
import { memo, type ComponentProps } from 'react'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'

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
  'chevron-left': 'chevron-left',
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
  'music_time': 'music-note',
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
}

type MaterialIconType = typeof MaterialIcons

interface IconProps extends Omit<ComponentProps<MaterialIconType>, 'style'> {
  style?: StyleProp<TextStyle>
  rawSize?: number
}

export const MaterialIcon = memo(({ size = 15, rawSize, color, style, name, ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const materialName = ICON_MAP[name as string] || name
  const newStyle = textShadow
    ? StyleSheet.compose(
        {
          textShadowColor: theme['c-primary-dark-300-alpha-800'],
          textShadowOffset: { width: 0.2, height: 0.2 },
          textShadowRadius: 2,
        },
        style
      )
    : style
  return (
    <MaterialIcons
      name={materialName}
      size={rawSize ?? scaleSizeW(size)}
      color={color ?? theme['c-font']}
      style={newStyle as any}
      {...props}
    />
  )
})

export {}
