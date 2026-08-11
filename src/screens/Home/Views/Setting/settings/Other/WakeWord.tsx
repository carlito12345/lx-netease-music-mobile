import { memo, useEffect, useState, useCallback } from 'react'
import { View, TextInput } from 'react-native'
import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { saveData, getData } from '@/plugins/storage'

const KEY_ENABLED = 'asr_wake_enabled'
const KEY_WORD = 'asr_wake_word'
const DEFAULT_WAKE = '小乐小乐'

export default memo(function WakeWord() {
  const theme = useTheme()
  const [enabled, setEnabled] = useState(false)
  const [word, setWord] = useState(DEFAULT_WAKE)

  useEffect(() => {
    getData(KEY_ENABLED).then((v: any) => setEnabled(v === '1'))
    getData(KEY_WORD).then((v: any) => { if (v) setWord(v) })
  }, [])

  const toggle = useCallback((checked: boolean) => {
    setEnabled(checked)
    saveData(KEY_ENABLED, checked ? '1' : '0')
    global.app_event?.emit?.('wakeSettingChanged', { enabled: checked, word })
  }, [word])

  const changeWord = useCallback((text: string) => {
    const v = text.trim().replace(/\s+/g, '')
    setWord(v)
    saveData(KEY_WORD, v)
    if (enabled) global.app_event?.emit?.('wakeSettingChanged', { enabled: true, word: v })
  }, [enabled])

  return (
    <View style={styles.content}>
      <CheckBoxItem check={enabled} onChange={toggle} label="启用语音唤醒" />
      {enabled && (
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: theme['c-font'], borderColor: theme['c-font-label'] + '40', backgroundColor: theme['c-bg-secondary'] || 'rgba(255,255,255,0.06)' }]}
            value={word}
            onChangeText={changeWord}
            placeholder="小乐小乐"
            placeholderTextColor={theme['c-font-label']}
            maxLength={10}
          />
        </View>
      )}
    </View>
  )
})

const styles = createStyle({
  content: { marginBottom: 8 },
  inputRow: { paddingLeft: 20, paddingRight: 20, marginTop: 4 },
  input: { height: 38, borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
})
