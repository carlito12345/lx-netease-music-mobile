import { View, Animated, Easing } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
// import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { useMemo, useRef, useEffect } from 'react'
import EffectControlButton from '@/components/common/EffectControlButton'
import MagicRings from '@/components/common/MagicRings'
import { useSettingValue } from '@/store/setting/hook'
import { useBackgroundColor } from '@/store/backgroundColor'
import { getTextColorByMode } from '@/utils/adaptiveTextColor'

const PrevBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const { textColorMode } = useBackgroundColor()
  const activeColor = getTextColorByMode(textColorMode, theme.isDark)
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <EffectControlButton
      icon="prevMusic"
      size={size}
      color={activeColor}
      onPress={handlePlayPrev}
      style={styles.cotrolBtn}
    />
  )
}
const NextBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const { textColorMode } = useBackgroundColor()
  const activeColor = getTextColorByMode(textColorMode, theme.isDark)
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <EffectControlButton
      icon="nextMusic"
      size={size}
      color={activeColor}
      onPress={handlePlayNext}
      style={styles.cotrolBtn}
    />
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const { textColorMode } = useBackgroundColor()
  const activeColor = getTextColorByMode(textColorMode, theme.isDark)
  const isPlay = useIsPlay()
  const magicRingsEnabled = useSettingValue('playDetail.effect.magicRings.enabled')
  // 播放/暂停切换动画: 缩放回弹 + 切换瞬间旋转90度再回位(静止时图标方向始终正确)
  const anim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    anim.setValue(0)
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start()
  }, [isPlay, anim])

  const scale = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 1.15, 1] })
  const rotate = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ['0deg', '90deg', '0deg'] })

  return (
    <MagicRings
      enabled={magicRingsEnabled}
      color={activeColor}
      radius={size * 0.55}
      onPress={togglePlay}
      style={{ ...styles.cotrolBtn, width: size, height: size }}
      activeOpacity={0.5}
    >
      <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
        <Icon name={isPlay ? 'pause' : 'play'} color={activeColor} rawSize={size * 0.7} />
      </Animated.View>
    </MagicRings>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  const containerStyle = useMemo(() => {
    return {
      ...styles.conatiner,
      maxHeight,
    }
  }, [maxHeight])
  const size = Math.min(
    Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE),
    MAX_SIZE,
    maxHeight
  )

  return (
    <View style={containerStyle}>
      <PrevBtn size={size} />
      <TogglePlayBtn size={size} />
      <NextBtn size={size} />
    </View>
  )
}

const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 22,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
