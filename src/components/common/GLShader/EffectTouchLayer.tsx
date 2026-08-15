/**
 * EffectTouchLayer - 统一特效触控层
 * 全应用唯一 PanResponder: 按当前激活特效分发手势
 * - 单指拖动 → onDrag(x, y, dx, dy) (旋转/涟漪/鼠标)
 * - 双指捏合 → onPinch(delta) + onPinchEnd() (缩放)
 * - 点击(无移动)透传下层控件
 * 消除各特效各自 PanResponder 的冲突与臃肿
 */
import { memo, useRef, type ReactNode } from 'react'
import { View, PanResponder, type ViewStyle } from 'react-native'

export interface EffectTouchHandlers {
  /** 单指拖动: x,y 为 page 坐标, dx/dy 为增量 */
  onDrag?: (x: number, y: number, dx: number, dy: number) => void
  /** 双指捏合: delta 为两指距离增量(px) */
  onPinch?: (delta: number) => void
  /** 双指松开 */
  onPinchEnd?: () => void
}

interface Props extends EffectTouchHandlers {
  style?: ViewStyle
  children: ReactNode
}

const EffectTouchLayer = memo(({ onDrag, onPinch, onPinchEnd, style, children }: Props) => {
  const last = useRef({ x: 0, y: 0, dist: -1, zoomed: false })
  // 最新 handlers(切换特效后即时生效, 避免 PanResponder 闭包捕获旧回调)
  const handlersRef = useRef({ onDrag, onPinch, onPinchEnd })
  handlersRef.current = { onDrag, onPinch, onPinchEnd }

  const panResponder = useRef(
    PanResponder.create({
      // 点击不拦截(透传控件), 滑动接管(捕获阶段, 优先于任何子级 PanResponder)
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        const t = evt.nativeEvent.touches
        const s = { x: t[0]?.pageX ?? 0, y: t[0]?.pageY ?? 0, dist: -1, zoomed: t.length >= 2 }
        if (t.length >= 2) {
          s.dist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY)
        }
        last.current = s
      },
      onPanResponderMove: (evt) => {
        const t = evt.nativeEvent.touches
        const l = last.current
        const h = handlersRef.current
        if (t.length >= 2) {
          // 双指: 缩放
          const dist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY)
          if (l.dist > 0 && h.onPinch) h.onPinch(dist - l.dist)
          l.dist = dist
          l.zoomed = true
        } else if (t.length === 1 && !l.zoomed) {
          // 单指: 拖动
          const x = t[0].pageX
          const y = t[0].pageY
          if (h.onDrag) h.onDrag(x, y, x - l.x, y - l.y)
          l.x = x
          l.y = y
        }
      },
      onPanResponderRelease: () => {
        if (last.current.zoomed && handlersRef.current.onPinchEnd) handlersRef.current.onPinchEnd()
        last.current = { x: 0, y: 0, dist: -1, zoomed: false }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current

  return (
    <View style={style} {...panResponder.panHandlers} collapsable={false}>
      {children}
    </View>
  )
})

export default EffectTouchLayer
