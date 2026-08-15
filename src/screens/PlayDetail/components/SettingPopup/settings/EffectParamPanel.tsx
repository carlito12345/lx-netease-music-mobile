/**
 * EffectParamPanel - 音域地形参数面板(实时调整 + 导入导出)
 * 滑块调参 → 实时预览; 导出/导入 JSON 配置
 */
import { memo, useState, useCallback } from 'react'
import { View, Pressable } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Slider from '@/components/common/Slider'
import type { DenseParams } from '@/components/common/GLShader/GLShaderView'
import { DESIGN } from '@/theme/design'
import { updateSetting } from '@/core/common'
import { exportFxConfig, listFxConfigs, readFxConfigFile } from './echoFxConfig'
import ColorPicker from '@/components/common/ColorPicker'

export interface ParamState extends DenseParams {
  camHeight: number
  camDist: number
  camSpeed: number
  fov: number
  pillarCell: number
  pillarWidth: number
  pillarHeight: number
  metalness: number
  neon: number
  /** 主色(低频玫红, hex) */
  warmColorHex: string
  /** 中频绿(hex) */
  greenColorHex: string
  /** 高频紫蓝(hex) */
  coolColorHex: string
  /** 背景色(hex) */
  bgColorHex: string
}

// hex → [r,g,b] 0-1 (shader uniform)
const hexToRgb01 = (hex: string): [number, number, number] => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return [0.5, 0.3, 1.2]
  const v = parseInt(m[1], 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

const DEFAULTS: ParamState = {
  camHeight: 6.5, camDist: 12.5, camSpeed: 0.06, fov: 1.7,
  pillarCell: 0.5, pillarWidth: 0.15, pillarHeight: 1.0,
  metalness: 0.8, neon: 0.5,
  warmColorHex: '#FF4D8C',   // 玫红(原 1.0, 0.3, 0.55)
  greenColorHex: '#33FF80',  // 荧光绿(原 0.2, 1.0, 0.5)
  coolColorHex: '#8073FF',   // 紫蓝(原 0.5, 0.45, 1.5)
  bgColorHex: '#05070C',     // 深色基底
}

interface RowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

const Row = memo(({ label, value, min, max, step, onChange }: RowProps) => {
  const theme = useTheme()
  return (
    <View style={styles.row}>
      <Text size={11} color={theme['c-font-label']} style={styles.label}>{label}</Text>
      <View style={styles.sliderBox}>
        <Slider value={value} minimumValue={min} maximumValue={max} step={step} onValueChange={onChange} />
      </View>
      <Text size={10} color={theme['c-font-label']} style={styles.val}>{value.toFixed(2)}</Text>
    </View>
  )
})

interface Props {
  params: ParamState
  onChange: (p: ParamState) => void
}

const EffectParamPanel = memo(({ params, onChange }: Props) => {
  const theme = useTheme()
  const [msg, setMsg] = useState('')

  const set = useCallback((patch: Partial<ParamState>) => {
    onChange({ ...params, ...patch })
  }, [params, onChange])

  // 导出 → 生成配置文件
  const handleExport = useCallback(async () => {
    try {
      const name = await exportFxConfig(params)
      setMsg('已生成: ' + name)
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('导出失败: ' + String(e))
    }
  }, [params])

  // 导入 → 最新配置文件
  const handleImport = useCallback(async () => {
    try {
      const files = await listFxConfigs()
      if (files.length === 0) { setMsg('无配置文件, 请先导出'); return }
      const parsed = await readFxConfigFile(files[0].path)
      const merged: ParamState = { ...DEFAULTS, ...parsed }
      onChange(merged)
      setMsg('已导入: ' + files[0].name)
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg('导入失败: ' + String(e))
    }
  }, [onChange])

  // 恢复默认
  const handleReset = useCallback(() => {
    onChange({ ...DEFAULTS })
    setMsg('已恢复默认')
    setTimeout(() => setMsg(''), 1500)
  }, [onChange])

  return (
    <View style={styles.container}>
      <Text size={12} color={theme['c-primary']} style={styles.section}>颜色</Text>
      <Text size={11} color={theme['c-font-label']} style={styles.colorLabel}>低频主色</Text>
      <ColorPicker value={params.warmColorHex} onChange={(c) => set({ warmColorHex: c })} />
      <Text size={11} color={theme['c-font-label']} style={styles.colorLabel}>中频色</Text>
      <ColorPicker value={params.greenColorHex} onChange={(c) => set({ greenColorHex: c })} />
      <Text size={11} color={theme['c-font-label']} style={styles.colorLabel}>高频色</Text>
      <ColorPicker value={params.coolColorHex} onChange={(c) => set({ coolColorHex: c })} />
      <Text size={11} color={theme['c-font-label']} style={styles.colorLabel}>背景色</Text>
      <ColorPicker value={params.bgColorHex} onChange={(c) => set({ bgColorHex: c })} />

      <Text size={12} color={theme['c-primary']} style={styles.section}>相机</Text>
      <Row label="高度" value={params.camHeight} min={2} max={12} step={0.1} onChange={(v) => set({ camHeight: v })} />
      <Row label="距离" value={params.camDist} min={4} max={22} step={0.1} onChange={(v) => set({ camDist: v })} />
      <Row label="旋转速度" value={params.camSpeed} min={0} max={0.3} step={0.005} onChange={(v) => set({ camSpeed: v })} />
      <Row label="视场宽度" value={params.fov} min={0.6} max={2.5} step={0.05} onChange={(v) => set({ fov: v })} />

      <Text size={12} color={theme['c-primary']} style={styles.section}>柱体</Text>
      <Row label="间距" value={params.pillarCell} min={0.2} max={1.2} step={0.05} onChange={(v) => set({ pillarCell: v })} />
      <Row label="宽度" value={params.pillarWidth} min={0.05} max={0.4} step={0.01} onChange={(v) => set({ pillarWidth: v })} />
      <Row label="高度倍率" value={params.pillarHeight} min={0.3} max={2.5} step={0.05} onChange={(v) => set({ pillarHeight: v })} />

      <Text size={12} color={theme['c-primary']} style={styles.section}>光效</Text>
      <Row label="金属感" value={params.metalness} min={0} max={1} step={0.05} onChange={(v) => set({ metalness: v })} />
      <Row label="荧光" value={params.neon} min={0} max={1} step={0.05} onChange={(v) => set({ neon: v })} />

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={handleExport}>
          <Text size={12} color={theme['c-primary']}>生成配置</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={handleImport}>
          <Text size={12} color={theme['c-primary']}>导入配置</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={handleReset}>
          <Text size={12} color={theme['c-primary']}>默认</Text>
        </Pressable>
      </View>
      {msg ? <Text size={11} color={theme['c-primary']} style={styles.msg}>{msg}</Text> : null}
    </View>
  )
})

const styles = createStyle({
  container: { marginTop: DESIGN.spacing.xs },
  section: { marginTop: DESIGN.spacing.sm, marginBottom: DESIGN.spacing.xs, paddingHorizontal: DESIGN.spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: DESIGN.spacing.xs, paddingHorizontal: DESIGN.spacing.xl },
  label: { width: 62 },
  sliderBox: { flex: 1, marginHorizontal: 6 },
  val: { width: 40, textAlign: 'right' },
  btnRow: { flexDirection: 'row', marginTop: DESIGN.spacing.md, justifyContent: 'space-around', paddingHorizontal: DESIGN.spacing.xl },
  colorLabel: { marginTop: DESIGN.spacing.sm, marginBottom: DESIGN.spacing.xs, paddingHorizontal: DESIGN.spacing.xl },
  btn: { paddingHorizontal: DESIGN.spacing.lg + 2, paddingVertical: 6, borderRadius: DESIGN.radius.md, backgroundColor: DESIGN.chipBg },
  msg: { marginTop: DESIGN.spacing.sm, textAlign: 'center' },
})

export default EffectParamPanel
