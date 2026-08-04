import { View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
// import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { useMemo } from 'react'
import EffectControlButton from '@/components/common/EffectControlButton'

const PrevBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const activeColor = theme.isDark ? theme['c-font'] : theme['c-primary'];
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <EffectControlButton
      icon="prevMusic"
      size={size}
      color={activeColor}
      onPress={handlePlayPrev}
      style={styles.cotrolBtn}
    />
  )
}
const NextBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const activeColor = theme.isDark ? theme['c-font'] : theme['c-primary'];
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <EffectControlButton
      icon="nextMusic"
      size={size}
      color={activeColor}
      onPress={handlePlayNext}
      style={styles.cotrolBtn}
    />
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const activeColor = theme.isDark ? theme['c-font'] : theme['c-primary'];
  const isPlay = useIsPlay()
  return (
    <EffectControlButton
      icon={isPlay ? 'pause' : 'play'}
      size={size}
      color={activeColor}
      onPress={togglePlay}
      style={styles.cotrolBtn}
    />
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  const containerStyle = useMemo(() => {
    return {
      ...styles.conatiner,
      maxHeight,
    }
  }, [maxHeight])
  const size = Math.min(
    Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE),
    MAX_SIZE,
    maxHeight
  )

  return (
    <View style={containerStyle}>
      <PrevBtn size={size} />
      <TogglePlayBtn size={size} />
      <NextBtn size={size} />
    </View>
  )
}

const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 22,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
