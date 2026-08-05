/**
 * MusicList - 本地音乐列表组件(完整组件)
 * 封面 + 歌名/歌手 + 码率/时长, 参考下载管理器排版
 */
import { memo, useCallback } from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import type { ScannedFile } from './Scanner'

interface Props {
  files: ScannedFile[]
  source: string
}

const formatTime = (sec?: number): string => {
  if (!sec || isNaN(sec)) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const formatBitrate = (bitrate?: string): string => {
  if (!bitrate) return ''
  const num = parseInt(bitrate)
  if (isNaN(num)) return bitrate
  return num >= 1000 ? `${(num / 1000).toFixed(0)}kbps` : `${num}kbps`
}

export default memo(({ files, source }: Props) => {
  const theme = useTheme()

  const handlePlayFromIndex = useCallback(async (index: number) => {
    if (!files.length) return
    try {
      const musicList = files.map(f => {
        const ext = f.name.includes('.') ? f.name.split('.').pop() || '' : ''
        return {
          id: f.path,
          name: f.name.replace(/\.[^/.]+$/, ''),
          singer: f.singer || source,
          source: 'local' as const,
          quality: 'unknown',
          interval: f.interval ? formatTime(f.interval) : null,
          meta: { filePath: f.path, ext, picUrl: f.pic || '' },
        }
      })
      await setTempList('local_temp', musicList as any)
      await playList(LIST_IDS.TEMP, index)
    } catch (err: any) {
      toast(`播放失败: ${err.message}`)
    }
  }, [files, source])

  const renderItem = ({ item, index }: { item: ScannedFile; index: number }) => {
    const title = item.name.replace(/\.[^/.]+$/, '')
    const singer = item.singer || source
    const time = formatTime(item.interval)
    const bitrate = formatBitrate(item.bitrate)
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handlePlayFromIndex(index)}
        activeOpacity={0.7}
      >
        <Image url={item.pic || ''} style={styles.artwork} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={{ fontSize: 14, color: theme['c-font'] }}>{title}</Text>
          <View style={styles.detailsRow}>
            <Text numberOfLines={1} style={{ fontSize: 11, color: theme['c-font-label'] }}>{singer}</Text>
            {bitrate ? <Text style={{ fontSize: 11, color: theme['c-font-label'] }}> • {bitrate}</Text> : null}
            {time ? <Text style={{ fontSize: 11, color: theme['c-font-label'] }}> • {time}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.path}
      renderItem={renderItem}
      style={styles.list}
    />
  )
})

const styles = createStyle({
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  artwork: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
    gap: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
})
