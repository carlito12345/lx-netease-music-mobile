/**
 * SettingBackground - 背景模式设置(完整组件)
 * 纯色/封面主色/封面模糊/星云壁纸
 * 规范: 留空不贴边, 居左对齐
 */
import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { setSpText } from '@/utils/pixelRatio'

const BG_TYPES = [
  { id: 'theme', label: '主题' },
  { id: 'solid', label: '纯色' },
  { id: 'follow', label: '封面主色' },
  { id: 'blur', label: '封面模糊' },
  { id: 'wallpaper', label: '星云壁纸' },
] as const

const SOLID_COLORS = [
  { label: '深蓝', value: '#1a1a2e' },
  { label: '深空黑', value: '#0d1117' },
  { label: '暗夜紫', value: '#1a0d2e' },
  { label: '墨绿', value: '#0d2818' },
  { label: '酒红', value: '#2e0d1a' },
  { label: '深灰', value: '#1c1c1c' },
  { label: '午夜蓝', value: '#0d1b2a' },
  { label: '炭黑', value: '#121212' },
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
      <Text style={[styles.title, { color: theme['c-primary'], fontSize: setSpText(13) }]}>背景模式</Text>
      <View style={styles.row}>
        {BG_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[styles.chip, activeMode === type.id && { backgroundColor: theme['c-primary'] }]}
            onPress={() => handleTypeChange(type.id)}
          >
            <Text style={{ fontSize: setSpText(12), color: activeMode === type.id ? '#fff' : theme['c-font'] }}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeMode === 'wallpaper' && (
        <>
          <Text style={[styles.subLabel, { color: theme['c-font-label'], fontSize: setSpText(12) }]}>壁纸颜色</Text>
          <View style={styles.row}>
            {WALLPAPER_COLORS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.chip, wallpaperColor === c.value && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.wallpaper.color': c.value } as any)}
              >
                <Text style={{ fontSize: setSpText(12), color: wallpaperColor === c.value ? '#fff' : theme['c-font'] }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {activeMode === 'solid' && (
        <>
          <Text style={[styles.subLabel, { color: theme['c-font-label'], fontSize: setSpText(12) }]}>纯色背景</Text>
          <View style={styles.row}>
            {SOLID_COLORS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.chip, solidColor === c.value && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.background.solidColor': c.value } as any)}
              >
                <Text style={{ fontSize: setSpText(12), color: solidColor === c.value ? '#fff' : theme['c-font'] }}>{c.label}</Text>
              </TouchableOpacity>
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
