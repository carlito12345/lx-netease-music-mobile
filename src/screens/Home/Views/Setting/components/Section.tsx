import { Children, useState, useCallback } from 'react'
import {
  View, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager,
} from 'react-native'

// Android 启用 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { BackgroundColorProvider } from '@/store/backgroundColor'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
  card?: boolean
  bgColor?: string
  textColor?: string
  collapsible?: boolean
  defaultOpen?: boolean
  /** 受控展开状态(传入后由外部管理) */
  open?: boolean
  /** 受控切换回调 */
  onToggle?: (open: boolean) => void
  /** 隐藏外层组标题(卡片内折叠头已含标题, 避免深色卡场景白底白字) */
  hideTitle?: boolean
}

export default ({
  title, children, card = true, bgColor, textColor,
  collapsible = true, defaultOpen = false, open: openProp, onToggle,
  hideTitle = bgColor != null,
}: Props) => {
  const theme = useTheme()
  const [openState, setOpenState] = useState(defaultOpen)
  const isControlled = openProp != null
  const open = isControlled ? openProp : openState

  // 深色卡标题白字, 无 bgColor 跟随主题
  const headerTitleColor = bgColor ? '#ffffff' : theme['c-font']

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (isControlled) {
      onToggle?.(!openProp)
    } else {
      setOpenState(o => !o)
    }
  }, [isControlled, openProp, onToggle])

  const content = (
    <View>
      {Children.map(children, (child, index) => {
        const count = Children.count(children)
        return (
          <View key={index}>
            {child}
            {index < count - 1 ? (
              <View style={[styles.separator, { backgroundColor: theme['c-border-background'] }]} />
            ) : null}
          </View>
        )
      })}
    </View>
  )

  // 深色卡片: 局部 Provider 白字(仅影响卡片子树, 不触发全局重渲染)
  const cardContent = bgColor ? (
    <BackgroundColorProvider initialMode="white">
      {content}
    </BackgroundColorProvider>
  ) : content

  const body = collapsible ? (open ? cardContent : null) : cardContent

  return (
    <View style={styles.container}>
      {hideTitle ? null : (
        <Text style={[styles.title, { color: headerTitleColor }]} size={13}>
          {title}
        </Text>
      )}
      {card ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: bgColor ?? theme['c-main-background'],
              borderColor: bgColor ? 'transparent' : theme['c-border-background'],
            },
          ]}
        >
          {collapsible ? (
            <TouchableOpacity
              style={styles.header}
              activeOpacity={0.6}
              onPress={toggle}
            >
              <Text size={15} color={headerTitleColor} style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
                <Icon name="chevron-right" size={18} color={headerTitleColor} />
              </View>
            </TouchableOpacity>
          ) : null}
          {body}
        </View>
      ) : (
        <View>{children}</View>
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 14,
    marginBottom: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 46,
  },
  headerTitle: {
    fontWeight: '600',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
})
