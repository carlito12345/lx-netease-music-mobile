/**
 * BubbleSearch — 胶囊形搜索框(移植自 reactbits BubbleMenu 的 pill 视觉语言)
 *
 * 视觉特征:
 *   1. 全圆角胶囊容器(borderRadius = height/2),BubbleMenu 的 pill 形态
 *   2. 左侧搜索图标,聚焦时主题色高亮 + 弹性放大
 *   3. 支持清除按钮、提交回调,与项目 Input 行为一致
 *
 * 独立完整: 只依赖项目公共组件(Input/Icon/Text/useTheme),自带全部默认值。
 * 主题统一: 背景/文字/图标全部走主题 token。
 */

import { forwardRef, useImperativeHandle, useRef, useState, useCallback, useMemo } from 'react'
import { View, TouchableOpacity, Animated, type TextInputProps } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'

export interface BubbleSearchProps extends TextInputProps {
  /** 占位文本 */
  placeholder?: string
  /** 高度(dp),默认 36 */
  height?: number
  /** 清除回调 */
  onClearText?: () => void
  /** 语音按钮回调(传入则显示麦克风按钮) */
  onVoicePress?: () => void
  /** 语音识别中(图标高亮) */
  voiceListening?: boolean
  /** 提交回调 */
  onSubmit?: (text: string) => void
  /** 文字变化回调 */
  onChangeText?: (text: string) => void
}

export interface BubbleSearchType {
  focus: () => void
  blur: () => void
  setText: (text: string) => void
  clear: () => void
}

const BubbleSearch = forwardRef<BubbleSearchType, BubbleSearchProps>(
  ({ placeholder = '搜索...', height = 36, onClearText, onSubmit, onChangeText, onVoicePress, voiceListening = false, ...props }, ref) => {
    const theme = useTheme()
    const [text, setText] = useState('')
    const inputRef = useRef<InputType>(null)
    const [focused, setFocused] = useState(false)
    // 聚焦弹性动画
    const scaleAnim = useRef(new Animated.Value(1)).current

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setText: (t: string) => { setText(t) },
      clear: () => inputRef.current?.clear(),
    }))

    const handleFocus = useCallback(() => {
      setFocused(true)
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }).start()
    }, [scaleAnim])

    const handleBlur = useCallback(() => {
      setFocused(false)
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }).start()
    }, [scaleAnim])

    const handleChange = useCallback((t: string) => {
      setText(t)
      onChangeText?.(t)
    }, [onChangeText])

    const handleClear = useCallback(() => {
      setText('')
      inputRef.current?.clear()
      onClearText?.()
      onChangeText?.('')
    }, [onClearText, onChangeText])

    const handleSubmit = useCallback((t: string) => {
      onSubmit?.(t)
    }, [onSubmit])

    // 胶囊背景:聚焦时主题色半透明,平时输入框背景
    const bgColor = focused ? theme['c-primary-light-300-alpha-500'] : theme['c-primary-input-background']
    const borderColor = focused ? theme['c-primary'] : 'transparent'
    const iconColor = focused ? theme['c-primary'] : theme['c-font-label']

    return (
      <Animated.View
        style={[
          styles.container,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: bgColor,
            borderColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconWrap, { height }]}>
          <Icon name="search-2" color={iconColor} size={18} />
        </View>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={text}
          onChangeText={handleChange}
          onSubmitEditing={({ nativeEvent: { text: t } }) => handleSubmit(t)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.input}
          clearBtn={!!text}
          onClearText={handleClear}
          {...props}
        />
        {text ? (
          <TouchableOpacity style={[styles.clearBtn, { height }]} onPress={handleClear}>
            <Icon name="remove" color={theme['c-font-label']} size={14} />
          </TouchableOpacity>
        ) : null}
        {onVoicePress ? (
          <TouchableOpacity
            style={[styles.voiceBtn, { height }]}
            onPress={onVoicePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name="voice"
              color={voiceListening ? theme['c-primary'] : theme['c-font-label']}
              size={voiceListening ? 20 : 18}
            />
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    )
  }
)
BubbleSearch.displayName = 'BubbleSearch'

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: 8,
  },
  iconWrap: {
    paddingLeft: 14,
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingLeft: 2,
    paddingRight: 2,
    fontSize: 14,
  },
  voiceBtn: {
    paddingLeft: 8,
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 6,
  },
})

export default BubbleSearch
