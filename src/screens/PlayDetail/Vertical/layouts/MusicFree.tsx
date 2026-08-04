/**
 * MusicFree 风格播放器布局(完整组件, 不含特效)
 * - 封面底部叠加歌词(半透明遮罩)
 * - 点击切换全屏歌词
 * - 左右滑动切歌
 * 适配新底包: Header/Lyric/Player 均用新底包组件
 */
import { memo, useState, useMemo, useRef, useEffect } from 'react'
import { View, StyleSheet, Dimensions, Image, Pressable, PanResponder } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import AppImage from '@/components/common/Image'
import Header from '../components/Header'
import Lyric from '../Lyric'
import MusicFreePlayer from './MusicFreePlayer'
import { playNext, playPrev } from '@/core/player/player'
import { StarfieldBackground } from '@/components/starfield/StarfieldBackground'
import { SpectrumBars } from '@/components/echo/SpectrumBars'
import { WallpaperView } from '@/components/wallpaper/WallpaperView'
import { SlideshowBg } from '@/components/slideshow/SlideshowBg'

const { width: SW, height: SH } = Dimensions.get('window')
const COVER_SIZE = Math.min(SW * 0.6, SH * 0.35)
const PADDING_H = Math.min(SW * 0.04, 60)

interface Props { componentId: string }

export default memo(({ componentId }: Props) => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const mi = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null
  const [showLyrics, setShowLyrics] = useState(false)
  const [currentLine, setCurrentLine] = useState('')

  // 读取当前歌词行(由 lyric 插件自动更新)
  useEffect(() => {
    const tick = () => {
      try {
        const ps = require('@/store/player/state').default
        const line = ps?.lastLyric || ''
        setCurrentLine(prev => prev === line ? prev : line)
      } catch {}
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // 新底包封面字段: musicInfo.musicInfo.meta.picUrl (与 Pic.tsx 一致)
  const coverUrl = (playMusicInfo.musicInfo as any)?.meta?.picUrl
  const title = (mi as any)?.name || ''
  const artist = (mi as any)?.singer || ''
  const bgColor = theme['c-app-background']
  const starfieldEnabled = useSettingValue('playDetail.effect.starfield.enabled')
  const spectrumEnabled = useSettingValue('playDetail.effect.spectrum.enabled')
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const slideshowEnabled = useSettingValue('playDetail.effect.slideshow.enabled')

  // 左右滑动切歌
  const swipeRef = useRef({ startX: 0 }).current
  const swipePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { swipeRef.startX = e.nativeEvent.pageX },
    onPanResponderRelease: (e) => {
      const dx = e.nativeEvent.pageX - swipeRef.startX
      if (dx > 60) playPrev()
      else if (dx < -60) playNext()
    },
  })).current

  // 全屏歌词
  if (showLyrics) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Header hideTitle />
        <Pressable style={styles.lyricFull} onPress={() => setShowLyrics(false)}>
          <Lyric />
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingHorizontal: PADDING_H }]}>
      {/* 模糊封面背景 */}
      {coverUrl ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image source={{ uri: coverUrl }} style={[StyleSheet.absoluteFill]} resizeMode="cover" blurRadius={50} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        </View>
      ) : null}

      {/* 特效层(独立组件, 各自读取设置开关) */}
      {starfieldEnabled && <StarfieldBackground />}
      {spectrumEnabled && <SpectrumBars primaryColor={theme['c-primary']} />}
      {wallpaperEnabled && <WallpaperView />}
      {slideshowEnabled && <SlideshowBg />}

      {/* Header */}
      <Header hideTitle />

      {/* 封面 + CoverLyrics 叠加 */}
      <Pressable style={styles.body} onPress={() => setShowLyrics(true)} {...swipePan.panHandlers}>
        <View style={styles.coverOuter}>
          <View style={styles.coverWrapper}>
            {coverUrl ? (
              <AppImage url={coverUrl} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text size={50} color={theme['c-primary']}>♪</Text>
              </View>
            )}
          </View>

          {/* CoverLyrics 遮罩层 */}
          {currentLine ? (
            <View style={styles.coverLyricsOverlay} pointerEvents="none">
              <View style={styles.lyricGradient} />
              <View style={styles.lyricTextWrap}>
                <Text style={styles.lyricLine} numberOfLines={2}>
                  {currentLine}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* 居中标题(歌名+歌手) */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText} numberOfLines={1} size={17} color={theme['c-font']}>
          {title}
        </Text>
        <Text style={styles.artistText} numberOfLines={1} size={13} color={theme['c-font-label']}>
          {artist}
        </Text>
      </View>

      {/* 控件 */}
      <MusicFreePlayer componentId={componentId} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column' },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOuter: {
    position: 'relative',
  },
  coverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: {
    backgroundColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLyricsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '36%',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  lyricGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    opacity: 0.9,
  },
  lyricTextWrap: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  lyricLine: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
  },
  lyricFull: {
    flex: 1,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: PADDING_H,
  },
  titleText: {
    textAlign: 'center',
  },
  artistText: {
    textAlign: 'center',
    marginTop: 4,
  },
})
