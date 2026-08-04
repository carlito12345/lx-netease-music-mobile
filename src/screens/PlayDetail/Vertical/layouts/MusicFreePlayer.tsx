/**
 * MusicFreePlayer - MusicFree 风格播放控件(完整组件)
 * MoreBtn → PlayInfo(进度条) → ControlBtn
 * 适配新底包: 组件内部用 theme, 无需 backgroundColor prop
 */
import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import MoreBtn from '../Player/components/MoreBtn'
import PlayInfo from '../Player/components/PlayInfo'
import ControlBtn from '../Player/components/ControlBtn'

interface Props {
  componentId: string
}

export default memo(({ componentId }: Props) => {
  return (
    <View style={styles.container}>
      <MoreBtn componentId={componentId} />
      <PlayInfo />
      <ControlBtn />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 15,
    paddingBottom: 8,
  },
})
