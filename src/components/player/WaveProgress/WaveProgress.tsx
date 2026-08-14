/**
 * WaveProgress - 拱形进度条(Glass Audio Player 风格)
 * react-native-svg 实现
 * 静态: 水平直线(已播白粗/未播灰细)
 * 拖动: 手指位置处拱起为最高点, 两侧平滑回落(弹性流体感)
 * 白色圆点滑块 + 拖动浮动时间
 */
import { memo, useState, useCallback, useRef } from 'react'
import { View, PanResponder, Text, type LayoutChangeEvent } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { createStyle } from '@/utils/tools'
import { useDrag } from '@/utils/hooks/useDrag'

interface Props {
  progress: number
  duration: number
  buffered?: number
  nowTimeStr?: string
  trackColor?: string
  fillColor?: string
  onSeek?: (progress: number) => void
}

const styles = createStyle({
  container: {
    height: 76,
    justifyContent: 'center',
  },
  timeTag: {
    position: 'absolute',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
})

const WaveProgress = memo(({
  progress,
  duration,
  buffered = 0,
  nowTimeStr = '',
  trackColor = '#ffffff',
  fillColor = '#ffffff',
  onSeek,
}: Props) => {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const { onLayout: dragOnLayout, onDragStart, onDragEnd, onDrag } = useDrag(
    (p) => onSeek?.(p),
    (d) => setDragActive(d),
    (p) => setDragProgress(p),
  )

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setSize({ w: width, h: height })
    dragOnLayout(e)
  }, [dragOnLayout])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderRelease: () => onDragEnd(),
      onPanResponderTerminate: () => onDragEnd(),
    }),
  ).current

  if (size.w === 0) {
    return <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers} />
  }

  const displayProgress = Math.min(Math.max(dragProgress ?? progress, 0), 1)
  const thumbX = displayProgress * size.w
  const w = size.w
  const midY = size.h * 0.58

  // 拱形高度: 拖动时手指处为最高点
  const lift = dragActive ? size.h * 0.4 : 0
  const sigma = 30 // 拱形宽度: 约一指宽(固定像素)

  // 高斯拱形曲线: 进度点处最高, 两侧平滑回落
  const curveY = (x: number) => {
    const dist = x - thumbX
    return midY - lift * Math.exp(-(dist * dist) / (2 * sigma * sigma))
  }

  // 采样生成路径
  const buildPath = (x0: number, x1: number) => {
    const seg = Math.max(16, Math.floor((x1 - x0) / 2))
    let d = `M ${x0.toFixed(1)} ${curveY(x0).toFixed(1)}`
    for (let i = 1; i <= seg; i++) {
      const x = x0 + ((x1 - x0) * i) / seg
      d += ` L ${x.toFixed(1)} ${curveY(x).toFixed(1)}`
    }
    return d
  }

  const fillPath = buildPath(0, thumbX)
  const trackPath = buildPath(thumbX, w)
  const thumbY = curveY(thumbX)

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {/* 浮动时间(拖动时) */}
      {(dragActive && nowTimeStr) ? (
        <Text
          style={[
            styles.timeTag,
            {
              left: Math.max(4, Math.min(thumbX - 16, size.w - 40)),
              top: curveY(thumbX) - 22, // 波峰上方
            },
          ]}
          numberOfLines={1}
        >
          {nowTimeStr}
        </Text>
      ) : null}

      <Svg width={w} height={size.h} style={{ position: 'absolute', left: 0, top: 0 }}>
        {/* 未播: 灰色细线 */}
        <Path d={trackPath} stroke={trackColor} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.35} />
        {/* 已播: 白色粗线 */}
        <Path d={fillPath} stroke={fillColor} strokeWidth={3} strokeLinecap="round" fill="none" />
        {/* 滑块: 白色圆点 + 外圈光晕 */}
        <Circle cx={thumbX} cy={thumbY} r={6} fill="#fff" />
        <Circle cx={thumbX} cy={thumbY} r={12} fill="rgba(255,255,255,0.2)" />
      </Svg>
    </View>
  )
})

export default WaveProgress
