/**
 * ChromaGrid — React Native 移植版(歌单/单曲通用卡片网格)
 *
 * 移植自 reactbits.dev/components/chroma-grid (MIT License)
 * 原版核心视觉:
 *   1. 渐变背景卡片 + 1px 彩色边框(border-radius 20)
 *   2. 封面图四周 10px 内边距,露出卡片渐变背景(卡片包围封面)
 *   3. 底部文字区(标题 + 副标题)也在卡片内
 *   4. 入场交错动画(fade-in + translateY)
 *   5. 滚动聚光灯:视口中心卡片明亮,上下边缘卡片灰度变暗
 *
 * 本版同时支持单曲卡片形态:
 *   - duration: 封面右下角时长
 *   - isPlaying: 播放中封面叠加播放指示
 *   - quality: 品质角标(无损/Hi-Res 等)
 *   - isLiked / onToggleLike: 喜欢按钮
 *   - onShowMenu: 更多菜单按钮
 *
 * 主题统一: 卡片默认背景/文字使用 App 主题 token(c-content-background /
 * c-font / c-font-label), 渐变背景与彩色边框作为可选能力保留。
 *
 * 零新依赖,仅使用 RN 内置 Animated + 项目已有 Image/Text/SvgIcon/PlayingIcon。
 */

import {
  memo, useRef, useCallback, useMemo, useEffect, useState,
  forwardRef, useImperativeHandle,
} from 'react'
import {
  View,
  FlatList,
  Animated,
  Pressable,
  StyleSheet,
  RefreshControl,
  Dimensions,
  type ViewStyle,
  type StyleProp,
  type FlatListProps,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { windowSizeTools } from '@/utils/windowSizeTools'
import { SvgIcon } from '@/components/common/SvgIcon'
import { Icon } from '@/components/common/Icon'
import PlayingIcon from '@/components/common/PlayingIcon'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChromaGridAction {
  name: string
  color?: string
  onPress: () => void
}

export interface ChromaGridItem {
  /** 稳定 key,默认用 index */
  key?: string
  /** 封面图片 URL 或本地资源 */
  image?: string | number | null
  /** 主标题(歌名/歌单名) */
  title: string
  /** 副标题(歌手/描述) */
  subtitle?: string
  /** 卡片边框色,默认取主题 c-border-background */
  borderColor?: string
  /** 渐变背景主色(卡片背景左上角),默认取主题 c-content-background */
  gradientFrom?: string
  /** 渐变背景辅色(卡片背景右下角),默认取主题 c-primary-light-900 */
  gradientTo?: string
  /** 点击回调(传入则卡片可点击) */
  onPress?: () => void
  /** 右上角操作按钮(如心动模式),用 SvgIcon 图标名 */
  action?: ChromaGridAction
  /** 封面右上角角标(如来源标签 kw/kg/mg) */
  badge?: string
  /* ---------- 单曲字段 ---------- */
  /** 时长文本(封面右下角) */
  duration?: string
  /** 是否正在播放(封面叠加播放指示) */
  isPlaying?: boolean
  /** 品质角标(无损/Hi-Res 等) */
  quality?: string
  /** 是否已喜欢 */
  isLiked?: boolean
  /** 喜欢切换回调(传入则显示喜欢按钮) */
  onToggleLike?: () => void
  /** 更多菜单回调(传入则显示更多按钮) */
  onShowMenu?: () => void
}

export interface ChromaGridProps {
  /** 数据源 */
  items: ChromaGridItem[]
  /** 列数,默认 2 */
  columns?: number
  /** 卡片间距(dp),默认 10 */
  gap?: number
  /** 卡片圆角(dp),默认 16 */
  borderRadius?: number
  /** 是否启用入场动画,默认 true */
  entranceAnimation?: boolean
  /** 入场动画每项延迟(ms),默认 60 */
  staggerDelay?: number
  /** 是否启用滚动聚光灯效果,默认 true */
  spotlight?: boolean
  /** 聚光灯半径占屏幕高度的比例,默认 0.55 */
  spotlightRadius?: number
  /** 是否显示下拉刷新指示器 */
  refreshing?: boolean
  /** 下拉刷新回调 */
  onRefresh?: () => void
  /** 透传给 FlatList 的 onScrollBeginDrag(如收起键盘) */
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  /** 容器宽度(大屏适配),默认取窗口宽 */
  containerWidth?: number
  /** 触底加载回调 */
  onEndReached?: () => void
  /** 触底阈值,默认 0.6 */
  onEndReachedThreshold?: number
  /** 列表底部组件(加载中/到底提示等) */
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null
  /** 渲染性能参数 */
  maxToRenderPerBatch?: number
  /** 渲染性能参数 */
  windowSize?: number
  /** 渲染性能参数 */
  removeClippedSubviews?: boolean
  /** 列表 key(数据/列数变化时强制重建) */
  listKey?: string
  /** 容器额外样式 */
  style?: StyleProp<ViewStyle>
  /** 卡片额外样式(覆盖在卡片 View 上) */
  cardStyle?: StyleProp<ViewStyle>
}

/** ref: 暴露滚动定位能力 */
export interface ChromaGridRef {
  scrollToIndex: (index: number, animated?: boolean) => void
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** 封面图四周内边距(露出卡片渐变背景) */
const CARD_PADDING = 10
/** 底部文字区固定高度(保证行高确定,聚光灯定位准确) */
const INFO_HEIGHT = 80
const INFO_PADDING_H = 16
const INFO_PADDING_TOP = 6
const INFO_PADDING_BOTTOM = 12
const DEFAULT_BORDER = 'rgba(255,255,255,0.2)'

/** 取当前窗口尺寸(优先 windowSizeTools,未初始化时回退 Dimensions) */
const getScreenSize = () => {
  const s = windowSizeTools.getSize()
  if (s.width > 0 && s.height > 0) return s
  const d = Dimensions.get('window')
  return { width: d.width, height: d.height }
}

/* ------------------------------------------------------------------ */
/*  Animated Card                                                      */
/* ------------------------------------------------------------------ */

interface CardProps {
  item: ChromaGridItem
  index: number
  cardWidth: number
  gap: number
  borderRadius: number
  columns: number
  entranceAnimation: boolean
  staggerDelay: number
  spotlight: boolean
  scrollY: Animated.Value
  spotlightRadius: number
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
/** FlatList 原生 onScroll + useNativeDriver 必须用 Animated 包装 */
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList as React.ComponentType<FlatListProps<ChromaGridItem>>)

const ChromaCard = memo(({
  item,
  index,
  cardWidth,
  gap,
  borderRadius,
  columns,
  entranceAnimation,
  staggerDelay,
  spotlight,
  scrollY,
  spotlightRadius,
}: CardProps) => {
  const theme = useTheme()

  // 主题统一: 默认取 App token, 调用方可传渐变/色框覆盖
  const isCustomGradient = !!(item.gradientFrom || item.gradientTo)
  const bgFrom = item.gradientFrom || theme['c-content-background']
  const bgTo = item.gradientTo || theme['c-primary-light-900']
  const titleColor = isCustomGradient ? '#ffffff' : theme['c-font']
  const subtitleColor = isCustomGradient ? 'rgba(255,255,255,0.7)' : theme['c-font-label']
  const borderColor = item.isPlaying
    ? theme['c-primary']
    : (item.borderColor || DEFAULT_BORDER)

  // 入场动画:每张卡片交错 fade + 上移
  const entryAnim = useRef(new Animated.Value(entranceAnimation ? 0 : 1)).current
  const translateYAnim = useRef(new Animated.Value(entranceAnimation ? 30 : 0)).current

  useEffect(() => {
    if (!entranceAnimation) return
    Animated.parallel([
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 500,
        delay: index * staggerDelay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: index * staggerDelay,
        useNativeDriver: true,
      }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 固定卡片高度:图片区(CARD_PADDING 包围) + 文字区
  const cardHeight = cardWidth + INFO_HEIGHT - CARD_PADDING
  const row = Math.floor(index / columns)
  const itemCenterY = row * (cardHeight + gap) + cardHeight / 2

  // 聚光灯 opacity:中心=1, 边缘=0.35
  const spotlightOpacity = spotlight
    ? scrollY.interpolate({
        inputRange: [
          itemCenterY - spotlightRadius * 2,
          itemCenterY - spotlightRadius,
          itemCenterY,
          itemCenterY + spotlightRadius,
          itemCenterY + spotlightRadius * 2,
        ],
        outputRange: [0.35, 0.7, 1, 0.7, 0.35],
        extrapolate: 'clamp',
      })
    : 1

  // scale: 中心=1, 边缘=0.96
  const spotlightScale = spotlight
    ? scrollY.interpolate({
        inputRange: [
          itemCenterY - spotlightRadius * 1.5,
          itemCenterY,
          itemCenterY + spotlightRadius * 1.5,
        ],
        outputRange: [0.96, 1, 0.96],
        extrapolate: 'clamp',
      })
    : 1

  // 灰度蒙层:边缘卡片灰度变暗
  const grayOverlayOpacity = spotlight
    ? scrollY.interpolate({
        inputRange: [
          itemCenterY - spotlightRadius * 2,
          itemCenterY - spotlightRadius * 0.5,
          itemCenterY,
          itemCenterY + spotlightRadius * 0.5,
          itemCenterY + spotlightRadius * 2,
        ],
        outputRange: [0.45, 0.15, 0, 0.15, 0.45],
        extrapolate: 'clamp',
      })
    : 0

  return (
    <AnimatedPressable
      onPress={item.onPress}
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          marginRight: gap,
          marginBottom: gap,
          borderRadius,
          borderColor,
          borderWidth: StyleSheet.hairlineWidth,
          backgroundColor: bgTo,
        },
        {
          opacity: Animated.multiply(entryAnim, spotlightOpacity),
          transform: [
            { translateY: translateYAnim },
            { scale: Animated.multiply(entryAnim, spotlightScale) },
          ],
        },
      ]}
    >
      {/* 渐变背景模拟:底层深色 + 左上角较亮色层(原版 linear-gradient 对角渐变) */}
      <View style={[styles.cardBgBase, { backgroundColor: bgTo, borderRadius }]} />
      <View style={[styles.cardBgAccent, { backgroundColor: bgFrom, borderRadius }]} />

      {/* 封面图:四周 CARD_PADDING 留白,露出卡片渐变背景 */}
      <View style={styles.imageWrapper}>
        {item.image ? (
          <Image
            url={item.image}
            style={[styles.cardImage, { height: cardWidth - CARD_PADDING * 2, borderRadius: borderRadius - 6 }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder, { height: cardWidth - CARD_PADDING * 2, borderRadius: borderRadius - 6, backgroundColor: bgFrom }]}>
            <Text size={28} color={subtitleColor} style={styles.placeholderIcon}>♪</Text>
          </View>
        )}

        {/* 播放中:封面叠加播放指示 */}
        {item.isPlaying ? (
          <View style={styles.playingBadge}>
            <PlayingIcon color="#ffffff" />
          </View>
        ) : null}

        {/* 时长:封面右下角 */}
        {item.duration ? (
          <View style={styles.durationBadge}>
            <Text size={10} color="#fff">{item.duration}</Text>
          </View>
        ) : null}

        {/* 品质角标:封面左上角 */}
        {item.quality ? (
          <View style={[styles.qualityBadge, { backgroundColor: theme['c-primary'] }]}>
            <Text size={9} color={theme['c-primary-font-on-primary']}>{item.quality}</Text>
          </View>
        ) : null}

        {/* 来源角标:封面右上角 */}
        {item.badge ? (
          <View style={styles.cardBadge}>
            <Text size={9} color="#fff">{item.badge}</Text>
          </View>
        ) : null}
      </View>

      {/* 文字区(固定高度,保证行高确定) */}
      <View style={styles.cardInfo}>
        <Text size={14} numberOfLines={2} style={[styles.cardTitle, { color: titleColor }]}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text size={12} numberOfLines={1} style={[styles.cardSubtitle, { color: subtitleColor }]}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>

      {/* 灰度蒙层:边缘卡片覆盖半透明灰(Animated.View 才能接收 Animated 节点) */}
      <Animated.View style={[styles.grayOverlay, { borderRadius, opacity: grayOverlayOpacity }]} />

      {/* 右侧操作按钮组(喜欢/更多/自定义 action),放在蒙层之上始终可见 */}
      <View style={styles.cardActions}>
        {item.onToggleLike ? (
          <Pressable
            style={styles.cardActionBtn}
            hitSlop={8}
            onPress={(e) => { e.stopPropagation(); item.onToggleLike?.() }}
          >
            <Icon name={item.isLiked ? 'love-filled' : 'love'} size={16} color={item.isLiked ? theme['c-liked'] : '#ffffff'} />
          </Pressable>
        ) : null}
        {item.onShowMenu ? (
          <Pressable
            style={styles.cardActionBtn}
            hitSlop={8}
            onPress={(e) => { e.stopPropagation(); item.onShowMenu?.() }}
          >
            <Icon name="dots-vertical" size={16} color="#ffffff" />
          </Pressable>
        ) : null}
        {item.action ? (
          <Pressable
            style={styles.cardActionBtn}
            hitSlop={8}
            onPress={(e) => { e.stopPropagation(); item.action?.onPress() }}
          >
            <SvgIcon name={item.action.name} size={18} color={item.action.color ?? theme['c-primary']} />
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  )
})
ChromaCard.displayName = 'ChromaCard'

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const ChromaGrid = memo(forwardRef<ChromaGridRef, ChromaGridProps>(({
  items,
  columns = 2,
  gap = 10,
  borderRadius = 16,
  entranceAnimation = true,
  staggerDelay = 60,
  spotlight = true,
  spotlightRadius,
  refreshing,
  onRefresh,
  onScrollBeginDrag,
  containerWidth,
  onEndReached,
  onEndReachedThreshold = 0.6,
  ListFooterComponent,
  maxToRenderPerBatch = 4,
  windowSize = 8,
  removeClippedSubviews = true,
  listKey,
  style,
  cardStyle,
}, ref) => {
  const scrollY = useRef(new Animated.Value(0)).current
  const flatListRef = useRef<FlatList>(null)
  const theme = useTheme()

  // 动态读取窗口尺寸(不能用模块级捕获:windowSizeTools.init 是异步且重新赋值)
  const [screen, setScreen] = useState(getScreenSize)
  useEffect(() => {
    return windowSizeTools.onSizeChanged(() => setScreen(getScreenSize()))
  }, [])

  // 计算卡片宽度
  const cardWidth = useMemo(() => {
    const viewWidth = containerWidth || screen.width
    const totalGaps = (columns - 1) * gap + gap * 2 // 两侧 padding
    return (viewWidth - totalGaps) / columns
  }, [columns, gap, containerWidth, screen.width])

  const spotRadius = spotlightRadius ?? screen.height * 0.55

  // 固定行高:卡片高 + 间距,用于 scrollToIndex 精确定位
  const cardHeight = cardWidth + INFO_HEIGHT - CARD_PADDING
  const rowHeight = cardHeight + gap

  // 暴露滚动定位能力(单曲跳转播放位置等)
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      const row = Math.floor(index / columns)
      const offset = row * rowHeight
      flatListRef.current?.scrollToOffset({ offset, animated })
    },
  }), [columns, rowHeight])

  const keyExtractor = useCallback((item: ChromaGridItem, i: number) => item.key ?? String(i), [])

  const renderItem = useCallback(({ item, index }: { item: ChromaGridItem; index: number }) => (
    <ChromaCard
      item={item}
      index={index}
      cardWidth={cardWidth}
      gap={gap}
      borderRadius={borderRadius}
      columns={columns}
      entranceAnimation={entranceAnimation}
      staggerDelay={staggerDelay}
      spotlight={spotlight}
      scrollY={scrollY}
      spotlightRadius={spotRadius}
    />
  ), [cardWidth, gap, borderRadius, columns, entranceAnimation, staggerDelay, spotlight, scrollY, spotRadius])

  return (
    <AnimatedFlatList
      ref={flatListRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={columns}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
      columnWrapperStyle={styles.columnWrapper}
      onScroll={spotlight ? Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      ) : undefined}
      scrollEventThrottle={16}
      indicatorStyle="white"
      refreshControl={onRefresh ? (
        <RefreshControl
          colors={[theme['c-primary']]}
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
        />
      ) : undefined}
      onScrollBeginDrag={onScrollBeginDrag}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      key={listKey}
    />
  )
}))
ChromaGrid.displayName = 'ChromaGrid'

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = createStyle({
  container: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardBgBase: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  cardBgAccent: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  grayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#808080',
    zIndex: 3,
  },
  imageWrapper: {
    padding: CARD_PADDING,
    zIndex: 1,
  },
  cardImage: {
    width: '100%',
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontWeight: '300',
  },
  cardInfo: {
    height: INFO_HEIGHT,
    paddingHorizontal: INFO_PADDING_H,
    paddingTop: INFO_PADDING_TOP,
    paddingBottom: INFO_PADDING_BOTTOM,
    zIndex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    lineHeight: 20,
  },
  cardSubtitle: {
    marginTop: 3,
  },
  playingBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  durationBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 2,
  },
  qualityBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 2,
  },
  cardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    zIndex: 4,
  },
  cardActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default ChromaGrid
