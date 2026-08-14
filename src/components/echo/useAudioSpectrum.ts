/**
 * useAudioSpectrum - 实时音频频谱 Hook (原生模块 AudioSpectrum)
 * 监听 onSpectrum 事件, 返回 64 bins 归一化频谱 (0-1)
 * 自动请求 RECORD_AUDIO 权限 (Visualizer 采集必需)
 */
import { useEffect, useRef, useState } from 'react'
import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native'

const module = NativeModules.AudioSpectrum as any
const emitter = module ? new NativeEventEmitter(module) : null

export const useAudioSpectrum = () => {
  const [bins, setBins] = useState<number[] | null>(null)
  const [available, setAvailable] = useState(!!module)
  const [error, setError] = useState<string | null>(null)
  const binsRef = useRef<number[] | null>(null)

  // 启动: 先申请权限再 start
  useEffect(() => {
    if (!module) return
    let stopped = false
    const start = async () => {
      try {
        let granted = true
        if (Platform.OS === 'android') {
          granted = await PermissionsAndroid.request(
            'android.permission.RECORD_AUDIO',
            {
              title: '频谱采集权限',
              message: '需要录音权限以分析当前播放音乐的频谱(仅分析不录音)',
              buttonPositive: '允许',
              buttonNegative: '拒绝',
            },
          ) === PermissionsAndroid.RESULTS.GRANTED
        }
        if (stopped) return
        if (!granted) {
          setError('RECORD_AUDIO 权限被拒绝, 频谱使用模拟数据')
          return
        }
        await module.start() // Promise: 失败会 reject
      } catch (e) {
        if (!stopped) setError('频谱启动失败: ' + String(e))
      }
    }
    void start()
    return () => {
      stopped = true
      try { module.stop() } catch {}
    }
  }, [])

  // 监听频谱事件
  useEffect(() => {
    if (!emitter) return
    const sub = emitter.addListener('onSpectrum', (data: { bins: number[] }) => {
      binsRef.current = data.bins
      setBins(data.bins)
    })
    const errSub = emitter.addListener('onSpectrumError', (data: { error?: string }) => {
      setError(data.error || '频谱模块错误')
    })
    return () => {
      sub.remove()
      errSub.remove()
    }
  }, [])

  return { bins, available, error, getBins: () => binsRef.current }
}

export default useAudioSpectrum
