import { memo } from 'react'
import { View } from 'react-native'

import WaveProgress from '@/components/player/WaveProgress'
import Status from './Status'
import { useProgress } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useBackgroundColor } from '@/store/backgroundColor'
import { getTextColorByMode } from '@/utils/adaptiveTextColor'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'

// const FONT_SIZE = 13

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  // console.log(timeStr)
  const { textColorMode } = useBackgroundColor()
  const activeColor = getTextColorByMode(textColorMode, theme.isDark)
  return <Text color={activeColor}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  const theme = useTheme()
  const { textColorMode } = useBackgroundColor()
  const activeColor = getTextColorByMode(textColorMode, theme.isDark)
  return <Text color={activeColor}>{timeStr}</Text>
})

export default () => {
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  const buffered = useBufferProgress()

  // console.log('render playInfo')

  return (
    <>
      <View style={styles.progress}>
        <WaveProgress progress={progress} duration={maxPlayTime} buffered={buffered} nowTimeStr={nowPlayTimeStr} onSeek={(p) => {
          global.app_event.setProgress(p * maxPlayTime)
        }} />
      </View>
      <View style={styles.info}>
        <PlayTimeCurrent timeStr={nowPlayTimeStr} />
        <View style={styles.status}>
          <Status />
        </View>
        <PlayTimeMax timeStr={maxPlayTimeStr} />
      </View>
    </>
  )
}

const styles = createStyle({
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    // backgroundColor: '#ccc',
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
})
