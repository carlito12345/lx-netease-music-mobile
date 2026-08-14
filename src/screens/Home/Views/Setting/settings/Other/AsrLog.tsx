import { memo, useEffect, useState, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { DESIGN } from '@/theme/design'
import { getData, saveData } from '@/plugins/storage'
import { readNativeLog } from '@/utils/asr/manager'

const LOG_KEY = 'asr_op_log'

export default memo(function AsrLog() {
  const theme = useTheme()
  const [log, setLog] = useState('')
  const [nativeLog, setNativeLog] = useState('')
  const [expanded, setExpanded] = useState(false)

  const refresh = useCallback(async () => {
    const data = await getData(LOG_KEY) || ''
    setLog(data)
    try {
      const nl = await readNativeLog()
      setNativeLog(nl)
    } catch (_) { setNativeLog('(无法读取原生日志)') }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const handleClear = useCallback(() => {
    void saveData(LOG_KEY, '')
    setLog('')
    toast('日志已清空')
  }, [])

  if (!expanded) {
    return (
      <TouchableOpacity onPress={() => { setExpanded(true); void refresh() }} style={styles.toggle}>
        <Text size={13} color={theme['c-font']}>📋 语音识别操作日志</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Text size={13} color={theme['c-font']}>📋 语音识别操作日志 ▲</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClear}>
          <Text size={12} color={theme['c-font-label']}>清空</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        <Text size={11} color={theme['c-font-label']} style={styles.logText}>
          {log || '暂无日志'}
        </Text>
        <View style={{ height: DESIGN.spacing.md }} />
        <Text size={11} color={theme['c-font-label']} bold style={{ marginBottom: 4 }}>--- 原生层日志 (asr.log) ---</Text>
        <Text size={10} color={theme['c-font-label']} style={styles.logText}>
          {nativeLog || '(空)'}
        </Text>
      </ScrollView>
    </View>
  )
})

const styles = createStyle({
  container: { marginTop: 8, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  toggle: { paddingVertical: 10 },
  scroll: { maxHeight: 300, backgroundColor: DESIGN.chipBg, borderRadius: DESIGN.radius.sm, padding: DESIGN.spacing.sm },
  logText: { fontFamily: 'monospace', lineHeight: 15 },
})
