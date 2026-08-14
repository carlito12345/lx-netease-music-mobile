import {memo, useState, useRef, useMemo, useEffect, useCallback} from 'react'
import { View, AppState } from 'react-native'

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
    <View style={{ flex: 1 }}>
      {/* 背景模式(最外层, 覆盖 Header) */}
      <PlayDetailBackground />
      <Header />
      <View style={styles.container}>
        {/* 特效层(绝对定位背景) */}
        {starfieldEnabled && <StarfieldBackground />}
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
