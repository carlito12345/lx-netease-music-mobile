/**
 * BubbleTabs — 胶囊形标签/标题组(移植自 reactbits BubbleMenu 的 pill 视觉语言)
 *
 * 视觉特征:
 *   1. 每个 tab 为全圆角胶囊(pill),BubbleMenu 的 pill 形态
 *   2. 选中态:主题色背景 + 白字 + 弹性放大
 *   3. 未选中:透明背景 + 主题文字色 + 细边框
 *   4. 支持横向滚动
 *
 * 独立完整: 只依赖项目公共组件(Text/useTheme),自带全部默认值。
 * 主题统一: 颜色全部走主题 token。
 */

import { forwardRef, useImperativeHandle, useMemo, useState, useCallback, useRef } from 'react'
import { ScrollView, TouchableOpacity, View, Animated } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

export interface BubbleTabItem {
  label: string
  id: string
}

export interface BubbleTabsProps {
  /** tab 列表 */
  items: BubbleTabItem[]
  /** 选中 id */
  activeId: string
  /** 切换回调 */
  onChange: (id: string) => void
  /** 高度(dp),默认 30 */
  height?: number
  /** 横向滚动时是否显示滚动条 */
  showsHorizontalScrollIndicator?: boolean
}

export interface BubbleTabsType {
  scrollTo: (id: string) => void
}

const BubbleTabs = forwardRef<BubbleTabsType, BubbleTabsProps>(
  ({ items, activeId, onChange, height = 30, showsHorizontalScrollIndicator = false }, ref) => {
    const theme = useTheme()
    const scrollRef = useRef<ScrollView>(null)
    // 选中项索引,用于滚动定位
    const activeIndex = useMemo(() => {
      const i = items.findIndex(item => item.id === activeId)
      return i < 0 ? 0 : i
    }, [items, activeId])

    useImperativeHandle(ref, () => ({
      scrollTo: (id: string) => {
        const i = items.findIndex(item => item.id === id)
        if (i < 0) return
        // 估算滚动位置:每个 tab 约 90dp
        scrollRef.current?.scrollTo({ x: Math.max(0, i * 90 - 60), animated: true })
      },
    }), [items])

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        horizontal
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.row}>
          {items.map((item, i) => (
            <PillTab
              key={item.id}
              item={item}
              active={item.id === activeId}
              index={i}
              activeIndex={activeIndex}
              height={height}
              theme={theme}
              onPress={() => onChange(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    )
  }
)
BubbleTabs.displayName = 'BubbleTabs'

/* 单个胶囊 tab(带选中弹性动画) */
const PillTab = ({ item, active, index, activeIndex, height, theme, onPress }: {
  item: BubbleTabItem
  active: boolean
  index: number
  activeIndex: number
  height: number
  theme: any
  onPress: () => void
}) => {
  // 选中时弹性放大
  const scale = useRef(new Animated.Value(active ? 1 : 0.9)).current
  const [wasActive, setWasActive] = useState(active)

  if (active !== wasActive) {
    setWasActive(active)
    Animated.spring(scale, {
      toValue: active ? 1 : 0.9,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.pill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: active ? theme['c-primary'] : 'transparent',
            borderColor: active ? theme['c-primary'] : theme['c-border-background'],
          },
        ]}
      >
        <Text size={13} color={active ? theme['c-primary-font-on-primary'] : theme['c-font']} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 0,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pill: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
})

export default BubbleTabs
