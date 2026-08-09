/**
 * SettingBackground - 背景模式设置(完整组件)
 * 纯色/封面主色/封面模糊/星云壁纸
 * 规范: 留空不贴边, 居左对齐
 */
import { memo, useCallback } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { setSpText } from '@/utils/pixelRatio'
import Chip from '@/components/common/Chip'
import { DESIGN } from '@/theme/design'

const BG_TYPES = [
  { id: 'theme', label: '主题' },
  { id: 'solid', label: '纯色' },
  { id: 'follow', label: '封面主色' },
  { id: 'blur', label: '封面模糊' },
  { id: 'wallpaper', label: '星云壁纸' },
] as const

const SOLID_COLORS = [
  { label: '深蓝', value: DESIGN.background.solid.deepBlue },
  { label: '深空黑', value: DESIGN.background.solid.deepSpace },
  { label: '暗夜紫', value: DESIGN.background.solid.darkPurple },
  { label: '墨绿', value: DESIGN.background.solid.darkGreen },
  { label: '酒红', value: DESIGN.background.solid.wineRed },
  { label: '深灰', value: DESIGN.background.solid.darkGray },
  { label: '午夜蓝', value: DESIGN.background.solid.midnightBlue },
  { label: '炭黑', value: DESIGN.background.solid.charcoal },
] as const

const WALLPAPER_COLORS = [
  { label: '主题色', value: '' },
  { label: '靛蓝', value: '#6366f1' },
  { label: '翡翠', value: '#10b981' },
  { label: '烈焰', value: '#ef4444' },
  { label: '极光', value: '#06b6d4' },
  { label: '暖阳', value: '#f59e0b' },
  { label: '粉紫', value: '#ec4899' },
  { label: '渐变', value: 'gradient' },
] as const

export default memo(() => {
  const theme = useTheme()
  const bgType = useSettingValue('playDetail.background.type')
  const followCover = useSettingValue('playDetail.background.followCover')
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const wallpaperColor = useSettingValue('playDetail.effect.wallpaper.color')
  const solidColor = useSettingValue('playDetail.background.solidColor')

  const activeMode = wallpaperEnabled ? 'wallpaper'
    : bgType === 'solid' && followCover ? 'follow' : bgType

  const handleTypeChange = useCallback((mode: string) => {
    if (mode === 'wallpaper') {
      updateSetting({ 'playDetail.effect.wallpaper.enabled': true })
    } else {
      updateSetting({ 'playDetail.effect.wallpaper.enabled': false })
      if (mode === 'follow') {
        updateSetting({
          'playDetail.background.type': 'solid',
          'playDetail.background.followCover': true,
        })
      } else if (mode === 'solid') {
        updateSetting({
          'playDetail.background.type': 'solid',
          'playDetail.background.followCover': false,
        })
      } else {
        updateSetting({
          'playDetail.background.type': mode as LX.AppSetting['playDetail.background.type'],
          'playDetail.background.followCover': false,
        })
      }
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title} size={13} color={theme['c-primary']}>背景模式</Text>
      <View style={styles.row}>
        {BG_TYPES.map(type => (
          <Chip
            key={type.id}
            label={type.label}
            active={activeMode === type.id}
            onPress={() => handleTypeChange(type.id)}
          />
        ))}
      </View>

      {activeMode === 'wallpaper' && (
        <>
          <Text style={styles.subLabel} size={12} color={theme['c-font-label']}>壁纸颜色</Text>
          <View style={styles.row}>
            {WALLPAPER_COLORS.map(c => (
              <Chip
                key={c.value}
                label={c.label}
                active={wallpaperColor === c.value}
                onPress={() => updateSetting({ 'playDetail.effect.wallpaper.color': c.value } as any)}
              />
            ))}
          </View>
        </>
      )}

      {activeMode === 'solid' && (
        <>
          <Text style={styles.subLabel} size={12} color={theme['c-font-label']}>纯色背景</Text>
          <View style={styles.row}>
            {SOLID_COLORS.map(c => (
              <Chip
                key={c.value}
                label={c.label}
                active={solidColor === c.value}
                onPress={() => updateSetting({ 'playDetail.background.solidColor': c.value } as any)}
              />
            ))}
          </View>
        </>
      )}
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
  title: {
    paddingBottom: 10,
    paddingLeft: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  subLabel: {
    marginBottom: 8,
    marginTop: 10,
    paddingLeft: 20,
  },
})
