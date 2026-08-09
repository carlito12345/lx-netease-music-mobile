import { useEffect, useMemo, useState } from 'react'

import BubbleTabs, { type BubbleTabsType } from '@/components/BubbleTabs'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import { getSearchSetting } from '@/utils/data'
import { useRef } from 'react'

const SEARCH_TYPE_LIST = ['music', 'songlist', 'singer', 'album'] as const

export default () => {
  const t = useI18n()
  const tabsRef = useRef<BubbleTabsType>(null)
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then((info) => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map((type) => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <BubbleTabs
      ref={tabsRef}
      items={list}
      activeId={type}
      onChange={(id) => handleTypeChange(id as SearchType)}
    />
  )
}
