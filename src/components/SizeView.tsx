import { memo, useCallback, useRef, useEffect } from 'react'
import { type LayoutChangeEvent, StyleSheet, View, StatusBar, Dimensions } from 'react-native'
import commonState from '@/store/common/state'
import settingState from '@/store/setting/state'
import { setStatusbarHeight } from '@/core/common'
import { windowSizeTools, getWindowSize } from '@/utils/windowSizeTools'

const getStatusbarHeight = (winHeight: number, layoutHeight: number) => {
  const height =
    !settingState.setting['common.alwaysKeepStatusbarHeight'] &&
    parseFloat(winHeight.toFixed(2)) >= parseFloat(layoutHeight.toFixed(2))
      ? 0
      : (StatusBar.currentHeight ?? 0)

  return height
}

export default memo(
  () => {
    const currentHeightRef = useRef(commonState.statusbarHeight)
    const sizeRef = useRef([0, 0])
    const dimensionsChangedRef = useRef(true)
    const handleLayout = useCallback(
      ({
        nativeEvent: { layout },
      }: LayoutChangeEvent | { nativeEvent: { layout: { width: number; height: number } } }) => {
        // 冷启动修复: 每次布局都更新 windowSizeTools(不再一次性锁),
        // 首帧布局错误(0/偏小)后, 布局稳定时自动写入正确尺寸, 修复页面倾斜/错位
        if (layout.width <= 0 || layout.height <= 0) return
        // 只要尺寸有意义的布局变化就同步(状态栏高度仅首次稳定后设置)
        const currentSize = windowSizeTools.getSize()
        if (currentSize.width != layout.width || currentSize.height != layout.height) {
          windowSizeTools.setWindowSize(layout.width, layout.height)
        }
        if (!dimensionsChangedRef.current) return
        void getWindowSize().then((size) => {
          dimensionsChangedRef.current = false
          sizeRef.current = [size.height, layout.height]
          const height = getStatusbarHeight(size.height, layout.height)
          if (currentHeightRef.current != height) {
            currentHeightRef.current = height
            setStatusbarHeight(height)
          }
        })
      },
      []
    )
    useEffect(() => {
      // let timeout: NodeJS.Timeout | null = null
      const subscription = Dimensions.addEventListener('change', () => {
        dimensionsChangedRef.current = true
        // if (timeout) clearTimeout(timeout)
        // timeout = setTimeout(() => {
        //   timeout = null
        //   viewRef.current?.measureInWindow((x, y, width, height) => {
        //     handleLayout({ nativeEvent: { layout: { width, height } } })
        //   })
        // }, 100)
      })

      const handleSettingUpdate = (keys: Array<keyof LX.AppSetting>) => {
        if (!keys.includes('common.alwaysKeepStatusbarHeight') || !sizeRef.current[1]) return
        const height = getStatusbarHeight(sizeRef.current[0], sizeRef.current[1])

        if (currentHeightRef.current != height) {
          currentHeightRef.current = height
          setStatusbarHeight(height)
        }
      }
      global.state_event.on('configUpdated', handleSettingUpdate)

      return () => {
        subscription.remove()
        global.state_event.off('configUpdated', handleSettingUpdate)
      }
    }, [])
    return <View style={StyleSheet.absoluteFill} onLayout={handleLayout} />
  },
  () => true
)
