/**
 * IsGlobalAurora - 全局极光背景(标准 section 布局)
 * 开关 + 8种配色 + 4档强度,自包含无外部依赖
 * 与其他设置项一致: 由外层 Section 包裹, 内部标准 CheckBoxItem 项
 */
import { memo } from 'react'
import { View } from 'react-native'
import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import Chip from '@/components/common/Chip'

const AURORA_PRESETS = [
  { label: '极光', value: 'aurora' },
  { label: '日落', value: 'sunset' },
  { label: '海洋', value: 'ocean' },
  { label: '烈焰', value: 'flame' },
  { label: '霓虹', value: 'neon' },
  { label: '糖果', value: 'candy' },
  { label: '流金', value: 'gold' },
  { label: '冰雪', value: 'ice' },
] as const

export default memo(() => {
  const theme = useTheme()
  const enabled = useSettingValue('app.background.aurora.enabled')
  const preset = useSettingValue('app.background.aurora.preset')
  const intensity = useSettingValue('app.background.aurora.intensity')

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={enabled}
        label="全局极光背景"
        onChange={(v) => {
          updateSetting({ 'app.background.aurora.enabled': v })
        }}
      />
      {enabled ? (
        <View style={styles.options}>
          <Text size={12} color={theme['c-font-label']} style={styles.optionLabel}>配色</Text>
          <View style={styles.row}>
            {AURORA_PRESETS.map(p => (
              <Chip
                key={p.value}
                label={p.label}
                active={preset === p.value}
                onPress={() => updateSetting({ 'app.background.aurora.preset': p.value })}
              />
            ))}
          </View>
          <Text size={12} color={theme['c-font-label']} style={styles.optionLabel}>强度</Text>
          <View style={styles.row}>
            {[0.3, 0.5, 0.75, 1].map(v => (
              <Chip
                key={v}
                label={`${v}x`}
                active={intensity === v}
                onPress={() => updateSetting({ 'app.background.aurora.intensity': v })}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
  options: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  optionLabel: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
})
