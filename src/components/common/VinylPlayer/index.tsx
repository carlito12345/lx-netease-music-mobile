/**
 * VinylPlayer - 黑胶唱片机装饰组件(精致版)
 * 真实唱片机几何: 轴心在唱盘右上外侧, 两段式唱臂(臂管+唱头壳),
 * 播放时唱臂下摆(唱针落在纹路区), 暂停时抬起离盘。
 * 金属质感: 分层高光/配重锤/双色底座, 纯 View 绘制零依赖。
 */
import { memo, useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import { useIsPlay } from '@/store/player/hook'

interface Props {
  /** 唱盘直径(与封面图一致) */
  discSize: number
  /** 唱臂是否可见(黑胶样式时) */
  visible?: boolean
}

export const VinylPlayer = memo(({ discSize, visible = true }: Props) => {
  const isPlay = useIsPlay()
  // 唱针落位动画: 1=落下(播放时唱针压盘转动), 0=抬起(暂停/停止时唱臂离开盘面)
  const armAnim = useRef(new Animated.Value(isPlay ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(armAnim, {
      toValue: isPlay ? 1 : 0,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [isPlay, armAnim])

  if (!visible) return null

  const D = discSize
  // 轴心: 唱盘右上外侧(真实唱片机位置)
  const pivotX = D * 1.06
  const pivotY = D * 0.06
  // 臂管: 轴→唱头壳
  const armLen = D * 0.55
  const armThick = D * 0.012
  // 唱头壳: 稍粗, 挂臂管左端
  const shellW = D * 0.055
  const shellH = D * 0.028
  // 底座
  const baseR = D * 0.075

  // 唱臂旋转(轴在右端, 臂初始指向左):
  //  正角度=顺时针=唱针向外上摆(抬起), 负角度=逆时针=唱针向内下摆(落下)
  // 暂停(0)=抬起 45°(唱针离盘外上方), 播放(1)=落下 -35°(唱针落纹路区)
  const armRotate = armAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '-35deg'],
  })

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: D + 120,
        height: D + 80,
        zIndex: 10,
      }}
    >
      {/* ===== 唱臂(整体绕轴心旋转: translateX 偏移旋转中心到右端) ===== */}
      <Animated.View
        style={{
          position: 'absolute',
          left: pivotX - armLen,
          top: pivotY - armThick / 2,
          width: armLen,
          height: armThick,
          transform: [
            { translateX: armLen / 2 },
            { rotate: armRotate },
            { translateX: -armLen / 2 },
          ],
        }}
      >
        {/* 臂管: 深灰金属 + 顶部高光 */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: armLen,
            height: armThick,
            borderRadius: armThick / 2,
            backgroundColor: '#4a4a52',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: '18%',
              top: 1,
              width: '55%',
              height: Math.max(1.5, armThick * 0.22),
              borderRadius: 1,
              backgroundColor: 'rgba(255,255,255,0.28)',
            }}
          />
        </View>

        {/* 配重锤(轴端): 圆柱形 */}
        <View
          style={{
            position: 'absolute',
            right: -3,
            top: armThick / 2 - 4,
            width: 9,
            height: 8,
            borderRadius: 3,
            backgroundColor: '#5a5a62',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        />

        {/* 唱头壳(臂管左端, 扁梯形) */}
        <View
          style={{
            position: 'absolute',
            left: -shellW * 0.7,
            top: -shellH / 2 + armThick / 2,
            width: shellW,
            height: shellH,
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            backgroundColor: '#3a3a42',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {/* 唱针: 壳底部小圆点 */}
          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: '#e8e8ea',
              marginBottom: -2,
            }}
          />
        </View>
      </Animated.View>

      {/* ===== 底座(固定, 不随唱臂旋转) ===== */}
      <View
        style={{
          position: 'absolute',
          left: pivotX - baseR,
          top: pivotY - baseR,
          width: baseR * 2,
          height: baseR * 2,
          borderRadius: baseR,
          backgroundColor: '#2a2a30',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {/* 底座高光环 */}
        <View
          style={{
            position: 'absolute',
            left: baseR * 0.18,
            top: baseR * 0.12,
            right: baseR * 0.18,
            height: baseR * 0.22,
            borderRadius: baseR,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />
        {/* 主轴 */}
        <View
          style={{
            width: baseR * 0.42,
            height: baseR * 0.42,
            borderRadius: baseR * 0.21,
            backgroundColor: '#8a8a92',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.25)',
          }}
        />
      </View>
    </View>
  )
})
