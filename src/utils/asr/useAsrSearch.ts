import { useState, useCallback, useRef, useEffect } from 'react'
import { getStatus, loadModel, startListening, stopListening } from './manager'

export default function useAsrSearch(onText: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [partialText, setPartialText] = useState('')
  const onTextRef = useRef(onText)
  const initRef = useRef(false)
  onTextRef.current = onText

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    getStatus().then(s => {
      if (!s.modelReady && (s.zipFound || s.modelExtracted)) loadModel().catch(() => {})
    }).catch(() => {})
  }, [])

  const handleStop = useCallback(async () => {
    setListening(false)
    setPartialText('')
    stopListening().then(r => {
      if (r.text) onTextRef.current(r.text)
    }).catch(() => {})
  }, [])

  const handleStart = useCallback(async () => {
    setListening(true)
    setPartialText('')
    startListening().catch(() => { setListening(false); return })
    // 不再做 auto-stop,由 VoicePanel 管理超时和完成回调
  }, [])

  useEffect(() => {
    return () => {
      stopListening().catch(() => {})
    }
  }, [])

  return { listening, partialText, start: handleStart, stop: handleStop }
}
