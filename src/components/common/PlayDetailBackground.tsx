/**
 * PlayDetailBackground - 播放页背景模式完整组件
 * 主题/纯色/封面主色/封面模糊
 * 自包含: 内部读取设置, 不干扰宿主
 * 注: 封面主色提取需原生模块, 无则降级为深色
 */
import { memo, useMemo, useEffect } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import { useBackgroundColor } from '@/store/backgroundColor'
import { DESIGN } from '@/theme/design'

export const PlayDetailBackground = memo(() => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const picUrl = (playMusicInfo.musicInfo as any)?.meta?.picUrl
  const bgType = useSettingValue('playDetail.background.type')
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const followCover = useSettingValue('playDetail.background.followCover')
  const blurRadius = useSettingValue('playDetail.background.blurRadius')
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')

  // 封面主色降级: 无 PaletteModule, 用深色兜底
  const dominantColor = DESIGN.background.fallbackCover

  const backgroundColor = useMemo(() => {
    if (wallpaperEnabled) return 'transparent'
    if (bgType === 'solid') return followCover ? dominantColor : solidColor
    return theme['c-content-background']
  }, [bgType, solidColor, followCover, dominantColor, theme, wallpaperEnabled])

  // 更新全局文字色模式(背景模式针对性)
  // 主题→跟随主题 | 纯色/封面主色/封面模糊→白色 | 星云壁纸→黑色
  const { setTextColorMode } = useBackgroundColor()
  useEffect(() => {
    if (wallpaperEnabled) {
      setTextColorMode('black') // 星云壁纸背景亮, 用黑字
    } else if (bgType === 'theme') {
      setTextColorMode('theme') // 跟随主题明暗
    } else {
      setTextColorMode('white') // 纯色/封面主色/封面模糊 用白字
    }
  }, [bgType, wallpaperEnabled, setTextColorMode])

  // 模糊模式: 封面模糊背景
  const showBlur = bgType === 'blur' && picUrl && !wallpaperEnabled

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]} pointerEvents="none">
      {showBlur ? (
        <>
          <Image
            source={{ uri: picUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={blurRadius}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
        </>
      ) : null}
    </View>
  )
})
