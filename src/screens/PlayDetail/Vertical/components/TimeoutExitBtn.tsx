import { memo, useRef } from 'react'
import TimeoutExitEditModal, {
  type TimeoutExitEditModalType,
  useTimeInfo,
} from '@/components/TimeoutExitEditModal'
import { useTheme } from '@/store/theme/hook'
import Btn from './Btn'

export default memo(() => {
  const theme = useTheme()
  const modalRef = useRef<TimeoutExitEditModalType>(null)

  const timeInfo = useTimeInfo()

  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <>
      <Btn
        icon="timer"
        color={timeInfo.active ? theme['c-primary-font-active'] : theme['c-font']}
        onPress={handleShow}
      />
      <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} />
    </>
  )
})
