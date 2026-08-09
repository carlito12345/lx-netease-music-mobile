/**
 * SettingLayout - 播放器布局选择(完整组件)
 * 经典 / MusicFree 风格 切换, 自包含无外部依赖
 */
import { memo, useState, useEffect } from 'react'
import { View } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import Text from '@/components/common/Text'
import Chip from '@/components/common/Chip'

const LAYOUTS = [
  { key: 'default', label: '经典' },
  { key: 'musicfree', label: 'MusicFree 风格' },
]

export default memo(() => {
  const [current, setCurrent] = useState('default')
  useEffect(() => {
    try { setCurrent(require('@/plugins/layoutManager').getLayout()) } catch {}
  }, [])

  return (
    <View style={styles.container}>
      <Text size={14} style={styles.title}>播放器布局</Text>
      <View style={styles.row}>
        {LAYOUTS.map(layout => (
          <Chip
            key={layout.key}
            label={layout.label}
            active={current === layout.key}
            size={14}
            onPress={() => {
              try {
                require('@/plugins/layoutManager').setLayout(layout.key)
                setCurrent(layout.key)
                toast('切换到: ' + layout.label)
              } catch {}
            }}
          />
        ))}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: { paddingTop: 8, paddingLeft: 20, paddingRight: 20, paddingBottom: 12 },
  title: { paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
})
