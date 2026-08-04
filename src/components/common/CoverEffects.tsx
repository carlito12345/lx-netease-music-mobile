/**
 * CoverEffects - 封面特效完整组件
 * 发光(外圈光环呼吸) / 粒子(星河粒子) / 旋转 / 滑动切歌
 * 自包含: 内部读取设置, 不干扰宿主
 */
import { memo, useEffect, useMemo, useRef } from 'react'
import { View, Animated, PanResponder } from 'react-native'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev } from '@/core/player/player'

const PARTICLE_COUNT = 30
const SWIPE_THRESHOLD = 60

const rand = (min: number, max: number) => Math.random() * (max - min) + min

interface ParticleConfig {
  x: number
  y: number
  core: number
  halo: number
  duration: number
  delay: number
  twinkle: number
}

const createParticle = (radius: number): ParticleConfig => {
  const angle = rand(0, 360) * (Math.PI / 180)
  const dist = rand(radius * 0.6, radius * 1.6)
  const core = rand(2, 3.5)
  const halo = rand(6, 12)
  const duration = rand(4000, 7000)
  const delay = rand(0, 3000)
  const twinkle = rand(1200, 2500)
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, core, halo, duration, delay, twinkle }
}

interface Props {
  /** 封面尺寸 */
  imgWidth: number
  /** 子元素(封面) */
  children: React.ReactNode
}

export const CoverEffects = memo(({ imgWidth, children }: Props) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const effectGlow = useSettingValue('playDetail.cover.effect.glow')
  const effectParticles = useSettingValue('playDetail.cover.effect.particles')
  const effectSwipe = useSettingValue('playDetail.cover.effect.swipe')

  const particleRadius = imgWidth / 2

  // 粒子配置
  const particles = useMemo<ParticleConfig[]>(() => {
    const arr: ParticleConfig[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) arr.push(createParticle(particleRadius))
    return arr
  }, [particleRadius])

  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(0), y: new Animated.Value(0), opacity: new Animated.Value(0),
    }))
  ).current

  const isActive = useRef(true)
  useEffect(() => {
    if (!isPlay || !effectParticles) return
    isActive.current = true
    const startParticle = (i: number) => {
      const p = particles[i]
      const a = particleAnims[i]
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(a.x, { toValue: p.x, duration: p.duration, useNativeDriver: false }),
          Animated.timing(a.y, { toValue: p.y, duration: p.duration, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(a.opacity, { toValue: rand(0.5, 0.9), duration: 400, useNativeDriver: false }),
            Animated.loop(Animated.sequence([
              Animated.timing(a.opacity, { toValue: rand(0.2, 0.5), duration: p.twinkle / 2, useNativeDriver: false }),
              Animated.timing(a.opacity, { toValue: rand(0.5, 0.9), duration: p.twinkle / 2, useNativeDriver: false }),
            ]), { iterations: Math.floor(p.duration / p.twinkle) }),
            Animated.timing(a.opacity, { toValue: 0, duration: 600, useNativeDriver: false }),
          ]),
        ]),
      ])
    }
    const loopAll = () => {
      if (!isActive.current) return
      const anims = particleAnims.map((_, i) => startParticle(i))
      Animated.parallel(anims).start(() => { if (isActive.current) loopAll() })
    }
    loopAll()
    return () => { isActive.current = false }
  }, [isPlay, effectParticles, particles, particleAnims])

  // 外圈光环呼吸
  const gl = useRef(new Animated.Value(0.25)).current
  useEffect(() => {
    if (!isPlay || !effectGlow) return
    const a = Animated.loop(Animated.sequence([
      Animated.timing(gl, { toValue: 0.65, duration: 2000, useNativeDriver: false }),
      Animated.timing(gl, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
    ]))
    a.start()
    return () => a.stop()
  }, [isPlay, effectGlow, gl])

  // 上下滑动切歌
  const touchStart = useRef({ y: 0 })
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => effectSwipe,
    onMoveShouldSetPanResponder: (_, g) => effectSwipe && Math.abs(g.dy) > 10,
    onPanResponderGrant: (_, g) => { touchStart.current.y = g.moveY },
    onPanResponderRelease: (_, g) => {
      if (!effectSwipe) return
      const dy = g.moveY - touchStart.current.y
      if (dy < -SWIPE_THRESHOLD) playNext()
      else if (dy > SWIPE_THRESHOLD) playPrev()
    },
  }), [effectSwipe])

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }} {...panResponder.panHandlers}>
      {/* 外圈光环 */}
      {effectGlow && (
        <Animated.View style={{
          position: 'absolute',
          width: imgWidth + 36, height: imgWidth + 36,
          borderRadius: (imgWidth + 36) / 2,
          borderWidth: 10, borderColor: theme['c-primary'],
          backgroundColor: 'transparent', opacity: gl,
        }} />
      )}
      {/* 星河粒子层 */}
      {effectParticles && particleAnims.map((a, i) => (
        <View key={i} style={{ position: 'absolute' }} pointerEvents="none">
          <Animated.View style={{
            position: 'absolute', width: particles[i].halo, height: particles[i].halo,
            borderRadius: particles[i].halo / 2, backgroundColor: theme['c-primary-alpha-200'],
            opacity: Animated.multiply(a.opacity, 0.25),
            transform: [
              { translateX: Animated.add(a.x, new Animated.Value(-particles[i].halo / 2)) },
              { translateY: Animated.add(a.y, new Animated.Value(-particles[i].halo / 2)) },
            ],
          }} />
          <Animated.View style={{
            position: 'absolute', width: particles[i].core, height: particles[i].core,
            borderRadius: particles[i].core / 2, backgroundColor: theme['c-primary-light-100'],
            opacity: a.opacity,
            transform: [
              { translateX: Animated.add(a.x, new Animated.Value(-particles[i].core / 2)) },
              { translateY: Animated.add(a.y, new Animated.Value(-particles[i].core / 2)) },
            ],
          }} />
        </View>
      ))}
      {/* 封面 */}
      {children}
    </View>
  )
})
