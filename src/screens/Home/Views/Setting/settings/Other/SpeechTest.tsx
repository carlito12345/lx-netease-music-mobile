import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { View, PermissionsAndroid, Platform } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import ButtonPrimary from '@/components/common/ButtonPrimary'
import { useI18n } from '@/lang'
import { getStatus, loadModel, startListening, stopListening, getPartialResult } from '@/utils/asr/manager'

export default memo(() => {
  const theme = useTheme()
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [result, setResult] = useState('')
  const [listening, setListening] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    getStatus().then(s => {
      if (s.modelReady) { setModelReady(true); setStatus('✅ 模型就绪'); return }
      if (s.modelExtracted) setStatus('模型已解压,正在加载...')
      else if (s.zipFound) setStatus('首次解压约需2分钟...')
      else { setStatus('❌ 未找到 vosk-model-cn.zip'); return }
      loadModel().then(() => {
        const pollProgress = () => {
          getStatus().then(st => {
            if (st.modelReady) { setModelReady(true); setStatus('✅ 模型就绪'); setProgress(null); return }
            if (st.loadProgress != null && st.loadProgress > 0) setProgress(st.loadProgress)
            if (st.loadStatus) setStatus(st.loadStatus)
            timer = setTimeout(pollProgress, 2000)
          }).catch(() => { timer = setTimeout(pollProgress, 2000) })
        }
        timer = setTimeout(pollProgress, 3000)
      }).catch((e: any) => setStatus('❌ ' + (e.message || String(e))))
    }).catch((e: any) => setStatus('❌ ' + (e.message || String(e))))
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  const ensurePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true
    try {
      const ok = await PermissionsAndroid.request('android.permission.RECORD_AUDIO')
      return ok === PermissionsAndroid.RESULTS.GRANTED
    } catch { return false }
  }, [])

  const handleListen = useCallback(async () => {
    if (!(await ensurePermission())) { setResult('❌ 需要录音权限'); return }
    setListening(true)
    setResult('聆听中...')
    startListening().then(() => {
      const poll = () => {
        getPartialResult().then(r => {
          if (r.done) { setListening(false); setResult(r.text || '未识别到语音'); return }
          if (r.text) setResult(r.text)
          pollRef.current = setTimeout(poll, 500)
        }).catch(() => { pollRef.current = setTimeout(poll, 500) })
      }
      pollRef.current = setTimeout(poll, 1000)
    }).catch((e: any) => { setListening(false); setResult('❌ ' + (e.message || String(e))) })
  }, [ensurePermission])

  const handleStop = useCallback(async () => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    stopListening().then(r => { setResult(r.text || '未识别到语音') }).catch(() => {})
    setListening(false)
  }, [])

  return (
    <View style={styles.container}>
      <Text size={13} color={theme['c-font-label']}>{'车机语音识别测试'}</Text>
      <View style={styles.row}>
        {listening ? (
          <ButtonPrimary onPress={handleStop}>{'停止'}</ButtonPrimary>
        ) : modelReady ? (
          <ButtonPrimary onPress={handleListen}>{'开始识别'}</ButtonPrimary>
        ) : null}
      </View>
      {status ? <Text size={12} color={theme['c-font']} style={styles.info}>{status}{progress != null && progress > 0 ? ' (' + progress + '%)' : ''}</Text> : null}
      {result ? <Text size={14} color={theme['c-primary-font']} style={styles.info}>{result}</Text> : null}
    </View>
  )
})

const styles = createStyle({
  container: { paddingHorizontal: 20, paddingVertical: 12 },
  row: { flexDirection: 'row', marginTop: 10 },
  info: { marginTop: 8, lineHeight: 20 },
})
