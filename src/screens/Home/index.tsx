import { useCallback, useEffect, useRef, useState } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId, setNavActiveId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import ArtistSelectorManager from '@/components/ArtistSelectorManager'
import settingState from '@/store/setting/state'
import { useI18n } from "@/lang"
import { BackHandler } from "react-native"
import { toast } from "@/utils/tools.ts"
import commonState from '@/store/common/state'
import { useBackHandler } from "@/utils/hooks/useBackHandler.ts"
import WebLoginManager from "@/components/WebLoginManager.tsx"
import DownloadBall from "@/components/DownloadBall"
import VideoPlayerManager from "@/components/VideoPlayerManager.tsx"
import { FloatingMicButton, VoicePanel } from '@/components/VoiceAssistant'
import { startListening, stopListening, writeOpLog } from '@/utils/asr/manager'
import useVoiceCommands from '@/utils/asr/useVoiceCommands'
import { getData, saveData } from '@/plugins/storage'

const opLog = (event: string) => {
  writeOpLog(event)
  const time = new Date().toLocaleTimeString()
  const line = `[${time}] ${event}`
  getData('asr_op_log').then((v: any) => {
    const next = v ? v + '\n' + line : line
    saveData('asr_op_log', next.split('\n').slice(-200).join('\n'))
  }).catch(() => {})
}

interface Props { componentId: string }
export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  const t = useI18n()
  const lastBackPressed = useRef(0)
  const [voiceActive, setVoiceActive] = useState(false)
  const { parseCommand } = useVoiceCommands()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      const timer = setTimeout(() => { navigations.pushPlayDetailScreen(componentId, true) }, 1200)
      return () => clearTimeout(timer)
    }

    const handleGlobalSearch = () => {
      setNavActiveId('nav_search')
    }
    global.app_event.on('voiceNavToSearch', handleGlobalSearch)
    return () => { global.app_event.off('voiceNavToSearch', handleGlobalSearch) }
  }, [componentId])

  useBackHandler(useCallback(() => {
    if (commonState.componentIds.length > 1) return false
    if (commonState.navActiveId === 'nav_setting') return false
    if (commonState.navActiveId === 'nav_play_history') { setNavActiveId(commonState.lastNavActiveId); return true }
    const now = Date.now()
    if (lastBackPressed.current && now - lastBackPressed.current < 2000) { BackHandler.exitApp(); return true }
    lastBackPressed.current = now
    toast(t('exit_app_tip_double_press'))
    return true
  }, [t]))

  const handleVoicePress = useCallback(async () => {
    if (voiceActive) {
      setVoiceActive(false)
      const r = await stopListening()
      opLog('手动停止: raw=' + (r.text || '(空)'))
      if (r.text) {
        const cmd = parseCommand(r.text)
        opLog('解析: type=' + cmd.type + ' navId=' + (cmd.navId || '') + ' text=' + (cmd.text || ''))
        if (cmd.type === 'navigate' && cmd.navId) {
          setNavActiveId(cmd.navId as any)
        } else if (cmd.type === 'search' && cmd.text) {
          // 使用全局事件,确保搜索页拿到文字后自动搜索
          global.app_event.emit('triggerSearch', cmd.text)
        }
      }
    } else {
      setVoiceActive(true)
      opLog('开始聆听')
      startListening().catch(() => { setVoiceActive(false); opLog('启动失败') })
    }
  }, [voiceActive, parseCommand])

  const handleVoiceText = useCallback((text: string) => {
    setVoiceActive(false)
    if (!text) { opLog('面板超时/无结果'); return }
    opLog('面板结果: raw=' + text)
    const cmd = parseCommand(text)
    opLog('解析: type=' + cmd.type + ' navId=' + (cmd.navId || '') + ' text=' + (cmd.text || ''))
    if (cmd.type === 'navigate' && cmd.navId) {
      setNavActiveId(cmd.navId as any)
    } else if (cmd.type === 'search' && cmd.text) {
      setNavActiveId('nav_search')
      setTimeout(() => global.app_event.emit('triggerSearch', cmd.text), 200)
    }
  }, [parseCommand])

  return (
    <>
      <PageContent>{isHorizontalMode ? <Horizontal componentId={componentId} /> : <Vertical componentId={componentId} />}</PageContent>
      <ArtistSelectorManager />
      <WebLoginManager />
      <VideoPlayerManager />
      <DownloadBall />
      <FloatingMicButton onPress={handleVoicePress} active={voiceActive} />
      <VoicePanel visible={voiceActive} onText={handleVoiceText} />
    </>
  )
}
