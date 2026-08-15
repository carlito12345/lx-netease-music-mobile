import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import { useI18n } from '@/lang'
import Section from '@/screens/Home/Views/Setting/components/Section'
import { storageDataPrefix } from '@/config/constant'
import { getData, saveData } from '@/plugins/storage'

import SettingLyricProgress from './settings/SettingLyricProgress'
import SettingVolume from './settings/SettingVolume'
import SettingPlaybackRate from './settings/SettingPlaybackRate'
import SettingMiniLyricLineCount from './settings/SettingMiniLyricLineCount'
import SettingLrcFontSize from './settings/SettingLrcFontSize'
import SettingLrcAlign from './settings/SettingLrcAlign'
import SettingCoverSpin from "@/screens/PlayDetail/components/SettingPopup/settings/SettingCoverSpin.tsx";
import SettingEffects from "@/screens/PlayDetail/components/SettingPopup/settings/SettingEffects.tsx";
import SettingLayout from "@/screens/PlayDetail/components/SettingPopup/settings/SettingLayout.tsx";
import SettingVisualEffects from "@/screens/PlayDetail/components/SettingPopup/settings/SettingVisualEffects.tsx";
import SettingBackground from "@/screens/PlayDetail/components/SettingPopup/settings/SettingBackground.tsx";
import SettingCover from "@/screens/PlayDetail/components/SettingPopup/settings/SettingCover.tsx";
import SettingMiniPlayer from "@/screens/PlayDetail/components/SettingPopup/settings/SettingMiniPlayer.tsx";
import { DESIGN } from '@/theme/design'

export interface SettingPopupProps extends Omit<PopupProps, 'children'> {
  direction: 'vertical' | 'horizontal'
}

export interface SettingPopupType {
  show: () => void
}

const COLLAPSE_KEY = storageDataPrefix.playDetailSettingCollapse

const DEFAULT_COLLAPSE: Record<string, boolean> = {
  basic: true,
  appearance: true,
  effects: true,
}

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  // console.log('render import export')
  const t = useI18n()
  const [collapseMap, setCollapseMap] = useState<Record<string, boolean>>(DEFAULT_COLLAPSE)

  // 初始化读取持久化的折叠状态
  useEffect(() => {
    void getData<Record<string, boolean>>(COLLAPSE_KEY).then((data) => {
      if (data) setCollapseMap({ ...DEFAULT_COLLAPSE, ...data })
    })
  }, [])

  const handleToggle = useCallback((id: string) => (open: boolean) => {
    setCollapseMap(prev => {
      const next = { ...prev, [id]: open }
      void saveData(COLLAPSE_KEY, next)
      return next
    })
  }, [])

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          popupRef.current?.setVisible(true)
        })
      }
    },
  }))

  return visible ? (
    <Popup ref={popupRef} title={t('play_detail_setting_title')} hideTitle {...props} bgHide={false} panelStyle={{ backgroundColor: 'transparent' }}>
      <ScrollView>
        <View onStartShouldSetResponder={() => true}>
          {/* 基础设置组: App 设置同款折叠卡片(深色背景+白字, 折叠状态持久化) */}
          <Section title={t('play_detail_setting_basic')} bgColor={DESIGN.cardDark} hideTitle
            open={collapseMap.basic} onToggle={handleToggle('basic')}>
            <SettingLyricProgress />
            <SettingVolume />
            <SettingPlaybackRate />
            <SettingLrcFontSize direction={direction} />
            <SettingLrcAlign />
            <SettingMiniLyricLineCount />
          </Section>
          {/* 播放器外观组 */}
          <Section title={t('play_detail_setting_appearance')} bgColor={DESIGN.cardDark2} hideTitle
            open={collapseMap.appearance} onToggle={handleToggle('appearance')}>
            <SettingCoverSpin />
            <SettingLayout />
            <SettingBackground />
            <SettingCover />
          </Section>
          {/* 特效组 */}
          <Section title={t('play_detail_setting_effects')} bgColor={DESIGN.cardDark} hideTitle
            open={collapseMap.effects} onToggle={handleToggle('effects')}>
            <SettingMiniPlayer />
            <SettingVisualEffects />
            <SettingEffects />
          </Section>
        </View>
      </ScrollView>
    </Popup>
  ) : null
})

