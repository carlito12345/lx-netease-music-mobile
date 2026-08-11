import { memo } from 'react'

import Section from '../../components/Section'
import ResourceCache from './ResourceCache'
import MetaCache from './MetaCache'
import DislikeList from './DislikeList'
import Log from './Log'
import Permission from './Permission'
import WakeWord from './WakeWord'
import AsrLog from './AsrLog'
// import MaxCache from './MaxCache'
import { useI18n } from '@/lang'
import { DESIGN } from '@/theme/design'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_other')} bgColor={DESIGN.cardDark2}>
      <ResourceCache />
      <MetaCache />
      <DislikeList />
      <WakeWord />
      <AsrLog />
      <Permission />
      <Log />
      {/* <MaxCache /> */}
    </Section>
  )
})
