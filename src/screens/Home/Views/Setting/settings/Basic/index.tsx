import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'
import WyCookie from './WyCookie'
import NavMenu from "@/screens/Home/Views/Setting/settings/Basic/NavMenu.tsx";

export default memo(() => {
  const t = useI18n()

  return (
    <>
      {/* 启动与首页 */}
      <Section title={t('setting_basic')} bgColor='#1B1722'>
        <IsStartupAutoPlay />
        {global.lx.isCarMode ? (
          <>
            <IsShowBackBtn />
            <IsShowExitBtn />
          </>
        ) : null}
        <IsHomePageScroll />
        <IsUseSystemFileSelector />
        <IsAlwaysKeepStatusbarHeight />
      </Section>

      {/* 主题: Theme/index 内部已含 极光+主题 两个标准 section */}
      <Theme />

      {/* 导航 */}
      <Section title={t('setting_basic_nav')} bgColor='#2F293A'>
        <DrawerLayoutPosition />
        <NavMenu />
      </Section>

      {/* 语言与字体 */}
      <Section title={t('setting_basic_lang_font')} bgColor='#2F293A'>
        <Language />
        <FontSize />
      </Section>

      {/* 分享 */}
      <Section title={t('setting_basic_share')} bgColor='#2F293A'>
        <ShareType />
      </Section>

      {/* 音源 */}
      <Section title={t('setting_basic_source_section')} bgColor='#2F293A'>
        <Source />
        <SourceName />
      </Section>

      {/* 账号 */}
      <Section title={t('setting_basic_account')} bgColor='#2F293A'>
        <WyCookie />
      </Section>
    </>
  )
})
