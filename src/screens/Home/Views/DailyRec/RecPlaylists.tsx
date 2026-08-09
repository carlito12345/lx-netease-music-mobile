import { memo, useEffect, useState, useCallback, useMemo } from 'react'
import { View, Keyboard } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { toast } from '@/utils/tools'
import wyApi from '@/utils/musicSdk/wy/dailyRec'
import wy from '@/utils/musicSdk/wy/index'
import ChromaGrid, { type ChromaGridItem } from '@/components/ChromaGrid'
import { getDailyRecPlaylistsCache, setDailyRecPlaylistsCache, clearDailyRecPlaylistsCache } from '@/core/cache'

/** 原版 ChromaGrid demo 卡片边框色板 */
const BORDER_PALETTE = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default memo(({ onOpenDetail }: { onOpenDetail: (info: any) => void }) => {
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const cookie = useSettingValue('common.wy_cookie')

  const loadPlaylists = useCallback((isRefresh = false) => {
    if (!cookie) {
      setLoading(false)
      setPlaylists([])
      return
    }

    if (!isRefresh) {
      const cachedPlaylists = getDailyRecPlaylistsCache()
      if (cachedPlaylists) {
        setPlaylists(cachedPlaylists)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    wyApi.getRecPlaylists(cookie).then(async list => {
      const adaptedList =  list
        // .filter(item => !item.name.includes('雷达'))
        .map(item => ({
          id: item.id,
          name: item.name,
          trackCount: item.trackCount,
          coverImgUrl: item.picUrl,
          creator: { nickname: item.creator?.nickname ?? '推荐' },
          playCount: item.playcount,
          description: item.copywriter,
        }))

      let isFirstRadarFound = false
      for (let i = 0; i < adaptedList.length; i++) {
        if (!isFirstRadarFound && adaptedList[i].name.includes('私人雷达') && adaptedList[i].trackCount === 0) {
          isFirstRadarFound = true
          try {
            const detail = await wy.songList.getListDetail(String(adaptedList[i].id), 1)
            if (detail && detail.info) {
              adaptedList[i].name = detail.info.name || adaptedList[i].name
              adaptedList[i].trackCount = detail.total != null ? detail.total : adaptedList[i].trackCount
              adaptedList[i].coverImgUrl = detail.info.img || adaptedList[i].coverImgUrl
            }
          } catch (e) {
            console.log('Failed to fetch radar detail:', e)
          }
        }
      }

      setPlaylists(adaptedList)
      setDailyRecPlaylistsCache(adaptedList)
    }).catch(err => {
      toast(`获取推荐歌单失败: ${err.message}`)
    }).finally(() => {
      setLoading(false)
    })
  }, [cookie])

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  const handleItemPress = (playlistInfo: any) => {
    onOpenDetail(playlistInfo)
  }

  const handleRefresh = () => {
    clearDailyRecPlaylistsCache()
    loadPlaylists(true)
  }

  const gridItems = useMemo<ChromaGridItem[]>(() => {
    return playlists.map((item, i: number) => ({
      key: String(item.id),
      image: item.coverImgUrl,
      title: item.name,
      subtitle: item.trackCount > 0 ? `${item.trackCount} 首` : undefined,
      borderColor: BORDER_PALETTE[i % BORDER_PALETTE.length],
      onPress: () => handleItemPress(item),
    }))
  }, [playlists])

  return (
    <View style={{ flex: 1 }}>
      <ChromaGrid
        items={gridItems}
        columns={2}
        refreshing={loading}
        onRefresh={handleRefresh}
        onScrollBeginDrag={() => Keyboard.dismiss()}
      />
    </View>
  )
})
