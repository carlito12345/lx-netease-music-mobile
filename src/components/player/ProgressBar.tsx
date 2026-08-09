import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder, Vibration } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
// import { AppColors } from '@/theme'

const DefaultBar = memo(() => {
  const theme = useTheme()

  return (
    <View
      style={{
        ...styles.progressBar,
        backgroundColor: theme['c-primary-light-300-alpha-800'],
        position: 'absolute',
        width: '100%',
        left: 0,
        top: 0,
      }}
    ></View>
  )
})

const BufferedBar = memo(({ progress }: { progress: number }) => {
  // console.log(bufferedProgress)
  const theme = useTheme()
  return (
    <View
      style={{
        ...styles.progressBar,
        backgroundColor: theme['c-primary-light-400-alpha-700'],
        position: 'absolute',
        width: `${progress * 100}%`,
        left: 0,
        top: 0,
      }}
    ></View>
  )
})

const PreassBar = memo(
  ({
    onDragState,
    setDragProgress,
    onSetProgress,
  }: {
    onDragState: (drag: boolean) => void
    setDragProgress: (progress: number) => void
    onSetProgress: (progress: number) => void
  }) => {
    const { onLayout, onDragStart, onDragEnd, onDrag } = useDrag(
      onSetProgress,
      onDragState,
      setDragProgress
    )
    // const handlePress = useCallback((event: GestureResponderEvent) => {
    //   onPress(event.nativeEvent.locationX)
    // }, [onPress])

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

        // onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
          onDrag(gestureState.dx)
        },
        onPanResponderGrant: (evt, gestureState) => {
          // console.log(evt.nativeEvent.locationX, gestureState)
          onDragStart(gestureState.dx, evt.nativeEvent.locationX)
        },
        onPanResponderRelease: () => {
          onDragEnd()
        },
        // onPanResponderTerminate: (evt, gestureState) => {
        //   onDragEnd()
        // },
      })
    ).current

    return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
  }
)

const Progress = ({
  progress,
  duration,
  buffered,
}: {
  progress: number
  duration: number
  buffered: number
}) => {
  // const { progress: bufferProgress } = usePlayTimeBuffer()
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  // console.log(progress)
  const progressStr: `${number}%` = `${progress * 100}%`

  const progressDotStyle = useMemo(() => {
    return {
      width: progressDotSize,
      position: 'absolute',
      right: -progressDotSize / 2,
      top: -(progressDotSize - progressHeightSize) / 2,
    } as const
  }, [])

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, [])
  const activeColor = theme.isDark ? theme['c-font'] : theme['c-primary'];

  // 拖动反馈: 开始/结束震动, 拖动中显示时间气泡
  const handleDragState = useCallback((drag: boolean) => {
    setDraging(drag)
    if (drag) Vibration.vibrate(8)
    else Vibration.vibrate(15)
  }, [])

  const dragTimeStr = formatTime(dragProgress * durationRef.current)

  return (
    <View style={styles.progress}>
      <View>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        {draging ? (
          <>
            <View
              style={{
                ...styles.progressBar,
                backgroundColor: activeColor,
                width: progressStr,
                position: 'absolute',
                left: 0,
                top: 0,
              }}
            />
            <View
              style={{
                ...styles.progressBar,
                backgroundColor: activeColor,
                width: `${dragProgress * 100}%`,
                position: 'absolute',
                left: 0,
                top: 0,
              }}
            >
              <Icon
                name="full_stop"
                color={activeColor}
                rawSize={progressDotSize}
                style={progressDotStyle}
              />
            </View>
          </>
        ) : (
          <View
            style={{
              ...styles.progressBar,
              backgroundColor: activeColor,
              width: progressStr,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          >
            <Icon
              name="full_stop"
              color={activeColor}
              rawSize={progressDotSize}
              style={progressDotStyle}
            />
          </View>
        )}
      </View>
      {/* 拖动时间气泡 */}
      {draging ? (
        <View style={styles.bubbleWrap} pointerEvents="none">
          <View style={[styles.bubble, { backgroundColor: theme['c-primary'] }]}>
            <Text size={11} color="#fff" style={styles.bubbleText}>{dragTimeStr}</Text>
          </View>
        </View>
      ) : null}
      <PreassBar
        onDragState={handleDragState}
        setDragProgress={setDragProgress}
        onSetProgress={onSetProgress}
      />
      {/* <View style={{ ...styles.progressBar, height: '100%', width: progressStr }}><Pressable style={styles.progressDot}></Pressable></View> */}
    </View>
  )
}

// 秒 -> mm:ss
const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const progressContentPadding = 10
const progressHeight = 3.6
const progressContentHeight = progressContentPadding * 2 + progressHeight
const progressHeightSize = scaleSizeH(progressHeight)
let progressDotSize = scaleSizeW(progressContentHeight * 0.8)
const styles = createStyle({
  progress: {
    width: '100%',
    height: progressContentHeight,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    zIndex: 1,
  },
  progressBar: {
    height: progressHeight,
    borderRadius: 4,
  },
  pressBar: {
    position: 'absolute',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    left: 0,
    top: 0,
    height: progressContentHeight,
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    width: '100%',
    zIndex: 6,
  },
  bubbleWrap: {
    position: 'absolute',
    top: -26,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bubbleText: {
    fontWeight: '600',
  },
})

export default Progress
