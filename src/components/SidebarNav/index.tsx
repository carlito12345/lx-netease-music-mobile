/**
 * SidebarNav - 侧边栏导航(重写版)
 * 简洁左对齐 + 激活胶囊:
 *  - 图标+文字同盒 alignItems center(无基线波浪)
 *  - 激活: 主色胶囊底 + 左侧主色竖条(绝对定位 top/bottom 20%)
 *  - 固定行高 56(车机触控 ≥48dp), 无序号
 *  - 深浅主题/车机手机自适应
 */
import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { SvgIcon } from '@/components/common/SvgIcon'
import { useTheme } from '@/store/theme/hook'
import { useWindowSize } from '@/utils/hooks'

export interface SidebarNavItem {
  id: string
  label: string
  icon?: string
}

interface Props {
  items: SidebarNavItem[]
  activeId: string
  onPress: (id: string) => void
}

const SidebarNav = memo(({ items, activeId, onPress }: Props) => {
  const theme = useTheme()
  // 车机单独布局: 短边(竖向最小边) >= 1000dp 即大屏车机/平板(兼容横竖屏)
  const { width, height } = useWindowSize()
  const isCar = Math.min(width, height) >= 1000
  // 车机: 大图标大字号, 纵向均匀分布撑满; 手机: 紧凑
  const rowHeight = isCar ? 96 : 52
  const fontSize = isCar ? 40 : 16
  const iconSize = isCar ? 60 : 20
  const padH = isCar ? 24 : 12

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onPress(item.id)}
            activeOpacity={0.6}
            style={[
              styles.row,
              { height: rowHeight, paddingHorizontal: padH },
              active && {
                backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderRadius: 14,
              },
            ]}
          >
            {/* 左侧激活竖条 */}
            {active ? (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: 4,
                  borderRadius: 2,
                  backgroundColor: theme['c-primary'],
                }}
              />
            ) : null}
            {/* 图标 + 文字: 同盒居中, 无基线问题 */}
            <View style={[styles.content, { height: rowHeight }]}>
              {item.icon ? (
                <View style={[styles.iconBox, { width: iconSize + 12, marginRight: iconSize * 0.9 }]}>
                  {item.icon.startsWith('svg:')
                    ? <SvgIcon name={item.icon.slice(4)} size={iconSize} color={active ? theme['c-primary'] : '#ffffff'} />
                    : <Icon name={item.icon} rawSize={iconSize} color={active ? theme['c-primary'] : '#ffffff'} />}
                </View>
              ) : null}
              <Text size={fontSize} color={active ? '#ffffff' : 'rgba(255,255,255,0.9)'} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
})

export default SidebarNav
