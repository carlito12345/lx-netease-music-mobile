/**
 * SettingCover - 封面样式设置(完整组件)
 * 圆形/方形/圆角/黑胶/隐藏 + 特效(发光/粒子/旋转/滑动)
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

const COVER_STYLES = [
  { id: 'circle', label: '圆形' },
  { id: 'square', label: '方形' },
  { id: 'rounded', label: '圆角' },
  { id: 'vinyl', label: '黑胶' },
  { id: 'hidden', label: '隐藏' },
] as const

const EFFECTS = [
  { key: 'glow', label: '发光' },
  { key: 'particles', label: '粒子' },
  { key: 'rotate', label: '旋转' },
  { key: 'swipe', label: '滑动' },
] as const

export default memo(() => {
  const theme = useTheme()
  const coverStyle = useSettingValue('playDetail.cover.style')
  const effectGlow = useSettingValue('playDetail.cover.effect.glow')
  const effectParticles = useSettingValue('playDetail.cover.effect.particles')
  const effectSwipe = useSettingValue('playDetail.cover.effect.swipe')
  // 旋转复用原有功能(以 App 原有为准)
  const coverSpin = useSettingValue('playDetail.isCoverSpin')

  const effects = { glow: effectGlow, particles: effectParticles, rotate: coverSpin, swipe: effectSwipe }

  const handleStyleChange = useCallback((style: string) => {
    updateSetting({ 'playDetail.cover.style': style })
  }, [])

  const handleEffectToggle = useCallback((key: string) => {
    if (key === 'rotate') {
      // 复用原有封面旋转开关
      updateSetting({ 'playDetail.isCoverSpin': !coverSpin })
      return
    }
    updateSetting({ [`playDetail.cover.effect.${key}`]: !effects[key as keyof typeof effects] })
  }, [effects, coverSpin])

  return (
    <View style={styles.container}>
      <Text style={styles.title} size={13} color={theme['c-primary']}>封面样式</Text>
      <View style={styles.row}>
        {COVER_STYLES.map(s => (
          <Chip
            key={s.id}
            label={s.label}
            active={coverStyle === s.id}
            onPress={() => handleStyleChange(s.id)}
          />
        ))}
      </View>

      <Text style={styles.title} size={13} color={theme['c-primary']}>特效开关</Text>
      <View style={styles.row}>
        {EFFECTS.map(e => (
          <Chip
            key={e.key}
            label={e.label}
            active={effects[e.key as keyof typeof effects]}
            onPress={() => handleEffectToggle(e.key)}
          />
        ))}
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
  title: {
    paddingBottom: 10,
    paddingLeft: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 20,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
})
