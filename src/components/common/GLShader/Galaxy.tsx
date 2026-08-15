/**
 * Galaxy - 星河星云(粒子星系 + 粒子歌词 + 手势交互)
 * 手势(捕获阶段 PanResponder, 在父层 liquidChromePan 之前):
 * - 单指拖动: 旋转星系
 * - 双指捏合: 拉近镜头, 放开归位
 */
import { memo, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { requireNativeComponent, UIManager, findNodeHandle, View, type ViewStyle } from 'react-native'
import { useAudioSpectrum } from '@/components/echo/useAudioSpectrum'

const NativeGalaxyView = requireNativeComponent<any>('GalaxyView')

export interface GalaxyHandle {
  setLyric: (text: string) => void
  setRot: (dx: number, dy: number) => void
  addZoom: (delta: number) => void
  resetZoom: () => void
}

interface Props {
  style?: ViewStyle
}

const Galaxy = memo(forwardRef<GalaxyHandle, Props>(({ style }, ref) => {
  const viewRef = useRef<any>(null)
  const { bins } = useAudioSpectrum()
  const binsRef = useRef<number[]>(new Array(16).fill(0.1))
  if (bins && bins.length >= 16) binsRef.current = bins.slice(0, 16)

  // 手势状态
  const lastTouch = useRef({ x: 0, y: 0, dist: -1, zoomed: false })

  const send = useCallback((cmd: string, args: any[]) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GalaxyView').Commands[cmd], args)
  }, [])

  const setBands = useCallback((bands: number[]) => send('setBands', [bands]), [send])
  const setLyric = useCallback((text: string) => send('setLyric', [text]), [send])
  const setRot = useCallback((dx: number, dy: number) => send('setRot', [dx, dy]), [send])
  const addZoom = useCallback((z: number) => send('addZoom', [z]), [send])
  const resetZoom = useCallback(() => send('resetZoom', []), [send])

  useImperativeHandle(ref, () => ({ setLyric, setRot, addZoom, resetZoom }), [setLyric, setRot, addZoom, resetZoom])

  // 频谱推流
  useEffect(() => {
    let raf = 0
    const push = () => {
      setBands(binsRef.current)
      raf = requestAnimationFrame(push)
    }
    raf = requestAnimationFrame(push)
    return () => cancelAnimationFrame(raf)
  }, [setBands])

  return (
    <View style={style} collapsable={false}>
      <NativeGalaxyView
        ref={viewRef}
        style={{ flex: 1 }}
        rotSpeed={0.04}
      />
    </View>
  )
}))

export default Galaxy
