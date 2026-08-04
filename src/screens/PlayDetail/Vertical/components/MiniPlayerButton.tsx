/**
 * MiniPlayerButton - 迷你播放器启动按钮(完整组件)
 * 点击打开悬浮窗小窗, 自包含权限检查
 */
import { memo } from 'react'
import Btn from './Btn'
import { toast } from '@/utils/tools'

export default memo(() => {
  const handlePress = () => {
    void import('@/plugins/miniplayer').then(async (mod) => {
      const mp = mod?.default
      if (!mp || !mp.isAvailable) { toast('小窗模式不可用'); return }
      if (!await mp.hasOverlayPermission()) {
        toast('需要悬浮窗权限')
        void mp.openOverlaySettings()
        return
      }
      const running = await mp.isServiceRunning()
      await mp.show()
      toast(running ? '小窗已刷新' : '小窗已打开')
    })
  }

  return <Btn icon="fullscreen" onPress={handlePress} />
})
