import { memo } from 'react'

import Section from '../../components/Section'
import Theme from './Theme'
import IsAutoTheme from './IsAutoTheme'
import IsHideBgDark from './IsHideBgDark'
import IsDynamicBg from './IsDynamicBg'
import IsFontShadow from './IsFontShadow'
import Blur from "@/screens/Home/Views/Setting/settings/Theme/Blur.tsx";
import CustomBg from "@/screens/Home/Views/Setting/settings/Theme/CustomBg.tsx";
import PicOpacity from "@/screens/Home/Views/Setting/settings/Theme/PicOpacity.tsx";
import IsGlobalAurora from "@/screens/Home/Views/Setting/settings/Theme/IsGlobalAurora.tsx";
import { useI18n } from '@/lang/i18n'
import { DESIGN } from '@/theme/design'

export default memo(() => {
  const t = useI18n()

  return (
    <>
      {/* 全局极光: 标准 section, 第一张卡片 DESIGN.cardDark */}
      <Section title={t('setting_basic_theme_aurora')} bgColor={DESIGN.cardDark}>
        <IsGlobalAurora />
      </Section>
      {/* 主题设置: 第二张 DESIGN.cardDark2 */}
      <Section title={t('setting_basic_theme')} bgColor={DESIGN.cardDark2}>
        <Theme />
        <IsAutoTheme />
        <IsDynamicBg />
        <CustomBg />
        <PicOpacity />
        <Blur />
        <IsFontShadow />
      </Section>
    </>
  )
})
