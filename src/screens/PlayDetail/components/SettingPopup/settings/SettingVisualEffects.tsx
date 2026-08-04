/**
 * SettingVisualEffects - 视觉特效设置(完整组件)
 * 粒子星空 / 音域回声 / 频谱柱
 * 样式跟随 app 主题, 文字大小跟随 setSpText
 */
import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import CheckBoxItem from '@/screens/Home/Views/Setting/components/CheckBoxItem'
import { setSpText } from '@/utils/pixelRatio'
import { GRADIENT_PRESETS } from '@/components/common/GradientText'

// 星空粒子数量选项
const PARTICLE_COUNTS = [
  { label: '少', value: 20 },
  { label: '中', value: 40 },
  { label: '多', value: 80 },
]

export default memo(() => {
  const theme = useTheme()
  const starfield = useSettingValue('playDetail.effect.starfield.enabled')
  const starCount = useSettingValue('playDetail.effect.starfield.particleCount')
  const spectrum = useSettingValue('playDetail.effect.spectrum.enabled')
  const wallpaper = useSettingValue('playDetail.effect.wallpaper.enabled')
  const wallpaperColor = useSettingValue('playDetail.effect.wallpaper.color')
  const slideshow = useSettingValue('playDetail.effect.slideshow.enabled')
  const lyricGradient = useSettingValue('playDetail.effect.lyricGradient.enabled')
  const lyricGradientPreset = useSettingValue('playDetail.effect.lyricGradient.preset')
  const lyricStage = useSettingValue('playDetail.effect.lyricStage.enabled')
  const lyricProximity = useSettingValue('playDetail.effect.lyricProximity.enabled')

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme['c-primary'], fontSize: setSpText(13) }]}>
        视觉特效
      </Text>

      {/* 粒子星空 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={starfield}
          label="粒子星空"
          onChange={v => updateSetting({ 'playDetail.effect.starfield.enabled': v })}
        />
      </View>
      {starfield ? (
        <View style={styles.subOptions}>
          <Text style={[styles.subLabel, { color: theme['c-font-label'], fontSize: setSpText(12) }]}>
            粒子数量
          </Text>
          <View style={styles.row}>
            {PARTICLE_COUNTS.map(item => {
              const active = starCount === item.value
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => updateSetting({ 'playDetail.effect.starfield.particleCount': item.value })}
                  style={[styles.chip, { backgroundColor: active ? theme['c-primary'] : theme['c-primary-alpha-900'] }]}
                >
                  <Text style={{ fontSize: setSpText(12), color: active ? '#fff' : theme['c-font'] }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ) : null}

      {/* 粒子壁纸 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={wallpaper}
          label="粒子壁纸"
          onChange={v => updateSetting({ 'playDetail.effect.wallpaper.enabled': v })}
        />
      </View>
      {wallpaper ? (
        <View style={styles.subOptions}>
          <Text style={[styles.subLabel, { color: theme['c-font-label'], fontSize: setSpText(12) }]}>
            颜色
          </Text>
          <View style={styles.row}>
            {[
              { label: '跟随主题', value: '' },
              { label: '渐变', value: 'gradient' },
            ].map(item => {
              const active = wallpaperColor === item.value
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => updateSetting({ 'playDetail.effect.wallpaper.color': item.value })}
                  style={[styles.chip, { backgroundColor: active ? theme['c-primary'] : theme['c-primary-alpha-900'] }]}
                >
                  <Text style={{ fontSize: setSpText(12), color: active ? '#fff' : theme['c-font'] }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ) : null}

      {/* 幻灯片 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={slideshow}
          label="幻灯片"
          onChange={v => updateSetting({ 'playDetail.effect.slideshow.enabled': v })}
        />
      </View>

      {/* 频谱柱 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={spectrum}
          label="频谱柱"
          onChange={v => updateSetting({ 'playDetail.effect.spectrum.enabled': v })}
        />
      </View>

      {/* 歌词渐变色 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={lyricGradient}
          label="歌词渐变色"
          onChange={v => updateSetting({ 'playDetail.effect.lyricGradient.enabled': v })}
        />
      </View>
      {lyricGradient ? (
        <View style={styles.subOptions}>
          <Text style={[styles.subLabel, { color: theme['c-font-label'], fontSize: setSpText(12) }]}>
            配色
          </Text>
          <View style={styles.row}>
            {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => {
              const active = lyricGradientPreset === key
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => updateSetting({ 'playDetail.effect.lyricGradient.preset': key })}
                  style={[styles.chip, { backgroundColor: active ? theme['c-primary'] : theme['c-primary-alpha-900'] }]}
                >
                  <Text style={{ fontSize: setSpText(12), color: active ? '#fff' : theme['c-font'] }}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ) : null}

      {/* 歌词舞台 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={lyricStage}
          label="歌词舞台"
          onChange={v => updateSetting({ 'playDetail.effect.lyricStage.enabled': v })}
        />
      </View>

      {/* 歌词聚焦 */}
      <View style={styles.listContainer}>
        <CheckBoxItem
          check={lyricProximity}
          label="歌词聚焦"
          onChange={v => updateSetting({ 'playDetail.effect.lyricProximity.enabled': v })}
        />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingTop: 8,
    paddingLeft: 0,
    paddingRight: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    paddingBottom: 10,
    paddingLeft: 20,
  },
  listContainer: {
    paddingTop: 5,
    paddingLeft: 0,
    marginBottom: 6,
  },
  subOptions: {
    paddingTop: 8,
    paddingLeft: 20,
    paddingBottom: 12,
  },
  subLabel: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
})
