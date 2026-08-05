/**
 * PlaylistBtn - 播放队列入口按钮
 */
import Btn from './Btn'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'
import { COMPONENT_IDS } from '@/config/constant'

export default () => {
  const handleOpenPlaylist = () => {
    const playDetailId = commonState.componentIds.find(c => c.name === COMPONENT_IDS.playDetail)?.id
    if (playDetailId) {
      navigations.pushPlayQueueScreen(playDetailId)
    }
  }

  return <Btn icon="menu" onPress={handleOpenPlaylist} />
}
