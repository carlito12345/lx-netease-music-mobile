import { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'
import { type SizeHandler, windowSizeTools } from '@/utils/windowSizeTools'

export default () => {
  // 初始: 优先 windowSizeTools(已初始化), 否则用 Dimensions 兜底(立即拿到 dp)
  const initSize = windowSizeTools.getSize()
  const [size, setSize] = useState(
    initSize.width > 0 ? initSize : { width: Dimensions.get('window').width, height: Dimensions.get('window').height }
  )

  useEffect(() => {
    const onChange: SizeHandler = (size) => {
      setSize(size)
    }

    const remove = windowSizeTools.onSizeChanged(onChange)
    return () => {
      remove()
    }
  }, [])

  return size
}
