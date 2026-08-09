/**
 * Skeleton - 轻量骨架屏(零依赖, 原生驱动脉冲动画)
 * 用于歌单/搜索列表首屏加载, 替代转圈 Loading
 */
import { memo, useEffect, useRef, createContext, useContext } from 'react'
import { View, Animated, Easing, type ViewStyle, type StyleProp } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

/**
 * 性能优化: 整个骨架屏共享一个 Animated.Value(单一循环动画),
 * 所有占位块读取同一 opacity 节点, 避免 N 个独立 loop 造成 CPU 卡滞。
 */
const SkeletonOpacityContext = createContext<Animated.Value | null>(null)

const useSkeletonOpacity = () => useContext(SkeletonOpacityContext)

interface SkeletonProps {
  /** 宽度(数字或百分比) */
  width?: number | `${number}%`
  /** 高度 */
  height?: number
  /** 圆角 */
  radius?: number
  style?: StyleProp<ViewStyle>
}

export const SkeletonBlock = memo(({ width = '100%', height = 14, radius = 6, style }: SkeletonProps) => {
  const theme = useTheme()
  const sharedOpacity = useSkeletonOpacity()

  // 无 Provider 时(独立使用)退化为单块自驱动动画
  const localOpacity = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    if (sharedOpacity) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(localOpacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(localOpacity, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => { anim.stop() }
  }, [localOpacity, sharedOpacity])

  const opacity = sharedOpacity ?? localOpacity
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme['c-primary-alpha-900'] },
        { opacity },
        style,
      ]}
    />
  )
})

/** 骨架容器: 启动单个共享脉冲动画, 包裹所有占位块 */
export const SkeletonContainer = memo(({ children }: { children: React.ReactNode }) => {
  const opacity = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => { anim.stop() }
  }, [opacity])
  return <SkeletonOpacityContext.Provider value={opacity}>{children}</SkeletonOpacityContext.Provider>
})

/** 歌单网格骨架(与 ChromaGrid 同列数布局) */
export const SonglistGridSkeleton = memo(({ columns, gap = 20, borderRadius = 12 }: { columns: number, gap?: number, borderRadius?: number }) => {
  const items = Array.from({ length: columns * 2 })
  return (
    <SkeletonContainer>
    <View style={[styles.grid, { gap }]}>
      {items.map((_, i) => (
        <View key={i} style={{ width: '100%', flex: 1 / columns }}>
          <SkeletonBlock height={120} radius={borderRadius} />
          <SkeletonBlock height={12} width="80%" style={{ marginTop: 8 }} />
          <SkeletonBlock height={10} width="50%" style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
    </SkeletonContainer>
  )
})

/** 列表行骨架(单列, 用于搜索/歌单详情) */
export const ListRowSkeleton = memo(({ rows = 8 }: { rows?: number }) => {
  return (
    <SkeletonContainer>
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBlock width={44} height={44} radius={8} />
          <View style={styles.rowText}>
            <SkeletonBlock width="70%" height={13} />
            <SkeletonBlock width="40%" height={11} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
    </SkeletonContainer>
  )
})

const styles = createStyle({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
})
