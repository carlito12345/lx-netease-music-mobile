/**
 * PageBackground - 全局背景完整组件
 * 自包含: 内部读取极光设置 + 图片背景决策, 不干扰宿主组件
 * 优先级: 启用极光且无背景图 → 极光背景; 否则 → 图片/主题背景
 */
import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useWindowSize } from '@/utils/hooks'
import ImageBackground from '@/components/common/ImageBackground'
import { defaultHeaders } from './Image'
import { useSettingValue } from '@/store/setting/hook'
import AuroraBackground, { AURORA_PRESETS } from '@/components/common/AuroraBackground'

interface Props {
  /** 背景图片(无则用主题背景) */
  pic: string | null
}

export default ({ pic }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const picOpacity = useSettingValue('theme.picOpacity')
  const blur = useSettingValue('theme.blur')
  const auroraEnabled = useSettingValue('app.background.aurora.enabled')
  const auroraPreset = useSettingValue('app.background.aurora.preset')
  const auroraIntensity = useSettingValue('app.background.aurora.intensity')
  const showAurora = auroraEnabled && !pic
  // 调试日志: 写入 Download/LXMusic_Logs/log_日期.log (小米/车机 logcat 受限也能抓)
  try {
    const { debugLog } = require('@/utils/log')
    debugLog('AuroraDebug', 'enabled=' + auroraEnabled + ' preset=' + auroraPreset + ' intensity=' + auroraIntensity + ' pic=' + pic + ' show=' + showAurora)
  } catch {}

  if (showAurora) {
    return (
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: windowSize.height,
          width: windowSize.width,
          backgroundColor: theme['c-main-background'],
        }}
      >
        <AuroraBackground
          colors={AURORA_PRESETS[auroraPreset] || AURORA_PRESETS.aurora}
          intensity={auroraIntensity || 1}
        />
      </View>
    )
  }
  return (
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
        blurRadius={pic ? blur : undefined}
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
    )
}
