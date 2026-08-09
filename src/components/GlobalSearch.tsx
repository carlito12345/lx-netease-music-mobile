import { memo, useRef, useState } from 'react'
import { View } from 'react-native'
import BubbleSearch, { type BubbleSearchType } from '@/components/BubbleSearch'
import { createStyle } from '@/utils/tools'

const GlobalSearch = () => {
  const [text, setText] = useState('')
  const inputRef = useRef<BubbleSearchType>(null)

  const handleSearch = () => {
    const searchText = text.trim()
    if (!searchText) return

    // 触发全局搜索事件
    global.app_event.triggerSearch(searchText)
    setText('')
    inputRef.current?.blur()
  }

  return (
    <View style={styles.container}>
      <BubbleSearch
        ref={inputRef}
        placeholder="搜索..."
        value={text}
        onChangeText={setText}
        onSubmit={handleSearch}
        height={32}
      />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    maxWidth: 220, // 限制最大宽度
  },
})

export default memo(GlobalSearch)
