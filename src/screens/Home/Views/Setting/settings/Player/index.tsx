import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowBluetoothLyric from './IsShowBluetoothLyric'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <>
      {/* 播放行为 */}
      <Section title={t('setting_player')} bgColor='#1B1722'>
        <IsSavePlayTime />
        <IsAutoCleanPlayedList />
        <IsHandleAudioFocus />
      </Section>

      {/* 音频 */}
      <Section title={t('setting_player_audio')} bgColor='#2F293A'>
        <IsEnableAudioOffload />
        <IsShowNotificationImage />
      </Section>

      {/* 歌词 */}
      <Section title={t('setting_player_lyric')} bgColor='#2F293A'>
        <IsShowBluetoothLyric />
        <IsShowLyricTranslation />
        <IsShowLyricRoma />
        <IsS2T />
      </Section>

      {/* 缓存与音质 */}
      <Section title={t('setting_player_cache_quality')} bgColor='#2F293A'>
        <MaxCache />
        <PlayHighQuality />
      </Section>
    </>
  )
})
