/**
 * SettingEffects - 播放页特效设置(完整组件)
 * 自包含: ShinyText歌名闪光 + MagicRings点击涟漪 开关及参数
 */
import { memo, useState, useMemo, useCallback, useRef } from 'react'
import { View, Pressable } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import CheckBoxItem from '@/screens/Home/Views/Setting/components/CheckBoxItem'
import Slider from '@/components/common/Slider'
import { DESIGN } from '@/theme/design'
import EffectParamPanel, { type ParamState } from './EffectParamPanel'
import { exportFxConfig, readFxConfigFile } from './echoFxConfig'
import FxConfigPicker, { type FxConfigPickerType } from './FxConfigPicker'

// 默认参数(与面板一致)
const DEFAULT_PARAMS: ParamState = {
  camHeight: 6.5, camDist: 12.5, camSpeed: 0.06, fov: 1.7,
  pillarCell: 0.5, pillarWidth: 0.15, pillarHeight: 1.0,
  metalness: 0.8, neon: 0.5,
  warmColorHex: '#FF4D8C', greenColorHex: '#33FF80',
  coolColorHex: '#8073FF', bgColorHex: '#05070C',
}

export default memo(() => {
  const theme = useTheme()
  const shinyText = useSettingValue('playDetail.effect.shinyText.enabled')
  const magicRings = useSettingValue('playDetail.effect.magicRings.enabled')
  const magicRingsRadius = useSettingValue('playDetail.effect.magicRings.radius')
  const lyricWheel = useSettingValue('playDetail.effect.lyricWheel.enabled')
  const liquidChrome = useSettingValue('playDetail.effect.liquidChrome.enabled')
  const kaleido = useSettingValue('playDetail.effect.kaleido.enabled')
  const galaxy = useSettingValue('playDetail.effect.galaxy.enabled')
  const echoNear = useSettingValue('playDetail.effect.echoNear.enabled')
  const denseWave = useSettingValue('playDetail.effect.denseWave.enabled')
  const denseWaveMetal = useSettingValue('playDetail.effect.denseWave.metalness')
  const denseWaveNeon = useSettingValue('playDetail.effect.denseWave.neon')
  const denseWaveParamsJson = useSettingValue('playDetail.effect.denseWave.params')
  // 解析面板参数
  const paramState: ParamState = useMemo(() => {
    const base: ParamState = {
      camHeight: 6.5, camDist: 12.5, camSpeed: 0.06, fov: 1.7,
      pillarCell: 0.5, pillarWidth: 0.15, pillarHeight: 1.0,
      metalness: denseWaveMetal, neon: denseWaveNeon,
      warmColorHex: '#FF4D8C', greenColorHex: '#33FF80',
      coolColorHex: '#8073FF', bgColorHex: '#05070C',
    }
    if (!denseWaveParamsJson) return base
    try { return { ...base, ...JSON.parse(denseWaveParamsJson) } } catch { return base }
  }, [denseWaveParamsJson, denseWaveMetal, denseWaveNeon])

  const [showPanel, setShowPanel] = useState(false)
  const [fxMsg, setFxMsg] = useState('')
  const fxPickerRef = useRef<FxConfigPickerType>(null)

  // hex → [r,g,b] 0-1
  const hexToRgb01 = useCallback((hex: string): [number, number, number] => {
    const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
    if (!m) return [1, 0.3, 0.55]
    const v = parseInt(m[1], 16)
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
  }, [])

  const handleParamChange = useCallback((p: ParamState) => {
    // hex 颜色 → palette(9 元素) + bgColor 数组
    const warm = hexToRgb01(p.warmColorHex)
    const green = hexToRgb01(p.greenColorHex)
    const cool = hexToRgb01(p.coolColorHex)
    const bg = hexToRgb01(p.bgColorHex)
    const withColors: ParamState = {
      ...p,
      palette: [...warm, ...green, ...cool],
      bgColor: bg,
    }
    updateSetting({
      'playDetail.effect.denseWave.metalness': p.metalness,
      'playDetail.effect.denseWave.neon': p.neon,
      'playDetail.effect.denseWave.params': JSON.stringify(withColors),
    })
  }, [hexToRgb01])

  return (
    <View style={styles.content}>
      <Text size={13} color={theme['c-primary']} style={styles.sectionTitle}>特效</Text>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={shinyText}
          label="歌名闪光"
          onChange={(v) => updateSetting({ 'playDetail.effect.shinyText.enabled': v })}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={lyricWheel}
          label="歌词滚轮特效(3D弧面)"
          onChange={(v) => updateSetting({ 'playDetail.effect.lyricWheel.enabled': v })}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={kaleido}
          label="万花筒"
          onChange={(v) => {
            updateSetting({
              'playDetail.effect.kaleido.enabled': v,
              'playDetail.effect.echoNear.enabled': v ? false : echoNear,
              'playDetail.effect.denseWave.enabled': v ? false : denseWave,
              'playDetail.effect.galaxy.enabled': v ? false : galaxy,
            })
          }}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={galaxy}
          label="星河星云"
          onChange={(v) => {
            updateSetting({
              'playDetail.effect.galaxy.enabled': v,
              'playDetail.effect.echoNear.enabled': v ? false : echoNear,
              'playDetail.effect.denseWave.enabled': v ? false : denseWave,
              'playDetail.effect.kaleido.enabled': v ? false : kaleido,
            })
          }}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={echoNear}
          label="音域回响近景"
          onChange={(v) => {
            updateSetting({
              'playDetail.effect.echoNear.enabled': v,
              // 互斥: 开 echo 时关 echoplus 和星河
              'playDetail.effect.denseWave.enabled': v ? false : denseWave,
              'playDetail.effect.kaleido.enabled': v ? false : kaleido,
              'playDetail.effect.galaxy.enabled': v ? false : galaxy,
            })
          }}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={denseWave}
          label="可调音域回响"
          onChange={(v) => {
            updateSetting({
              'playDetail.effect.denseWave.enabled': v,
              // 互斥: 开 echoplus 时关 echo 和星河
              'playDetail.effect.echoNear.enabled': v ? false : echoNear,
              'playDetail.effect.kaleido.enabled': v ? false : kaleido,
              'playDetail.effect.galaxy.enabled': v ? false : galaxy,
            })
          }}
        />
      </View>
      {denseWave ? (
        <View style={styles.paramRow}>
          <Text size={12} color={theme['c-font-label']}>金属感</Text>
          <Slider
            value={denseWaveMetal}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            onValueChange={(v) => updateSetting({ 'playDetail.effect.denseWave.metalness': v })}
          />
        </View>
      ) : null}
      {denseWave ? (
        <View style={styles.paramRow}>
          <Text size={12} color={theme['c-font-label']}>荧光</Text>
          <Slider
            value={denseWaveNeon}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            onValueChange={(v) => updateSetting({ 'playDetail.effect.denseWave.neon': v })}
          />
        </View>
      ) : null}
      {denseWave ? (
        <View style={styles.panelEntry}>
          <Text size={12} color={theme['c-primary']} onPress={() => setShowPanel(!showPanel)}>
            {showPanel ? '▼ 收起参数调整' : '▶ 特效参数调整'}
          </Text>
          {!showPanel ? (
            <Text size={11} color={theme['c-font-label']}>可调整相机视角、柱体密度、颜色、金属感与荧光</Text>
          ) : null}
          {/* 常驻按钮: 生成配置/导入配置 不依赖展开 */}
          <View style={styles.fxBtnRow}>
            <Pressable style={styles.fxBtn} onPress={async () => {
              try {
                const name = await exportFxConfig(paramState)
                setFxMsg('已生成: ' + name)
              } catch (e) { setFxMsg('生成失败: ' + String(e)) }
              setTimeout(() => setFxMsg(''), 2500)
            }}>
              <Text size={12} color={theme['c-primary']}>生成配置</Text>
            </Pressable>
            <Pressable style={styles.fxBtn} onPress={() => fxPickerRef.current?.show()}>
              <Text size={12} color={theme['c-primary']}>导入配置</Text>
            </Pressable>
            <Pressable style={styles.fxBtn} onPress={() => {
              handleParamChange({ ...DEFAULT_PARAMS })
              setFxMsg('已恢复默认')
              setTimeout(() => setFxMsg(''), 2500)
            }}>
              <Text size={12} color={theme['c-primary']}>默认</Text>
            </Pressable>
          </View>
          {fxMsg ? <Text size={11} color={theme['c-font-label']} style={styles.fxMsg}>{fxMsg}</Text> : null}
        </View>
      ) : null}
      {denseWave && showPanel ? (
        <EffectParamPanel params={paramState} onChange={handleParamChange} />
      ) : null}

      {/* 配置文件选择器(RNFS 直读, 无 SAF 权限限制) */}
      <FxConfigPicker
        ref={fxPickerRef}
        onPick={async (path, name) => {
          try {
            const parsed = await readFxConfigFile(path)
            handleParamChange({ ...paramState, ...parsed })
            setFxMsg('已导入: ' + name)
          } catch (e) { setFxMsg('导入失败: ' + String(e)) }
          setTimeout(() => setFxMsg(''), 2500)
        }}
      />

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={liquidChrome}
          label="液态铬触摸背景"
          onChange={(v) => updateSetting({ 'playDetail.effect.liquidChrome.enabled': v })}
        />
      </View>

      <View style={styles.listContainer}>
        <CheckBoxItem
          check={magicRings}
          label="点击涟漪"
          onChange={(v) => updateSetting({ 'playDetail.effect.magicRings.enabled': v })}
        />
      </View>
      {magicRings ? (
        <View style={styles.radiusRow}>
          <Text size={12} color={theme['c-font-label']}>涟漪大小</Text>
          <View style={styles.radiusOptions}>
            {[24, 34, 44, 54].map(v => {
              const active = magicRingsRadius === v
              return (
                <View key={v} style={[
                  styles.radiusChip,
                  active ? { backgroundColor: theme['c-primary'] } : { backgroundColor: 'rgba(128,128,128,0.15)' }
                ]}>
                  <Text
                    size={11}
                    color={active ? theme['c-primary-font-on-primary'] : theme['c-font']}
                    onPress={() => updateSetting({ 'playDetail.effect.magicRings.radius': v })}
                  >{v}</Text>
                </View>
              )
            })}
          </View>
        </View>
      ) : null}
    </View>
  )
})

const styles = createStyle({
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    marginTop: 6,
  },
  panelEntry: {
    marginTop: DESIGN.spacing.sm,
    marginLeft: DESIGN.spacing.xl,
    marginRight: DESIGN.spacing.xl,
    paddingVertical: DESIGN.spacing.sm,
    paddingHorizontal: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.chipBg,
  },
  content: {
    marginTop: 8,
    paddingLeft: 0,
    paddingRight: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    paddingLeft: 20,
  },
  listContainer: {
    paddingTop: 5,
    paddingLeft: 0,
    marginBottom: 6,
  },
  radiusRow: {
    marginTop: 8,
    paddingLeft: 20,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  fxBtnRow: {
    flexDirection: 'row',
    gap: DESIGN.spacing.sm,
    marginTop: DESIGN.spacing.sm,
  },
  fxBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: DESIGN.radius.md,
    backgroundColor: DESIGN.chipBg,
  },
  fxMsg: { marginTop: DESIGN.spacing.xs },
})
