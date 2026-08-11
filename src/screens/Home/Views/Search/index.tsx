import { useRef, useEffect, useState, useCallback } from 'react'
import { type LayoutChangeEvent, View, BackHandler } from 'react-native'
import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import searchState, { type SearchType } from '@/store/search/state'
import commonState from '@/store/common/state'
import searchMusicState from '@/store/search/music/state'
import searchSonglistState, { type ListInfoItem } from '@/store/search/songlist/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle, toast } from '@/utils/tools'
import TipList, { type TipListType } from './TipList'
import List, { type ListType } from './List'
import { addHistoryWord, setSearchText as setSearchState } from '@/core/search/search'
import SonglistDetail from '../../../SonglistDetail'
import { COMPONENT_IDS } from "@/config/constant.ts"
import useAsrSearch from '@/utils/asr/useAsrSearch'
import { VoicePanel } from '@/components/VoiceAssistant'

interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist' | 'singer' | 'album'
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const searchTipListRef = useRef<TipListType>(null)
  const listRef = useRef<ListType>(null)
  const layoutHeightRef = useRef<number>(0)
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedList, setSelectedList] = useState<ListInfoItem | null>(null)
  const selectedListRef = useRef(selectedList)
  selectedListRef.current = selectedList

  const [headerKey, setHeaderKey] = useState(Date.now())
  const [overlayVisible, setOverlayVisible] = useState(false)

  // 语音搜索 - 识别结果回调
  const asr = useAsrSearch(useCallback((text) => {
    setOverlayVisible(false)
    if (!text.trim()) return
    headerBarRef.current?.setText(text.trim())
    handleSearch(text.trim())
  }, []))

  // overlayVisible 跟随 listening 状态
  useEffect(() => {
    setOverlayVisible(asr.listening)
  }, [asr.listening])

  useEffect(() => {
    const onBackPress = () => {
      if (selectedListRef.current) {
        const lastScreen = commonState.componentIds[commonState.componentIds.length - 1]
        if (lastScreen && lastScreen.name !== COMPONENT_IDS.home) return false
        setSelectedList(null)
        return true
      }
      return false
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (!selectedList && searchState.searchText) {
      setHeaderKey(Date.now())
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, searchInfo.current.searchType)
    }
  }, [selectedList, searchState.searchText])

  // 语音搜索: 监听 triggerSearch 事件, 收到后直接加载
  useEffect(() => {
    const handler = (text: string) => {
      if (!text.trim()) return
      headerBarRef.current?.setText(text.trim())
      listRef.current?.loadList(text.trim(), searchInfo.current.source, searchInfo.current.searchType)
      searchState.searchText = text.trim()
    }
    global.app_event.on('triggerSearch', handler)
    return () => { global.app_event.off('triggerSearch', handler) }
  }, [])

  const handleSearch: HeaderBarProps['onSearch'] = useCallback((text) => {
    if (!text.trim()) return
    setSearchState(text.trim())
    addHistoryWord(text.trim())
    listRef.current?.loadList(text.trim(), searchInfo.current.source, searchInfo.current.searchType)
  }, [])

  const handleTipSearch: HeaderBarProps['onTipSearch'] = useCallback((text) => {
    headerBarRef.current?.setText(text)
    handleSearch(text)
  }, [handleSearch])

  const handleSourceChange = useCallback((source: LX.OnlineSource | 'all') => {
    searchInfo.current.source = source
    if (searchState.searchText) {
      listRef.current?.loadList(searchState.searchText, source, searchInfo.current.searchType)
    }
  }, [])

  const handleHideTipList = useCallback(() => {
    searchTipListRef.current?.hide()
  }, [])

  const handleShowTipList = useCallback(() => {
    searchTipListRef.current?.show()
  }, [])

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }, [])

  const handleOpenDetail = useCallback((item: ListInfoItem) => {
    setSelectedList(item)
  }, [])

  return (
    <View style={styles.container}>
      <VoicePanel
        visible={overlayVisible}
        onText={(text) => {
          asr.stop()
          setOverlayVisible(false)
          if (text) {
            headerBarRef.current?.setText(text.trim())
            handleSearch(text.trim())
          }
        }}
      />
      {!selectedList && (
        <HeaderBar
          key={headerKey}
          ref={headerBarRef}
          onSourceChange={handleSourceChange}
          onTipSearch={handleTipSearch}
          onSearch={handleSearch}
          onHideTipList={handleHideTipList}
          onShowTipList={handleShowTipList}
          onVoicePress={() => {
            if (asr.listening) { asr.stop(); setOverlayVisible(false) }
            else { asr.start() }
          }}
          voiceListening={asr.listening}
        />
      )}
      <View style={styles.content} onLayout={handleLayout}>
        {selectedList
          ? <SonglistDetail
            componentId={commonState.componentIds.find(c => c.name === COMPONENT_IDS.home)?.id}
            info={selectedList} onBack={() => setSelectedList(null)}
          />
          : (
            <>
              <TipList ref={searchTipListRef} onSearch={handleSearch} />
              <List ref={listRef} onSearch={handleSearch} onOpenDetail={handleOpenDetail} />
            </>
          )
        }
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
