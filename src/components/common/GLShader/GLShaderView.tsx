/**
 * GLShaderView - 原生 GLES20 shader 渲染组件 (Mineradio 同架构)
 * 绕开 skia Canvas 旧架构问题: 原生 GLSurfaceView 渲染
 * props: shaderSource (GLSL ES), interactive (触摸交互), baseColor, amplitude/frequencyX/Y
 * ref: setBands(16频段) / setVolume
 */
import { memo, forwardRef, useImperativeHandle, useRef, useCallback } from 'react'
import { requireNativeComponent, UIManager, findNodeHandle, type StyleProp, type ViewStyle } from 'react-native'

const NativeGLShaderView: any = requireNativeComponent('GLShaderView')

export interface GLShaderViewHandle {
  setBands: (bands: number[]) => void
  setVolume: (volume: number) => void
  setPresence: (v: number) => void
  setBrilliance: (v: number) => void
  setMouse: (x: number, y: number) => void
  addRipple: (x: number, z: number, strength: number) => void
  spawnMeteor: (strength: number) => void
}

export interface DenseParams {
  floating?: number[]
  presence?: number
  brilliance?: number
  camHeight?: number
  camDist?: number
  camSpeed?: number
  fov?: number
  pillarCell?: number
  pillarWidth?: number
  pillarHeight?: number
  metalness?: number
  neon?: number
  palette?: [number, number, number, number, number, number, number, number, number]
  bgColor?: [number, number, number]
}

interface Props {
  shaderSource: string
  interactive?: boolean
  baseColor?: [number, number, number]
  amplitude?: number
  frequencyX?: number
  frequencyY?: number
  metalness?: number
  neon?: number
  params?: DenseParams
  style?: StyleProp<ViewStyle>
}

const GLShaderView = forwardRef<GLShaderViewHandle, Props>(({
  shaderSource,
  interactive = false,
  baseColor = [0.3, 0.5, 0.9],
  amplitude = 0.06,
  frequencyX = 2.0,
  frequencyY = 1.5,
  metalness = 0.8,
  neon = 0.5,
  params,
  style,
}, ref) => {
  const viewRef = useRef<any>(null)

  const setBands = useCallback((bands: number[]) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.setBands, [bands])
  }, [])

  const setPresence = useCallback((presence: number) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.setPresence, [presence])
  }, [])
  const setBrilliance = useCallback((brilliance: number) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.setBrilliance, [brilliance])
  }, [])
  const setVolume = useCallback((volume: number) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.setVolume, [volume])
  }, [])

  const setMouse = useCallback((x: number, y: number) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.setMouse, [x, y])
  }, [])

  const addRipple = useCallback((x: number, z: number, strength: number) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.addRipple, [x, z, strength])
  }, [])

  const spawnMeteor = useCallback((strength: number) => {
    const node = findNodeHandle(viewRef.current)
    if (node == null) return
    UIManager.dispatchViewManagerCommand(node, UIManager.getViewManagerConfig('GLShaderView').Commands.spawnMeteor, [strength])
  }, [])

  useImperativeHandle(ref, () => ({ setBands, setVolume, setPresence, setBrilliance, setMouse, addRipple, spawnMeteor }), [setBands, setVolume, setPresence, setBrilliance, setMouse, addRipple, spawnMeteor])

  return (
    <NativeGLShaderView
      ref={viewRef}
      shaderSource={shaderSource}
      interactive={interactive}
      baseColor={baseColor}
      amplitude={amplitude}
      frequencyX={frequencyX}
      frequencyY={frequencyY}
      metalness={metalness}
      neon={neon}
      camHeight={params?.camHeight ?? 6.5}
      camDist={params?.camDist ?? 12.5}
      camSpeed={params?.camSpeed ?? 0.06}
      fov={params?.fov ?? 1.7}
      pillarCell={params?.pillarCell ?? 0.5}
      pillarWidth={params?.pillarWidth ?? 0.15}
      pillarHeight={params?.pillarHeight ?? 1.0}
      palette={params?.palette}
          bgColor={params?.bgColor}
      presence={params?.presence ?? 0}
      brilliance={params?.brilliance ?? 0}
      style={style}
    />
  )
})

export default GLShaderView
