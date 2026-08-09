/**
 * CardNav — 汉堡展开卡片导航(reactbits CardNav 的 RN 移植)
 *
 * 视觉:
 *   1. 顶部圆角胶囊容器: 汉堡按钮 + 标题 + 操作按钮
 *   2. 点击汉堡展开: 高度动画 + 卡片浮现(错位淡入)
 *   3. 卡片: 每张独立 bgColor(多彩) + 文字自动对比色(兼容所有背景)
 *
 * 背景/文字颜色:
 *   - 每张卡用传入的 bgColor(不同颜色), 未传则深色主题用白色半透明、浅色主题用浅卡色
 *   - 文字颜色用亮度算法自动计算(亮底黑字/暗底白字), 确保任何 bgColor 都清晰
 */

import { memo, useRef, useState, useCallback } from 'react'
import { View, TouchableOpacity, Animated, Easing } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

export interface CardNavItem {
  label: string
  bgColor?: string
  textColor?: string
  links: Array<{
    label: string
    onPress?: () => void
  }>
}

export interface CardNavProps {
  /** 导航卡片组(最多显示前3张) */
  items: CardNavItem[]
  /** 顶部标题/logo 文本 */
  title?: string
  /** 顶部操作按钮文本(可空) */
  actionText?: string
  onActionPress?: () => void
  /** 默认展开 */
  defaultOpen?: boolean
}

/** 计算背景亮度(0-255): 亮底用黑字, 暗底用白字 */
const getLuma = (color: string): number => {
  const m = color.match(/\d+(\.\d+)?/g)?.map(Number) ?? []
  if (m.length < 3) return 255
  return (m[0] * 299 + m[1] * 587 + m[2] * 114) / 1000
}

/** 自动对比文字色 */
const contrastColor = (bg: string): string => {
  // 半透明背景(如 rgba): 叠加在深色主题上, 视为深底
  if (bg.startsWith('rgba') || bg.startsWith('hsla')) return '#ffffff'
  return getLuma(bg) > 160 ? 'rgba(0,0,0,0.85)' : '#ffffff'
}

/** 亮色卡片的链接副文字 */
const linkColor = (bg: string): string => {
  if (bg.startsWith('rgba') || bg.startsWith('hsla')) return 'rgba(255,255,255,0.72)'
  return getLuma(bg) > 160 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.72)'
}

const CardNav = memo(({ items, title, actionText, onActionPress, defaultOpen = false }: CardNavProps) => {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const heightAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current

  const toggle = useCallback(() => {
    const next = !isOpen
    setIsOpen(next)
    Animated.timing(heightAnim, {
      toValue: next ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [isOpen, heightAnim])

  const contentHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  })
  const contentOpacity = heightAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.2, 1],
  })

  const cards = items.slice(0, 3)

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme['c-main-background'],
          borderColor: theme['c-border-background'],
        },
      ]}
    >
      {/* 顶栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.hamburger} onPress={toggle} hitSlop={8}>
          <View style={[styles.line, isOpen && styles.lineOpenTop, { backgroundColor: theme['c-font'] }]} />
          <View style={[styles.line, isOpen && styles.lineOpenBottom, { backgroundColor: theme['c-font'] }]} />
        </TouchableOpacity>
        {title ? (
          <Text size={15} color={theme['c-font']} style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {actionText ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme['c-primary'] }]}
            onPress={onActionPress}
          >
            <Text size={12} color={theme['c-primary-font-on-primary']}>{actionText}</Text>
          </TouchableOpacity>
        ) : <View style={styles.actionPlaceholder} />}
      </View>

      {/* 展开卡片区 */}
      <Animated.View
        style={{ height: contentHeight, opacity: contentOpacity, overflow: 'hidden' }}
      >
        <View style={styles.cardsRow}>
          {cards.map((item, i) => (
            <NavCard
              key={item.label + i}
              item={item}
              theme={theme}
              index={i}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  )
})
CardNav.displayName = 'CardNav'

/* 单张导航卡片: 独立 bgColor + 自动对比文字 */
const NavCard = ({ item, theme, index }: {
  item: CardNavItem
  theme: any
  index: number
}) => {
  // 每张卡独立背景: 优先传入 bgColor, 未传则主题自适应
  const bgColor = item.bgColor
    ?? (theme.isDark ? 'rgba(255,255,255,0.07)' : theme['c-primary-light-900-alpha-200'])
  // 文字自动对比色
  const textColor = item.textColor ?? contrastColor(bgColor)
  const subColor = linkColor(bgColor)

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor: item.bgColor ? 'transparent' : theme['c-border-background'],
        },
      ]}
    >
      <Text size={17} color={textColor} style={styles.cardLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <View style={styles.links}>
        {item.links.map((link, li) => (
          <TouchableOpacity key={li} onPress={link.onPress} style={styles.linkRow} hitSlop={6}>
            <Text size={13} color={subColor} numberOfLines={1}>
              {link.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 14,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 12,
  },
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  line: {
    width: 20,
    height: 2,
    borderRadius: 1,
    marginVertical: 3,
  },
  lineOpenTop: {
    transform: [{ translateY: 4 }, { rotate: '45deg' }],
  },
  lineOpenBottom: {
    transform: [{ translateY: -4 }, { rotate: '-45deg' }],
  },
  title: {
    flex: 1,
    paddingHorizontal: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  actionPlaceholder: {
    width: 60,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardLabel: {
    fontWeight: '600',
    marginBottom: 10,
  },
  links: {
    gap: 6,
  },
  linkRow: {
    paddingVertical: 3,
  },
})

export default CardNav
