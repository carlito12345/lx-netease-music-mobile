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

// 回声颜色选项(跟随主题 / 固定色)
const ECHO_COLORS = [
  { label: '跟随主题', value: '' },
  { label: '紫色', value: '#7c3aed' },
  { label: '青色', value: '#0891b2' },
  { label: '粉色', value: '#db2777' },
  { label: '金色', value: '#d97706' },
]

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
  const echo = useSettingValue('playDetail.effect.echo.enabled')
  const echoColor = useSettingValue('playDetail.effect.echo.color')
  const spectrum = useSettingValue('playDetail.effect.spectrum.enabled')

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme['c-primary'], fontSize: setSpText(13) }]}>
        视觉特效
      </Text>

      {/* 粒子星空 */}
      <CheckBoxItem
        check={starfield}
        label="粒子星空"
        onChange={v => updateSetting({ 'playDetail.effect.starfield.enabled': v })}
      />
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

      {/* 音域回声 */}
      <CheckBoxItem
        check={echo}
        label="音域回声"
        onChange={v => updateSetting({ 'playDetail.effect.echo.enabled': v })}
      />
      {echo ? (
        <View style={styles.subOptions}>
          <Text style={[styles.subLabel, { color: theme['c-font-label'], fontSize: setSpText(12) }]}>
            颜色
          </Text>
          <View style={styles.row}>
            {ECHO_COLORS.map(item => {
              const active = echoColor === item.value
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => updateSetting({ 'playDetail.effect.echo.color': item.value })}
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

      {/* 频谱柱 */}
      <CheckBoxItem
        check={spectrum}
        label="频谱柱"
        onChange={v => updateSetting({ 'playDetail.effect.spectrum.enabled': v })}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingTop: 4,
  },
  sectionTitle: {
    paddingBottom: 6,
  },
  subOptions: {
    paddingLeft: 4,
    paddingBottom: 8,
  },
  subLabel: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
})
