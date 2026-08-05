/**
 * USBSelector - USB 设备切换组件(完整组件)
 * 检测并列出 USB 存储设备, 选择后扫描其音频文件
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { getExternalPaths, startUSBListening, stopUSBListening } from '@/plugins/usb'
import { scanRecursive, type ScannedFile } from './Scanner'

interface Props {
  onFilesFound: (files: ScannedFile[], source: string) => void
}

export default memo(({ onFilesFound }: Props) => {
  const theme = useTheme()
  const [usbPaths, setUsbPaths] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    void loadUsbPaths()
    void startUSBListening((files) => {
      onFilesFound(files, 'USB')
    })
    return () => {
      void stopUSBListening()
    }
  }, [])

  const loadUsbPaths = useCallback(async () => {
    try {
      const paths = await getExternalPaths()
      setUsbPaths(paths)
    } catch {}
  }, [])

  const handleScanUsb = useCallback(async (path: string) => {
    if (scanning) return
    setScanning(true)
    try {
      const files = await scanRecursive(path)
      if (!files.length) {
        toast('USB 设备中没有音频文件')
      } else {
        onFilesFound(files, 'USB')
        toast(`USB: 找到 ${files.length} 个音频文件`)
      }
    } catch (err: any) {
      toast(`USB 扫描失败: ${err.message}`)
    }
    setScanning(false)
  }, [scanning, onFilesFound])

  if (!usbPaths.length) return null

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme['c-primary'], fontSize: 14 }]}>USB 设备</Text>
      {usbPaths.map(path => (
        <TouchableOpacity
          key={path}
          style={[styles.usbItem, { backgroundColor: theme['c-primary-alpha-900'] }]}
          onPress={() => handleScanUsb(path)}
          disabled={scanning}
        >
          <Text style={{ fontSize: 13, color: theme['c-font'] }} numberOfLines={1}>
            {scanning ? '扫描中...' : `📂 ${path}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
})

const styles = createStyle({
  container: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
  },
  usbItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
})
