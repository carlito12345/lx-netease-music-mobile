import { memo } from 'react'

import Section from '../../components/Section'
import IsShowHotSearch from './IsShowHotSearch'
import IsShowHistorySearch from './IsShowHistorySearch'

import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_search')} bgColor='#2F293A'>
      <IsShowHotSearch />
      <IsShowHistorySearch />
    </Section>
  )
})
