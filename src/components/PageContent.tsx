// import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'

import { useSettingValue } from '@/store/setting/hook'
import AuroraBackground, { AURORA_PRESETS } from '@/components/common/AuroraBackground'
interface Props {
  children: React.ReactNode
}

// const BLUR_RADIUS = Math.max(scaleSizeAbsHR(18), 10)

export default ({ children }: Props) => {
  const theme = useTheme();
  const windowSize = useWindowSize();
  const dynamicPic = useBgPic();
  const customBgPicPath = useSettingValue('theme.customBgPicPath');
  const pic = customBgPicPath || dynamicPic;
  const picOpacity = useSettingValue('theme.picOpacity');
  const blur = useSettingValue('theme.blur');
  const auroraEnabled = useSettingValue('app.background.aurora.enabled');
  const auroraPreset = useSettingValue('app.background.aurora.preset');
  const auroraIntensity = useSettingValue('app.background.aurora.intensity');
  // 无动态背景图时,用极光做全局背景
  const showAurora = auroraEnabled && !pic;
  // const BLUR_RADIUS = Math.max(scaleSizeAbsHR(blur), 10)
  const BLUR_RADIUS = blur
  // const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: Dimensions.get('screen').height })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  // useEffect(() => {
  //   const onChange = () => {
  //     setWH({ width: '100%', height: '100%' })
  //   }

  //   const changeEvent = Dimensions.addEventListener('change', onChange)
  //   return () => {
  //     changeEvent.remove()
  //   }
  // }, [])
  // const handleLayout = (e: LayoutChangeEvent) => {
  //   // console.log('handleLayout', e.nativeEvent)
  //   // console.log(Dimensions.get('screen'))
  //   setWH({ width: e.nativeEvent.layout.width, height: Dimensions.get('screen').height })
  // }
  // console.log('render page content')

  const contentComponent = useMemo(() => {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {showAurora ? (
          <AuroraBackground
            colors={AURORA_PRESETS[auroraPreset] || AURORA_PRESETS.aurora}
            intensity={auroraIntensity || 1}
          />
        ) : (
          <ImageBackground
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: windowSize.height,
              width: windowSize.width,
              backgroundColor: theme['c-content-background'],
            }}
            source={pic ? { uri: pic, headers: defaultHeaders } : theme['bg-image']}
            resizeMode="cover"
            blurRadius={pic ? BLUR_RADIUS : undefined}
          >
            {pic ? (
              <View
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  backgroundColor: theme['c-content-background'],
                  opacity: picOpacity / 100,
                }}
              ></View>
            ) : null}
          </ImageBackground>
        )}
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            backgroundColor: pic ? undefined : theme['c-main-background'],
          }}
        >
          {children}
        </View>
      </View>
    );
  }, [children, pic, theme, windowSize.height, windowSize.width, BLUR_RADIUS, picOpacity, showAurora, auroraPreset, auroraIntensity]);

  return (
    <>
      <SizeView />
      {contentComponent}
    </>
  );
}
