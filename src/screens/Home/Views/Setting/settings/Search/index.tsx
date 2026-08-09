import { memo } from 'react'

import Section from '../../components/Section'
import IsShowHotSearch from './IsShowHotSearch'
import IsShowHistorySearch from './IsShowHistorySearch'

import { useI18n } from '@/lang'
import { DESIGN } from '@/theme/design'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_search')} bgColor={DESIGN.cardDark2}>
      <IsShowHotSearch />
      <IsShowHistorySearch />
    </Section>
  )
})
