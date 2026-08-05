/**
 * EmbedInfo - 本地音乐信息嵌入工具(完整组件)
 * 一键下载并嵌入封面/歌词/标签, 带进度显示和超时控制
 */
import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { writeMetadata, writePic, writeLyric, readPic, readLyric } from '@/utils/localMediaMetadata'
import { getPicPath, getLyricInfo } from '@/core/music'
import RNFetchBlob from 'rn-fetch-blob'
import { getFileExtensionFromUrl } from '@/screens/Home/Views/Mylist/MusicList/download/utils'
import { unlink } from '@/utils/fs'
import type { ScannedFile } from './Scanner'

interface Props {
  files: ScannedFile[]
  /** 嵌入完成回调(刷新列表) */
  onComplete?: () => void
}

// 超时控制
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export default memo(({ files, onComplete }: Props) => {
  const theme = useTheme()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleEmbed = useCallback(async () => {
    if (!files.length) {
      toast('请先扫描本地音乐')
      return
    }
    if (processing) return
    setProcessing(true)
    let success = 0
    let failed = 0
    setProgress({ current: 0, total: files.length })
    try {
      // 筛选: 跳过已嵌入封面+歌词的歌曲
      const pendingFiles = []
      for (const file of files) {
        try {
          const [pic, lyric] = await Promise.all([
            readPic(file.path).catch(() => null),
            readLyric(file.path).catch(() => null),
          ])
          // 已有封面且已有歌词 → 已嵌入, 跳过
          if (pic && lyric) continue
          pendingFiles.push(file)
        } catch {
          pendingFiles.push(file)
        }
      }

      if (!pendingFiles.length) {
        toast('所有歌曲已嵌入, 无需重复处理')
        setProcessing(false)
        return
      }

      setProgress({ current: 0, total: pendingFiles.length })
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i]
        setProgress({ current: i + 1, total: pendingFiles.length })
        try {
          // 构造 musicInfo(用于在线匹配)
          const musicInfo = {
            id: file.path,
            name: file.name.replace(/\.[^/.]+$/, ''),
            singer: file.singer || '',
            source: 'wy' as const,
            quality: '128k',
            interval: null,
            meta: { picUrl: '', albumName: file.album || '' },
          } as any

          // 写入标签(本地, 不超时)
          try {
            await writeMetadata(file.path, {
              name: musicInfo.name,
              singer: musicInfo.singer,
              albumName: file.album || '',
            }, true)
          } catch {}

          // 写入封面(带超时)
          try {
            const picUrl = await withTimeout(getPicPath({ musicInfo, isRefresh: true }), 8000)
            if (picUrl) {
              const ext = getFileExtensionFromUrl(picUrl)
              const tempPath = `${RNFetchBlob.fs.dirs.CacheDir}/embed_temp.${ext}`
              await withTimeout(RNFetchBlob.config({ path: tempPath }).fetch('GET', picUrl), 10000)
              await writePic(file.path, tempPath)
              await unlink(tempPath).catch(() => {})
            }
          } catch {}

          // 写入歌词(带超时)
          try {
            const lyrics = await withTimeout(getLyricInfo({ musicInfo, isRefresh: true }), 8000)
            if (lyrics.lyric) {
              await writeLyric(file.path, lyrics.lyric)
            }
          } catch {}

          success++
        } catch {
          failed++
        }
      }
      toast(`嵌入完成: 成功 ${success} 首, 失败 ${failed} 首, 跳过 ${files.length - pendingFiles.length} 首`, 'long')
      onComplete?.()
    } finally {
      setProcessing(false)
      setProgress({ current: 0, total: 0 })
    }
  }, [files, processing])

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: processing ? theme['c-border-background'] : theme['c-primary'] }]}
        onPress={handleEmbed}
        disabled={processing}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 14, color: processing ? theme['c-font-label'] : '#fff' }}>
          {processing
            ? `嵌入中 ${progress.current}/${progress.total}`
            : '一键下载嵌入封面/歌词/标签'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.tip, { color: theme['c-font-label'], fontSize: 11 }]}>
        从网络匹配并写入封面、歌词、标签到本地音频文件
      </Text>
    </View>
  )
})

const styles = createStyle({
  container: {
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: {
    marginTop: 6,
    textAlign: 'center',
  },
})
