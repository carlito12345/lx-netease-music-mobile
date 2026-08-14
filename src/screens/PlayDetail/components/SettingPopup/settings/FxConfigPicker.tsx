/**
 * FxConfigPicker - 配置文件选择器(RNFS 直读, 绕过 FileSystem SAF 权限限制)
 * 列出 Download/LXMUSIC_Config 下的 json, 点击选择
 */
import { memo, useRef, useState, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react'
import { View, TouchableOpacity, FlatList } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import LoadingMask, { type LoadingMaskType } from '@/components/common/LoadingMask'
import { DESIGN } from '@/theme/design'
import { FX_DIR, listFxConfigs } from './echoFxConfig'

export interface FxConfigPickerType {
  show: () => void
}

interface Props {
  onPick: (path: string, name: string) => void
}

const FxConfigPicker = memo(forwardRef<FxConfigPickerType, Props>(({ onPick }, ref) => {
  const theme = useTheme()
  const dialogRef = useRef<DialogType>(null)
  const loadingRef = useRef<LoadingMaskType>(null)
  const [files, setFiles] = useState<{ name: string; path: string }[]>([])
  const [msg, setMsg] = useState('')

  const refresh = useCallback(async () => {
    try {
      loadingRef.current?.setVisible(true)
      const list = await listFxConfigs()
      setFiles(list)
      setMsg(list.length === 0 ? '目录无配置文件, 请先导出' : '')
    } catch (e) {
      setMsg('读取失败: ' + String(e))
    } finally {
      loadingRef.current?.setVisible(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show() {
      setFiles([])
      setMsg('')
      dialogRef.current?.setVisible(true)
      void refresh()
    },
  }), [refresh])

  useEffect(() => () => { dialogRef.current?.setVisible(false) }, [])

  return (
    <Dialog ref={dialogRef} title="导入配置" height="60%">
      <View style={styles.body}>
        <Text size={11} color={theme['c-font-label']} style={styles.dir}>{FX_DIR}</Text>
        {msg ? <Text size={12} color={theme['c-font-label']} style={styles.msg}>{msg}</Text> : null}
        <FlatList
          data={files}
          keyExtractor={(item) => item.path}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onPick(item.path, item.name)
                dialogRef.current?.setVisible(false)
              }}
            >
              <Text size={13} color={theme['c-font']} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <LoadingMask ref={loadingRef} />
    </Dialog>
  )
}))

const styles = createStyle({
  body: { paddingHorizontal: DESIGN.spacing.xl, flex: 1 },
  dir: { marginBottom: DESIGN.spacing.sm },
  msg: { marginBottom: DESIGN.spacing.sm },
  list: { flex: 1 },
  item: {
    paddingVertical: DESIGN.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: DESIGN.separator,
  },
})

export default FxConfigPicker
