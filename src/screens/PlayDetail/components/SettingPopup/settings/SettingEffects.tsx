/**
 * SettingEffects - 播放页特效设置(完整组件)
 * 自包含: ShinyText歌名闪光 + MagicRings点击涟漪 开关及参数
 */
import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import CheckBoxItem from '@/screens/Home/Views/Setting/components/CheckBoxItem'

export default memo(() => {
  const theme = useTheme()
  const shinyText = useSettingValue('playDetail.effect.shinyText.enabled')
  const magicRings = useSettingValue('playDetail.effect.magicRings.enabled')
  const magicRingsRadius = useSettingValue('playDetail.effect.magicRings.radius')

  return (
    <View style={styles.content}>
      <Text size={13} color={theme['c-primary']} style={styles.sectionTitle}>特效</Text>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={shinyText}
          label="歌名闪光"
          onChange={(v) => updateSetting({ 'playDetail.effect.shinyText.enabled': v })}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={magicRings}
          label="点击涟漪"
          onChange={(v) => updateSetting({ 'playDetail.effect.magicRings.enabled': v })}
        />
      </View>
      {magicRings ? (
        <View style={styles.radiusRow}>
          <Text size={12} color={theme['c-font-label']}>涟漪大小</Text>
          <View style={styles.radiusOptions}>
            {[24, 34, 44, 54].map(v => {
              const active = magicRingsRadius === v
              return (
                <View key={v} style={[
                  styles.radiusChip,
                  active ? { backgroundColor: theme['c-primary'] } : { backgroundColor: 'rgba(128,128,128,0.15)' }
                ]}>
                  <Text
                    size={11}
                    color={active ? '#fff' : theme['c-font']}
                    onPress={() => updateSetting({ 'playDetail.effect.magicRings.radius': v })}
                  >{v}</Text>
                </View>
              )
            })}
          </View>
        </View>
      ) : null}
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 8,
    paddingLeft: 0,
    paddingRight: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    paddingLeft: 20,
  },
  listContainer: {
    paddingTop: 5,
    paddingLeft: 0,
    marginBottom: 6,
  },
  radiusRow: {
    marginTop: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
})
