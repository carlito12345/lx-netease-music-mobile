/**
 * SettingMiniLyricLineCount - 迷你歌词显示行数(基础设置)
 * 滑杆 1-7 行, 拖动实时更新
 */
import { useState } from 'react'

import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import styles from './style'

const MiniLyricLineCount = () => {
  const theme = useTheme()
  const lineCount = useSettingValue('playDetail.style.miniLyricLineCount')
  const [sliderSize, setSliderSize] = useState(lineCount)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart: SliderProps['onSlidingStart'] = () => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = (value) => {
    setSliderSize(Math.round(value))
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = (value) => {
    setSliding(false)
    const v = Math.round(value)
    if (lineCount == v) return
    updateSetting({ 'playDetail.style.miniLyricLineCount': v })
  }

  return (
    <View style={styles.container}>
      <Text>迷你歌词行数</Text>
      <View style={styles.content}>
        <Text style={styles.label} color={theme['c-font-label']}>
          {isSliding ? sliderSize : lineCount}
        </Text>
        <Slider
          minimumValue={1}
          maximumValue={7}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={1}
          value={lineCount}
        />
      </View>
    </View>
  )
}

export default MiniLyricLineCount
