import { useEffect, useRef, useState, useCallback } from 'react'
import { Animated, View, TouchableOpacity, Easing } from 'react-native'
import { createStyle } from '@/utils/tools'
import { SvgIcon } from '@/components/common/SvgIcon'
import { getPartialResult } from '@/utils/asr/manager'
import Text from '@/components/common/Text'
import { toast } from '@/utils/tools'

type VoiceState = 'idle' | 'listening' | 'recognizing' | 'speaking' | 'done' | 'error'

export function FloatingMicButton({ onPress, active }: { onPress: () => void; active: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.92, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulse.setValue(1)
    }
  }, [active])
  return (
    <TouchableOpacity style={ss.floatBtnWrapper} onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[ss.floatBtn, { backgroundColor: active ? '#DC2626' : '#2563EB', transform: [{ scale: pulse }], shadowColor: active ? '#DC2626' : '#2563EB' }]}>
        <SvgIcon name="mic" rawSize={28} color="#FFFFFF" />
      </Animated.View>
      {active && <View style={[ss.floatRing, { borderColor: '#DC2626' }]} />}
    </TouchableOpacity>
  )
}

const WAVE_BARS = [0.2, 0.5, 0.3, 0.7, 0.4, 0.6, 0.25]

export function VoicePanel({ visible, onText }: { visible: boolean; onText: (text: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current
  const [partial, setPartial] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const pollingRef = useRef(false)
  const visibleRef = useRef(false)
  visibleRef.current = visible
  const lastTextRef = useRef('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedRef = useRef(false)
  // waveform anims
  const waveAnims = useRef(WAVE_BARS.map(() => new Animated.Value(0.3))).current

  // waveform loop
  useEffect(() => {
    if (visible) {
      const loops = waveAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: WAVE_BARS[i] + 0.3, duration: 400 + i * 50, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 400 + i * 50, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        )
      )
      loops.forEach(l => l.start())
      return () => loops.forEach(l => l.stop())
    }
  }, [visible, waveAnims])

  useEffect(() => {
    if (visible) {
      closedRef.current = false
      setPartial('')
      setVoiceState('listening')
      lastTextRef.current = ''
      pollingRef.current = true
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
      timeoutRef.current = setTimeout(() => {
        if (visibleRef.current && !closedRef.current) {
          closedRef.current = true
          pollingRef.current = false
          setVoiceState('error')
          toast('识别超时,请重试')
          setTimeout(() => onText(''), 600)
        }
      }, 15000)
      const timer = setTimeout(() => { if (pollingRef.current) void poll() }, 600)
      return () => { pollingRef.current = false; clearTimeout(timer); if (timeoutRef.current) clearTimeout(timeoutRef.current) }
    } else {
      pollingRef.current = false
      closedRef.current = true
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start()
      setPartial('')
      setVoiceState('idle')
    }
  }, [visible])

  const poll = async () => {
    if (!pollingRef.current || !visibleRef.current || closedRef.current) return
    try {
      const r = await getPartialResult()
      if (!pollingRef.current || !visibleRef.current || closedRef.current) return
      if (r.done) {
        if (closedRef.current) return
        closedRef.current = true
        pollingRef.current = false
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
        const final = r.text?.trim() || ''
        if (final) {
          setPartial(final)
          setVoiceState('done')
          setTimeout(() => onText(final), 800)
        } else {
          setVoiceState('error')
          toast('未识别到语音')
          setTimeout(() => onText(''), 600)
        }
        return
      }
      if (r.text) {
        const t = r.text.trim()
        if (t && t !== lastTextRef.current) {
          lastTextRef.current = t
          setPartial(t)
          // 根据有无文字切换状态(说话中 / 识别中)
          setVoiceState(t.length > 1 ? 'speaking' : 'recognizing')
        }
      }
    } catch (_) {}
    if (pollingRef.current && visibleRef.current && !closedRef.current) {
      setTimeout(poll, 400)
    }
  }

  if (!visible) return null

  const hints: Record<VoiceState, string> = {
    idle: '', listening: '正在聆听...', recognizing: '识别中', speaking: '聆听中', done: '✓ 已识别', error: '未识别到语音,请重试'
  }
  const colors: Record<VoiceState, string> = {
    idle: '#999', listening: '#93C5FD', recognizing: '#60A5FA', speaking: '#F472B6', done: '#4ADE80', error: '#F87171'
  }

  return (
    <Animated.View style={[ss.panelOverlay, { opacity }]}>
      <View style={ss.panelContent}>
        {/* 麦克风 + 波形条 */}
        <View style={ss.micRow}>
          {WAVE_BARS.map((_, i) => (
            <Animated.View key={i} style={[ss.waveBar, {
              transform: [{ scaleY: waveAnims[i] }],
              backgroundColor: colors[voiceState],
            }]} />
          ))}
          <View style={[ss.panelMicWrap, { borderColor: colors[voiceState] }]}>
            <SvgIcon name="mic" rawSize={40} color={colors[voiceState]} />
          </View>
          {WAVE_BARS.map((_, i) => (
            <Animated.View key={i + 100} style={[ss.waveBar, {
              transform: [{ scaleY: waveAnims[i] }],
              backgroundColor: colors[voiceState],
            }]} />
          ))}
        </View>

        <Text size={12} color={colors[voiceState]} style={ss.stateHint}>{hints[voiceState]}</Text>

        {partial ? (
          <View style={ss.resultBox}>
            <Text size={20} color="#FFFFFF" style={ss.partialText}>{partial}</Text>
          </View>
        ) : voiceState === 'listening' ? (
          <Text size={15} color="rgba(255,255,255,0.35)" style={ss.hintText}>说出你想搜索的内容或指令</Text>
        ) : null}
      </View>
    </Animated.View>
  )
}

const ss = createStyle({
  floatBtnWrapper: { position: 'absolute', bottom: 100, right: 16, zIndex: 1000 },
  floatBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
  floatRing: { position: 'absolute', top: -6, left: -6, width: 68, height: 68, borderRadius: 34, borderWidth: 2, opacity: 0.5 },
  panelOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  panelContent: { alignItems: 'center', paddingHorizontal: 48 },
  micRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  waveBar: { width: 3, height: 36, borderRadius: 1.5, marginHorizontal: 3, backgroundColor: '#60A5FA' },
  panelMicWrap: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  stateHint: { marginBottom: 18, letterSpacing: 1 },
  resultBox: { minHeight: 24, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, marginTop: 4 },
  partialText: { textAlign: 'center', fontWeight: '600', lineHeight: 28 },
  hintText: { textAlign: 'center', marginTop: 4 },
})
