import { useEffect, useRef, useCallback } from 'react'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { getData } from '@/plugins/storage'
import { startWakeup, stopWakeup } from './manager'

const KEY_ENABLED = 'asr_wake_enabled'
const KEY_WORD = 'asr_wake_word'
const DEFAULT_WAKE = '小乐小乐'

export default function useWakeup(onWake: (text: string) => void) {
  const runningRef = useRef(false)
  const wordRef = useRef(DEFAULT_WAKE)
  const onWakeRef = useRef(onWake)
  onWakeRef.current = onWake

  const restart = useCallback(async (word: string) => {
    if (runningRef.current) await stopWakeup()
    wordRef.current = word
    runningRef.current = true
    startWakeup(word).catch(() => { runningRef.current = false })
  }, [])

  useEffect(() => {
    const emitter = new NativeEventEmitter(NativeModules.AsrModule)
    const sub = emitter.addListener('onAsrWakeup', (event: any) => {
      if (event?.text) onWakeRef.current(event.text)
    })

    const handleSettingChange = (data: { enabled: boolean; word: string }) => {
      if (data.enabled) void restart(data.word)
      else { void stopWakeup(); runningRef.current = false }
    }
    global.app_event?.on?.('wakeSettingChanged', handleSettingChange)

    void getData(KEY_ENABLED).then(async (v: any) => {
      if (v !== '1') return
      const word = (await getData(KEY_WORD)) || DEFAULT_WAKE
      void restart(word)
    })

    return () => {
      sub.remove()
      global.app_event?.off?.('wakeSettingChanged', handleSettingChange)
      void stopWakeup()
      runningRef.current = false
    }
  }, [])

  return { restart }
}
