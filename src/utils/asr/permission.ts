import { Platform, Alert, Linking } from 'react-native'
import { hasRecordAudioPermission } from './manager'

export async function ensureRecordAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true

  // 用原生 Java 检查 (跨双开/虚拟机环境可靠)
  try {
    const granted = await hasRecordAudioPermission()
    if (granted) return true
  } catch (_) {}

  // 未授权 → 弹 Alert 引导到系统设置
  return new Promise(resolve => {
    Alert.alert(
      '需要麦克风权限',
      '语音识别需要访问麦克风。\n请前往系统设置授予权限。',
      [
        { text: '暂不', style: 'cancel', onPress: () => resolve(false) },
        {
          text: '打开设置',
          onPress: () => {
            Linking.openSettings()
            resolve(false)
          },
        },
      ]
    )
  })
}
