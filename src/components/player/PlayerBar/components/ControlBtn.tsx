import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useHorizontalMode } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import IconButton from '@/components/common/IconButton'

const BTN_SIZE = 24
const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = () => {
  return (
    <IconButton name="prevMusic" size={BTN_SIZE} onPress={handlePlayPrev} />
  )
}

const PlayNextBtn = () => {
  return (
    <IconButton name="nextMusic" size={BTN_SIZE} onPress={handlePlayNext} />
  )
}

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()

  return (
    <IconButton name={isPlay ? 'pause' : 'play'} size={BTN_SIZE} onPress={togglePlay} />
  )
}

export default () => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <>
      {/* <TouchableOpacity activeOpacity={0.5} onPress={toggleNextPlayMode}>
        <Text style={{ ...styles.cotrolBtn }}>
          <Icon name={playModeIcon} style={{ color: theme.secondary10 }} size={18} />
        </Text>
      </TouchableOpacity>
    */}
      {/* {btnPrev} */}
      {isHorizontalMode ? <PlayPrevBtn /> : null}
      <TogglePlayBtn />
      <PlayNextBtn />
    </>
  )
}

const styles = createStyle({
  cotrolBtn: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
