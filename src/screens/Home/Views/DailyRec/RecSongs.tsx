import { memo, useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import ChromaGrid, { type ChromaGridItem, type ChromaGridRef } from '@/components/ChromaGrid'
import wyApi from '@/utils/musicSdk/wy'
import musicDetailApi from '@/utils/musicSdk/wy/musicDetail'
import { useSettingValue } from '@/store/setting/hook'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { autoSaveDailyPlaylist, handlePlay } from './listAction'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import {
  getDailyRecCache,
  saveDailyRecCache,
  clearDailyRecCache,
} from '@/utils/data'
import { getDailyRecSongsCache, setDailyRecSongsCache, clearDailyRecSongsCache } from '@/core/cache'
import playerState from '@/store/player/state'
import listState from '@/store/list/state'
import { LIST_IDS } from '@/config/constant'


import { crashLog } from '@/utils/crashLog'
import type { StylizedSelection } from './StylizedModal'

const BATCH_SIZE = 8

const similarSongsFetcher = {
  isFetching: false,
  currentDailyRecId: null as string | null,
}

interface RecSongsProps {
  isStylized?: boolean
  stylizedSelection?: StylizedSelection | null
}

export default memo(({ isStylized, stylizedSelection }: RecSongsProps) => {
  useEffect(() => {
    crashLog('[RecSongs] mounted')
    return () => crashLog('[RecSongs] unmounted')
  }, [])
  const gridRef = useRef<ChromaGridRef>(null)
  const [list, setList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const listRef = useRef(list)
  listRef.current = list
  const t = useI18n()
  const cookie = useSettingValue('common.wy_cookie')
  const playerMusicInfo = usePlayerMusicInfo()
  const theme = useTheme()
  const [isAllSimilarSongsFetched, setIsAllSimilarSongsFetched] = useState(false)

  useEffect(() => {
    const handleJumpPosition = () => {
      const listId = playerState.playMusicInfo.listId === LIST_IDS.TEMP
        ? listState.tempListMeta.id
        : playerState.playMusicInfo.listId

      if (!listId?.startsWith('dailyrec_wy')) return

      const musicInfo = playerState.playMusicInfo.musicInfo
      if (musicInfo) {
        const index = listRef.current.findIndex(s => s.id === musicInfo.id)
        if (index > -1) gridRef.current?.scrollToIndex(index)
      }
    }

    global.app_event.on('jumpListPosition', handleJumpPosition)
    return () => {
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [])


  useEffect(() => {
    if (!cookie) {
      if (isLoading) {
        toast('请先设置网易云 Cookie')
        setIsLoading(false)
      }
      setList([])
      return
    }

    if (isStylized && stylizedSelection) {
      setIsLoading(true)
      wyApi.dailyRec.saveStylizedTag(cookie, stylizedSelection.categoryId, stylizedSelection.tagIds).then(() => {
        return wyApi.dailyRec.getStylizedList(cookie)
      }).then((result: any) => {
        setList(result.list)
      }).catch((err: any) => {
        console.error(err)
        toast(t('load_failed'), 'long')
      }).finally(() => {
        setIsLoading(false)
      })
      return
    }

    const cachedSongs = getDailyRecSongsCache()
    if (cachedSongs) {
      setTimeout(() => {
        setList(cachedSongs)
        setIsLoading(false)
      }, 0)
    } else {
      setIsLoading(true)
      wyApi.dailyRec.getList(cookie).then(async result => {
        setList(result.list)
        setDailyRecSongsCache(result.list)

        if (!result.list || result.list.length === 0) {
          setIsLoading(false)
          return
        }

        void autoSaveDailyPlaylist(result.list)
        const currentDailyRecId = result.list[0].id

        if (similarSongsFetcher.isFetching) {
          console.log('后台任务已在运行,本次加载跳过')
          return
        }

        similarSongsFetcher.isFetching = true
        similarSongsFetcher.currentDailyRecId = currentDailyRecId
        console.log(`开始处理日推相似歌曲获取任务,日推ID: ${currentDailyRecId}`)
        let cache = await getDailyRecCache()
        if (!cache || cache.dailyRecId !== currentDailyRecId) {
          console.log('缓存不存在或日推ID已变更,重新获取')
          await clearDailyRecCache()
          cache = {
            dailyRecId: currentDailyRecId,
            items: result.list.map(song => ({
              dailySong: song,
              similarSongs: [],
              fetchStatus: 'pending',
            })),
          }
          await saveDailyRecCache(cache)
        }

        const songsToFetch = cache.items.filter(item => item.fetchStatus === 'pending').map(item => item.dailySong)

        if (songsToFetch.length === 0) {
          console.log('所有相似歌曲均已获取,无需操作')
          setIsAllSimilarSongsFetched(true)
          similarSongsFetcher.isFetching = false
          setIsLoading(false)
          return
        }

        console.log(`发现 ${songsToFetch.length} 首歌曲的相似推荐未获取,开始后台任务...`)
        setIsAllSimilarSongsFetched(false)
        const allDailySongIds = new Set(result.list.map(s => s.id))

        const processQueue = async () => {
          const batch = songsToFetch.splice(0, BATCH_SIZE)
          if (batch.length === 0) {
            setIsAllSimilarSongsFetched(true)
            similarSongsFetcher.isFetching = false
            console.log('所有相似歌曲批次处理完成。')
            return
          }

          if (similarSongsFetcher.currentDailyRecId !== currentDailyRecId) {
            console.log("日推ID已变更,终止旧的后台任务。")
            similarSongsFetcher.isFetching = false
            return
          }

          const promises = batch.map(song => wyApi.dailyRec.getSimilarSongs(song.meta.songId).catch(() => []))
          const results = await Promise.all(promises)

          const currentCache = await getDailyRecCache()
          if (!currentCache || currentCache.dailyRecId !== currentDailyRecId) return

          for (let i = 0; i < batch.length; i++) {
            const dailySong = batch[i]
            const similarSongsRaw = results[i]
            const cacheItem = currentCache.items.find(item => item.dailySong.id === dailySong.id)

            if (!cacheItem) continue

            if (similarSongsRaw.length > 0) {
              const uniqueSimilarSongs = similarSongsRaw.filter(s => !allDailySongIds.has(s.id))
              uniqueSimilarSongs.forEach(ns => allDailySongIds.add(ns.id))
              if (uniqueSimilarSongs.length > 0) {
                const detailedSongs = await musicDetailApi.filterList({ songs: uniqueSimilarSongs, privileges: [] })
                const existingSimilarIds = new Set(cacheItem.similarSongs.map(s => s.id))
                const songsToAppend = detailedSongs.filter(s => !existingSimilarIds.has(s.id))
                if (songsToAppend.length > 0) {
                  cacheItem.similarSongs.push(...songsToAppend)
                }
              }
            }
            cacheItem.fetchStatus = 'fetched'
          }

          await saveDailyRecCache(currentCache)
          console.log(`批次完成,已更新 ${batch.length} 首歌曲的相似推荐缓存。`)
          if (songsToFetch.length > 0) {
            setTimeout(processQueue, 2000)
          } else {
            setIsAllSimilarSongsFetched(true)
            similarSongsFetcher.isFetching = false
            console.log('所有相似歌曲批次处理完成。')
          }
        }

        await processQueue()
      }).catch(err => {
        console.error(err)
        toast(t('load_failed'), 'long')
      }).finally(() => {
        setIsLoading(false)
      })
    }
  }, [t, cookie, isStylized, stylizedSelection])

  useEffect(() => {
    const handleReplaceMusic = (oldMusicInfoId: string, newMusicInfo: LX.Music.MusicInfoOnline | null) => {
      const currentList = listRef.current
      if (!currentList) return
      const index = currentList.findIndex(s => s.id === oldMusicInfoId)
      if (index > -1) {
        const newList = [...currentList]
        if (newMusicInfo) {
          newList.splice(index, 1, newMusicInfo)
        } else {
          newList.splice(index, 1)
        }
        setList(newList)
      }
    }

    global.list_event.on('daily_rec_music_replace', handleReplaceMusic)
    return () => {
      global.list_event.off('daily_rec_music_replace', handleReplaceMusic)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (!cookie) {
      toast('请先设置网易云 Cookie')
      return
    }
    setIsRefreshing(true)

    if (isStylized && stylizedSelection) {
      wyApi.dailyRec.saveStylizedTag(cookie, stylizedSelection.categoryId, stylizedSelection.tagIds).then(() => {
        return wyApi.dailyRec.getStylizedList(cookie)
      }).then((result: any) => {
        setList(result.list)
      }).catch((err: any) => {
        console.error(err)
        toast(t('load_failed'), 'long')
      }).finally(() => {
        setIsRefreshing(false)
      })
      return
    }

    clearDailyRecSongsCache()
    wyApi.dailyRec.getList(cookie).then(result => {
      setList(result.list)
      setDailyRecSongsCache(result.list)
      if (result.list && result.list.length > 0) {
        void autoSaveDailyPlaylist(result.list)
      }
    }).catch(err => {
      console.error(err)
      toast(t('load_failed'), 'long')
    }).finally(() => {
      setIsRefreshing(false)
    })
  }, [cookie, t, isStylized, stylizedSelection])

  const handleFindMore = async() => {
    const cache = await getDailyRecCache()
    const allSimilarSongs = cache?.items.flatMap(item => item.similarSongs) ?? []

    if (allSimilarSongs.length === 0) {
      toast('暂无相似歌曲推荐')
      return
    }

    const uniqueSongs = Array.from(new Map(allSimilarSongs.map(song => [song.id, song])).values())

    navigations.pushSimilarSongsScreen(commonState.componentIds[commonState.componentIds.length - 1]?.id!, uniqueSongs)
  }

  // 品质标签(与 OnlineList/ListItem 的 useQualityTag 一致)
  const getQuality = (musicInfo: LX.Music.MusicInfoOnline): string | undefined => {
    const meta = musicInfo?.meta as LX.Music.MusicInfoMeta_online | undefined
    const qualitys = meta?._qualitys ?? {}
    if (qualitys.hires) return 'Hi-Res'
    if (qualitys.flac) return '无损'
    if (qualitys['320k']) return '320K'
    return undefined
  }

  const gridItems = useMemo<ChromaGridItem[]>(() => {
    return list.map((item, index) => ({
      key: item.id,
      image: (item.meta as LX.Music.MusicInfoMeta_online | undefined)?.picUrl || undefined,
      title: item.name,
      subtitle: item.singer,
      duration: item.interval || undefined,
      isPlaying: playerMusicInfo.id === item.id,
      quality: getQuality(item),
      onPress: () => {
        crashLog(`[RecSongs] play click index=${index} id=${item.id} name=${item.name}`)
        handlePlay(listRef.current, index).catch(err => {
          crashLog(`[RecSongs] play failed index=${index} err=${err?.message ?? err}`)
          toast(`播放失败: ${err?.message ?? err}`)
        })
      },
    }))
  }, [list, playerMusicInfo.id])

  const ListFooter = () => {
    if (isStylized || isLoading || !isAllSimilarSongsFetched) return null
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <TouchableOpacity onPress={handleFindMore}>
          <Text color={theme['c-font']} size={14}>更多相似歌曲</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ChromaGrid
        ref={gridRef}
        items={gridItems}
        columns={2}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={ListFooter}
      />
    </View>
  )
})
