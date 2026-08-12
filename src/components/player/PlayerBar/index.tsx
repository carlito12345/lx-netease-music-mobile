import { memo, useCallback, useMemo, useRef } from 'react'
import { PanResponder, View, TouchableOpacity, StyleSheet } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useBgPic } from '@/store/common/hook'
import { Icon } from '@/components/common/Icon'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { usePlayerMusicInfo } from '@/store/player/hook'
import PlayerPlaylist, { PlayerPlaylistType } from '@/components/player/PlayerPlaylist'
import MiniProgressBar from '@/components/player/PlayerBar/components/MiniProgressBar'
import playerState from '@/store/player/state'
import { LIST_IDS } from '@/config/constant'

export default memo(({ componentId, isHome = false }: { componentId?: string; isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const bgPic = useBgPic()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const longPressedRef = useRef(false)
  const playlistRef = useRef<PlayerPlaylistType>(null)
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  const handleLongPress = useCallback(() => {
    longPressedRef.current = true
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }, [])

  const handleNavigate = () => {
    if (longPressedRef.current) { longPressedRef.current = false; return }
    if (!musicInfo.id) return
    const currentComponentId = commonState.componentIds[commonState.componentIds.length - 1]?.id!
    navigations.pushPlayDetailScreen(currentComponentId)
  }

  const handleShowPlaylist = () => { playlistRef.current?.show() }

  const gestureAction = useRef<'drawer' | 'playlist' | null>(null)
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { dx, dy } = gestureState
      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (drawerLayoutPosition === 'left' && dx > 10) { gestureAction.current = 'drawer'; return true }
        if (drawerLayoutPosition === 'right' && dx < -10) { gestureAction.current = 'drawer'; return true }
      } else if (Math.abs(dy) > Math.abs(dx) * 1.5) {
        if (dy < -10) { gestureAction.current = 'playlist'; return true }
      }
      return false
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, dy } = gestureState
      if (gestureAction.current === 'drawer') {
        if (drawerLayoutPosition === 'left' && dx > 50) global.app_event.changeMenuVisible(true)
        else if (drawerLayoutPosition === 'right' && dx < -50) global.app_event.changeMenuVisible(true)
      } else if (gestureAction.current === 'playlist' && dy < -50) {
        handleShowPlaylist()
      }
      gestureAction.current = null
    },
    onPanResponderTerminate: () => { gestureAction.current = null },
  })).current

  // LXMUSIC-style capsule: auto width, rounded, no fixed height
  const playerComponent = useMemo(() => (
    <View
      style={{
        ...styles.container,
        backgroundColor: bgPic ? 'rgba(0,0,0,0.3)' : theme['c-content-background'],
        borderColor: theme['c-border-background'],
      }}
      {...panResponder.panHandlers}
    >
      {/* 底层透明点击层: 点击 bar 任何空白区域 → 打开播放详情 */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleNavigate}
        onLongPress={handleLongPress}
      />
      <MiniProgressBar />
      <View style={styles.left} pointerEvents="none">
        <Pic isHome={isHome} />
        <View style={styles.center}>
          <Title isHome={isHome} />
          <PlayInfo isHome={isHome} />
        </View>
      </View>
      <View style={styles.right} pointerEvents="box-none">
        <ControlBtn />
        <TouchableOpacity style={styles.menuBtn} onPress={handleShowPlaylist}>
          <Icon name="menu" color={bgPic ? '#fff' : theme['c-button-font']} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  ), [theme, isHome, bgPic, handleShowPlaylist, panResponder.panHandlers, drawerLayoutPosition])

  return (
    <>
      {autoHidePlayBar && keyboardShown ? null : playerComponent}
      <PlayerPlaylist ref={playlistRef} />
    </>
  )
})

const styles = createStyle({
  container: {
    width: 'auto',
    marginHorizontal: 6,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 14,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  left: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 6,
  },
  menuBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
