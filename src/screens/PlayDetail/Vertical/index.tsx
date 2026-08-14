import {memo, useState, useRef, useMemo, useEffect, useCallback} from 'react'
import { View, AppState, StyleSheet, PanResponder, Dimensions } from 'react-native'

import Header from './components/Header'
// import Aside from './components/Aside'
// import Main from './components/Main'
import MiniLyricPreview from '@/components/player/MiniLyricPreview'
import Player from './Player'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { StarfieldBackground } from '@/components/starfield/StarfieldBackground'
import { SpectrumBars } from '@/components/echo/SpectrumBars'
import LiquidChrome, { type LiquidChromeHandle } from '@/components/common/GLShader/LiquidChrome'
import AudioCity from '@/components/common/GLShader/AudioCity'
import DenseWave, { type DenseWaveHandle } from '@/components/common/GLShader/DenseWave'
import { WallpaperView } from '@/components/wallpaper/WallpaperView'
import { SlideshowBg } from '@/components/slideshow/SlideshowBg'
import { PlayDetailBackground } from '@/components/common/PlayDetailBackground'
// import { useTheme } from '@/store/theme/hook'

const LyricPage = ({ activeIndex }: { activeIndex: number }) => {
  const initedRef = useRef(false)
  const lyric = useMemo(() => <Lyric />, [])
  switch (activeIndex) {
    // case 3:
    case 1:
      if (!initedRef.current) initedRef.current = true
      return lyric
    default:
      return initedRef.current ? lyric : null
  }
  // return activeIndex == 0 || activeIndex == 1 ? setting : null
}

// global.iskeep = false
export default memo(({ componentId }: { componentId: string }) => {
  // const theme = useTheme()
  const [pageIndex, setPageIndex] = useState(0)
  const pagerViewRef = useRef<PagerView>(null);
  const showLyricRef = useRef(false)

  // 特效设置读取(Hook 区)
  const theme = useTheme()
  const starfieldEnabled = useSettingValue('playDetail.effect.starfield.enabled')
  const spectrumEnabled = useSettingValue('playDetail.effect.spectrum.enabled')
  const liquidChromeEnabled = useSettingValue('playDetail.effect.liquidChrome.enabled')
  const echoNearEnabled = useSettingValue('playDetail.effect.echoNear.enabled')
  const denseWaveEnabled = useSettingValue('playDetail.effect.denseWave.enabled')
  const denseWaveMetal = useSettingValue('playDetail.effect.denseWave.metalness')
  const denseWaveNeon = useSettingValue('playDetail.effect.denseWave.neon')
  const denseWaveParamsJson = useSettingValue('playDetail.effect.denseWave.params')
  const denseWaveRef = useRef<DenseWaveHandle>(null)

  // 解析参数面板配置(JSON)
  const denseWaveParams = useMemo(() => {
    if (!denseWaveParamsJson) return undefined
    try {
      return JSON.parse(denseWaveParamsJson)
    } catch {
      return undefined
    }
  }, [denseWaveParamsJson])
  const liquidChromeRef = useRef<LiquidChromeHandle>(null)

  // 液态铬触摸: 只捕获滑动手势, 点击(短按)透传给下层按钮
  // 屏幕尺寸(用于归一化触摸坐标)
  const screenW = Dimensions.get('window').width
  const screenH = Dimensions.get('window').height
  const liquidChromePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,       // 点击不拦截(透传)
      onMoveShouldSetPanResponder: () => true,         // 滑动时接管
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        liquidChromeRef.current?.setMouse(locationX / screenW, locationY / screenH)
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent
        liquidChromeRef.current?.setMouse(locationX / screenW, locationY / screenH)
        // 音域地形涟漪(滑动触发)
        denseWaveRef.current?.addRipple(locationX / screenW, locationY / screenH)
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const slideshowEnabled = useSettingValue('playDetail.effect.slideshow.enabled')

  // MF 布局订阅(必须放在 Hook 区: 切换布局时强制重渲染, 且 Hook 数量稳定)
  const [layoutVer, setLayoutVer] = useState(0)
  useEffect(() => {
    try {
      const lm = require('@/plugins/layoutManager')
      return lm.onLayoutChange(() => setLayoutVer(v => v + 1))
    } catch {}
  }, [])

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    setPageIndex(nativeEvent.position)
    showLyricRef.current = nativeEvent.position == 1
    if (showLyricRef.current) {
      screenkeepAwake()
    } else {
      screenUnkeepAwake()
    }
  }

  const handleSwitchToLyricPage = useCallback(() => {
    pagerViewRef.current?.setPage(1);
  }, []);

  useEffect(() => {
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (showLyricRef.current && !commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  }, [])

  return (
    <View style={{ flex: 1 }} {...liquidChromePan.panHandlers}>
      {/* 背景模式(最外层, 覆盖 Header) */}
      <PlayDetailBackground />
      {/* 音域回响近景(echo 音频城市, 覆盖 Header) */}
      {echoNearEnabled && <AudioCity style={StyleSheet.absoluteFill} />}
      {/* 可调音域回响(echoplus 密集频谱柱, 覆盖 Header) */}
      {denseWaveEnabled && !echoNearEnabled && (
        <DenseWave
          ref={denseWaveRef}
          metalness={denseWaveMetal}
          neon={denseWaveNeon}
          params={denseWaveParams}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Header />
      <View style={styles.container}>
        {/* 特效层(绝对定位背景) */}
        {starfieldEnabled && <StarfieldBackground />}
        {/* 液态铬触摸背景(下层特效, 不拦截控件) */}
        {liquidChromeEnabled && (
          <LiquidChrome
            ref={liquidChromeRef}
            baseColor={theme.isDark ? [0.25, 0.4, 0.8] : [0.3, 0.5, 0.9]}
            amplitude={0.06}
            frequencyX={2.2}
            frequencyY={1.6}
            style={StyleSheet.absoluteFill}
          />
        )}
        {spectrumEnabled && <SpectrumBars primaryColor={theme['c-primary']} />}
        {wallpaperEnabled && <WallpaperView />}
        {slideshowEnabled && <SlideshowBg />}
        <PagerView
          onPageSelected={onPageSelected}
          // onPageScrollStateChanged={onPageScrollStateChanged}
          style={styles.pagerView}
          ref={pagerViewRef}
        >
          <View collapsable={false}>
            {/* 左右并列: 封面(左) + 迷你歌词(右, 点击展开歌词页) */}
            <View collapsable={false} style={styles.sideBySideContainer}>
              <View style={styles.sideLeft}>
                <Pic componentId={componentId} />
              </View>
              <View style={styles.sideRight}>
                <MiniLyricPreview
                  onPress={handleSwitchToLyricPage}
                  lineCount={5}
                />
              </View>
            </View>
          </View>
          <View collapsable={false}>
            <LyricPage activeIndex={pageIndex} />
          </View>
        </PagerView>
        {/* <View style={styles.pageIndicator} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pageIndicator}>
          <View style={{ ...styles.pageIndicatorItem, backgroundColor: pageIndex == 0 ? theme['c-primary-light-100-alpha-700'] : theme['c-primary-alpha-900'] }}></View>
          <View style={{ ...styles.pageIndicatorItem, backgroundColor: pageIndex == 1 ? theme['c-primary-light-100-alpha-700'] : theme['c-primary-alpha-900'] }}></View>
        </View> */}
        <Player componentId={componentId} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  pagerView: {
    flex: 1,
  },
  picPageContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  // 左右并列: 封面(左) + 歌词(右), 上下留安全空间
  sideBySideContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  sideLeft: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // 封面缩小: 容器约束宽度, Pic 内部按窗口尺寸自适应
  },
  sideRight: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4,
    // 允许与封面轻微堆叠
    marginLeft: -8,
  },
  // 右侧迷你歌词: 与封面顶部齐平
  sideMiniLyric: {
    flex: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  miniLyricContainer: {
    // 封面下方居中显示, 与封面形成紧凑整体
    width: '80%',
    alignSelf: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  // pageIndicator: {
  //   flex: 0,
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   paddingTop: 10,
  //   // backgroundColor: 'rgba(0,0,0,0.1)',
  // },
  // pageIndicatorItem: {
  //   height: 3,
  //   width: '5%',
  //   marginLeft: 2,
  //   marginRight: 2,
  //   borderRadius: 2,
  // },
})
