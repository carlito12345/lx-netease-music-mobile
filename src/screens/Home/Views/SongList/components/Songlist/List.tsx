import { useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import {View, RefreshControl, Keyboard} from 'react-native'

import { type ListInfoItem } from '@/store/songlist/state'
import { useLayout } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import ChromaGrid, { type ChromaGridItem } from '@/components/ChromaGrid'

/** 原版 ChromaGrid demo 卡片边框色板 */
const BORDER_PALETTE = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

// const MAX_WIDTH = scaleSizeW(110)
const MIN_WIDTH = scaleSizeW(110)
const GAP = scaleSizeW(20)

export interface ListProps {
  onRefresh: () => void
  onLoadMore: () => void
  onOpenDetail: (item: ListInfoItem, index: number) => void
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'

export interface ListType {
  setList: (list: ListInfoItem[], showSource?: boolean) => void
  setStatus: (val: Status) => void
}

export default forwardRef<ListType, ListProps>(({ onRefresh, onLoadMore, onOpenDetail }, ref) => {
  const [currentList, setList] = useState<ListInfoItem[]>([])
  const [showSource, setShowSource] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const { onLayout, width } = useLayout()
  const theme = useTheme()
  // console.log('render songlist')

  useImperativeHandle(ref, () => ({
    setList(list, showSource = false) {
      // rawListRef.current = list
      setList(list)
      setShowSource(showSource)
    },
    setStatus(val) {
      setStatus(val)
    },
  }))

  const handleLoadMore = () => {
    if (status != 'idle') return
    onLoadMore()
  }

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[theme['c-primary']]}
        // progressBackgroundColor={theme.primary}
        refreshing={status == 'refreshing'}
        onRefresh={onRefresh}
      />
    ),
    [status, onRefresh, theme]
  )
  const footerComponent = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing':
        return null
      case 'loading':
        label = 'list_loading'
        break
      case 'end':
        label = 'list_end'
        break
      case 'error':
        label = 'list_error'
        break
      case 'idle':
        label = null
        break
    }
    return (
      <View style={{ width: '100%' }}>
        <Footer label={label} onLoadMore={onLoadMore} />
      </View>
    )
  }, [onLoadMore, status])

  // 动态计算列数与卡片宽度(大屏适配)
  const rowInfo = useMemo(() => {
    let w = width - GAP
    let n = width / (MIN_WIDTH + GAP)
    if (n > 10) n = 10
    let computedItemWidth = Math.floor(w / n)
    const num = Math.max(Math.floor(width / computedItemWidth), 2)
    return {
      num,
      width: (width - GAP) / num,
    }
  }, [width])

  // 映射为 ChromaGridItem(白色占位项不再需要,ChromaGrid 自带 flex-start 布局)
  const gridItems = useMemo<ChromaGridItem[]>(() => {
    return currentList
      .filter(item => item.source)
      .map((item, i: number) => ({
        key: item.id,
        image: item.img,
        title: item.name,
        subtitle: item.play_count || undefined,
        badge: showSource ? item.source : undefined,
        borderColor: BORDER_PALETTE[i % BORDER_PALETTE.length],
        onPress: () => onOpenDetail(item, i),
      }))
  }, [currentList, showSource, onOpenDetail])

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width == 0 ? null : (
        <ChromaGrid
          listKey={String(rowInfo.num)}
          items={gridItems}
          columns={rowInfo.num}
          containerWidth={width}
          gap={scaleSizeW(15)}
          borderRadius={12}
          refreshing={status == 'refreshing'}
          onRefresh={onRefresh}
          onScrollBeginDrag={Keyboard.dismiss}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={footerComponent}
          maxToRenderPerBatch={4}
          windowSize={8}
          removeClippedSubviews={true}
        />
      )}
    </View>
  )
})

type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null
const Footer = ({ label, onLoadMore }: { label: FooterLabel; onLoadMore: () => void }) => {
  const theme = useTheme()
  const t = useI18n()
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return label ? (
    <View>
      <Text onPress={handlePress} style={styles.footer} color={theme['c-font-label']}>
        {t(label)}
      </Text>
    </View>
  ) : null
}

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    textAlign: 'center',
    padding: 10,
  },
})
