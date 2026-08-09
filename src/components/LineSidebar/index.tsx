/**
 * LineSidebar — 线条侧边栏(移植自 reactbits.dev/components/line-sidebar)
 *
 * 原版视觉语言:
 *   1. 等宽序号(01/02/03) + 菜单文字
 *   2. 左侧 marker 线:激活项变主题色并拉长,非激活项灰色短
 *   3. 激活项文字右移 + 变色(原版为指针 proximity,RN 触屏改为点击激活)
 *   4. 平滑插值动画(rAF lerp 简化为 Animated 弹性)
 *
 * 独立完整: 只依赖项目公共组件(Text/Icon/useTheme)。
 * 主题统一: 颜色全部走主题 token,accent 默认 c-primary。
 */

import { memo, useRef, useEffect, useCallback } from 'react'
import { View, TouchableOpacity, Animated, Easing } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { SvgIcon } from '@/components/common/SvgIcon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

export interface LineSidebarItem {
  id: string
  label: string
  icon?: string
}

export interface LineSidebarProps {
  items: LineSidebarItem[]
  activeId: string
  onPress: (id: string) => void
  /** 是否显示序号(等宽) */
  showIndex?: boolean
  /** 是否显示左侧 marker 线 */
  showMarker?: boolean
  /** marker 线长,默认 28 */
  markerLength?: number
  /** 激活项位移,默认 12 */
  maxShift?: number
  /** 序号是否显示为 01/02 格式 */
  padIndex?: boolean
  /** 激活项额外渲染(如可折叠箭头) */
  renderTrailing?: (item: LineSidebarItem) => React.ReactNode
}

const LineSidebar = memo(({
  items,
  activeId,
  onPress,
  showIndex = true,
  showMarker = true,
  markerLength = 28,
  maxShift = 12,
  padIndex = true,
  renderTrailing,
}: LineSidebarProps) => {
  const theme = useTheme()

  return (
    <View style={[styles.container, showMarker ? { paddingLeft: markerLength + 12 } : null]}>
      {items.map((item, index) => (
        <LineItem
          key={item.id}
          item={item}
          index={index}
          active={item.id === activeId}
          onPress={() => onPress(item.id)}
          showIndex={showIndex}
          showMarker={showMarker}
          markerLength={markerLength}
          maxShift={maxShift}
          padIndex={padIndex}
          accentColor={theme['c-primary']}
          markerColor={theme['c-border-background']}
          textColor={theme['c-font-label']}
          activeTextColor={theme['c-primary-font']}
          renderTrailing={renderTrailing}
        />
      ))}
    </View>
  )
})
LineSidebar.displayName = 'LineSidebar'

interface LineItemProps {
  item: LineSidebarItem
  index: number
  active: boolean
  onPress: () => void
  showIndex: boolean
  showMarker: boolean
  markerLength: number
  maxShift: number
  padIndex: boolean
  accentColor: string
  markerColor: string
  textColor: string
  activeTextColor: string
  renderTrailing?: (item: LineSidebarItem) => React.ReactNode
}

const LineItem = ({
  item, index, active, onPress,
  showIndex, showMarker, markerLength, maxShift, padIndex,
  accentColor, markerColor, textColor, activeTextColor, renderTrailing,
}: LineItemProps) => {
  // --effect (0..1) 驱动所有视觉:位移/颜色/marker 长度
  const effect = useRef(new Animated.Value(active ? 1 : 0)).current
  const wasActive = useRef(active)

  useEffect(() => {
    if (active === wasActive.current) return
    wasActive.current = active
    Animated.timing(effect, {
      toValue: active ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // 颜色/位移需 JS 驱动
    }).start()
  }, [active, effect])

  // 位移:激活右移
  const shift = effect.interpolate({ inputRange: [0, 1], outputRange: [0, maxShift] })
  // 文字透明度
  const textOpacity = effect.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] })
  // marker 线宽:0.5 -> 1
  const markerScale = effect.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] })
  // 文字颜色:gray -> accent(用 interpolate 转颜色需 rgba,简化用两层 Text 切换透明度)
  const indexOpacity = effect.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })

  const label = item.label
  const indexStr = padIndex ? String(index + 1).padStart(2, '0') : String(index + 1)

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.6}>
      {showMarker ? (
        <Animated.View
          style={[
            styles.marker,
            {
              left: -markerLength - 12,
              width: markerLength,
              backgroundColor: active ? accentColor : markerColor,
              transform: [{ scaleX: markerScale }],
            },
          ]}
        />
      ) : null}
      <Animated.View style={[styles.label, { transform: [{ translateX: shift }] }]}>
        {showIndex ? (
          <Animated.Text
            style={[
              styles.index,
              { color: active ? accentColor : textColor, opacity: indexOpacity },
            ]}
          >
            {indexStr}
          </Animated.Text>
        ) : null}
        {item.icon ? (
          <Animated.View style={[styles.iconText, { opacity: textOpacity }]}>
            {item.icon.startsWith('svg:')
              ? <SvgIcon name={item.icon.slice(4)} size={16} color={active ? accentColor : textColor} />
              : <Icon name={item.icon} size={16} color={active ? accentColor : textColor} />}
          </Animated.View>
        ) : null}
        <Animated.Text
          style={[
            styles.text,
            { color: active ? activeTextColor : textColor, opacity: textOpacity },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        {renderTrailing ? renderTrailing(item) : null}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = createStyle({
  container: {
    paddingVertical: 6,
  },
  item: {
    paddingVertical: 11,
    paddingHorizontal: 6,
    position: 'relative',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  index: {
    fontFamily: 'monospace',
    fontSize: 11,
    marginRight: 8,
    width: 22,
    textAlign: 'right',
  },
  iconText: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
  marker: {
    position: 'absolute',
    top: '50%',
    height: 1.5,
    marginTop: -1,
  },
})

export default LineSidebar
