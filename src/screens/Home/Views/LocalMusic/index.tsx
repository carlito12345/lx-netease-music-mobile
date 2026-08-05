/**
 * LocalMusic - 本地音乐播放器(完整组件)
 * 指定文件夹扫描 / 全量扫描(递归子文件夹) / USB 切换 / 播放列表
 */
import { memo, useCallback, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { scanRecursive, scanFull, readFileMetadata, saveScanCache, loadScanCache, type ScannedFile } from './components/Scanner'
import { useEffect } from 'react'
import USBSelector from './components/USBSelector'
import MusicList from './components/MusicList'
import EmbedInfo from './components/EmbedInfo'

export default memo(() => {
  const theme = useTheme()
  const [files, setFiles] = useState<ScannedFile[]>([])
  const [source, setSource] = useState('本地文件')
  const [scanning, setScanning] = useState(false)
  const [minSizeKB, setMinSizeKB] = useState(100)
  const choosePathRef = useRef<ChoosePathType>(null)

  // 启动时加载缓存
  useEffect(() => {
    void loadScanCache().then(cached => {
      if (cached.length) setFiles(cached)
    })
  }, [])

  const handleScan = useCallback(async (dirPath: string) => {
    if (scanning) return
    setScanning(true)
    try {
      const audioFiles = await scanRecursive(dirPath, undefined, minSizeKB * 1024)
      // 读取元数据(封面/码率/时长)
      const withMeta = await Promise.all(audioFiles.map(f => readFileMetadata(f)))
      setFiles(withMeta)
      setSource('本地文件')
      await saveScanCache(withMeta)
      toast(`找到 ${withMeta.length} 个音频文件`)
    } catch (err: any) {
      toast(`扫描失败: ${err.message}`)
    }
    setScanning(false)
  }, [scanning])

  const handleScanFull = useCallback(async () => {
    if (scanning) return
    setScanning(true)
    try {
      const audioFiles = await scanFull(undefined, minSizeKB * 1024)
      // 读取元数据(封面/码率/时长)
      const withMeta = await Promise.all(audioFiles.map(f => readFileMetadata(f)))
      setFiles(withMeta)
      setSource('本地文件')
      await saveScanCache(withMeta)
      toast(`全量扫描完成, 找到 ${withMeta.length} 个音频文件`)
    } catch (err: any) {
      toast(`全量扫描失败: ${err.message}`)
    }
    setScanning(false)
  }, [scanning])

  const handleCustomDir = useCallback(() => {
    choosePathRef.current?.show({
      title: '选择音频目录',
      dirOnly: true,
    })
  }, [])

  const handleConfirmPath = useCallback((path: string) => {
    void handleScan(path)
  }, [handleScan])

  const handleUsbFiles = useCallback((usbFiles: ScannedFile[], usbSource: string) => {
    setFiles(usbFiles)
    setSource(usbSource)
  }, [])

  // 嵌入完成后刷新列表(重新读取封面等元数据)
  const handleEmbedComplete = useCallback(async () => {
    const refreshed = await Promise.all(files.map(f => readFileMetadata(f)))
    setFiles(refreshed)
    await saveScanCache(refreshed)
    toast('列表已刷新')
  }, [files])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 16, color: theme['c-primary-font'] }}>本地音乐</Text>
        {files.length > 0 && (
          <Text style={{ fontSize: 12, color: theme['c-font-label'] }}>{files.length} 个文件</Text>
        )}
      </View>

      {/* USB 切换入口 */}
      <USBSelector onFilesFound={handleUsbFiles} />

      {/* 过滤设置 */}
      <View style={styles.filterRow}>
        <Text style={{ fontSize: 12, color: theme['c-font-label'] }}>过滤小于</Text>
        {[50, 100, 200, 500].map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.filterChip, { backgroundColor: minSizeKB === v ? theme['c-primary'] : theme['c-primary-alpha-900'] }]}
            onPress={() => setMinSizeKB(v)}
          >
            <Text style={{ fontSize: 12, color: minSizeKB === v ? '#fff' : theme['c-font'] }}>{v}K</Text>
          </TouchableOpacity>
        ))}
        <Text style={{ fontSize: 12, color: theme['c-font-label'] }}>的音频</Text>
      </View>

      {/* 嵌入信息工具 */}
      <EmbedInfo files={files} onComplete={handleEmbedComplete} />

      {/* 扫描按钮 */}
      <View style={styles.scanBtns}>
        <TouchableOpacity style={[styles.scanBtn, scanning && { opacity: 0.5 }]} onPress={handleScanFull} disabled={scanning}>
          <Text style={{ fontSize: 13, color: theme['c-primary'] }}>{scanning ? '扫描中...' : '全量扫描'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scanBtn, scanning && { opacity: 0.5 }]} onPress={handleCustomDir} disabled={scanning}>
          <Text style={{ fontSize: 13, color: theme['c-primary'] }}>选择目录</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 20, color: theme['c-font-label'] }}>♪</Text>
          <Text style={{ fontSize: 14, color: theme['c-font-label'], marginTop: 8 }}>
            扫描本地音乐文件后, 点击歌曲即可播放
          </Text>
        </View>
      ) : (
        <MusicList files={files} source={source} />
      )}
      <ChoosePath ref={choosePathRef} onConfirm={handleConfirmPath} />
    </View>
  )
})

const styles = createStyle({
  container: { flex: 1, padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scanBtns: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  scanBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(128,128,128,0.08)', borderRadius: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
})
