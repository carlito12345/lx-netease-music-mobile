import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native'

let hasRecordAudio = false

export async function ensureRecordAudioPermission(): Promise<boolean> {
  if (hasRecordAudio) return true
  if (Platform.OS !== 'android') return true

  // 先检查当前权限
  try {
    const already = await PermissionsAndroid.check('android.permission.RECORD_AUDIO')
    if (already) { hasRecordAudio = true; return true }
  } catch (_) {}

  // 先弹自己的对话框, 确保用户看到
  return new Promise(resolve => {
    Alert.alert(
      '需要麦克风权限',
      '语音识别需要访问麦克风, 请授权',
      [
        { text: '暂不', style: 'cancel', onPress: () => resolve(false) },
        {
          text: '去授权',
          onPress: async () => {
            try {
              const result = await PermissionsAndroid.request(
                'android.permission.RECORD_AUDIO',
                {
                  title: '需要麦克风权限',
                  message: '语音识别需要使用麦克风录制您的声音',
                  buttonPositive: '允许',
                  buttonNegative: '拒绝',
                }
              )
              if (result === 'granted') { hasRecordAudio = true; resolve(true); return }

              // 系统弹窗被拒绝, 检查是否永久拒绝
              const rationale = await PermissionsAndroid.shouldShowRequestPermissionRationale('android.permission.RECORD_AUDIO')
              if (!rationale) {
                Alert.alert(
                  '权限被永久拒绝',
                  '请前往系统设置, 在"应用管理 → LX Music → 权限"中开启麦克风权限',
                  [
                    { text: '取消', onPress: () => resolve(false) },
                    { text: '打开设置', onPress: () => { Linking.openSettings(); resolve(false) } },
                  ]
                )
              } else {
                resolve(false)
              }
            } catch (_) {
              // 静默失败 — 直接引导到设置页
              Alert.alert(
                '无法弹出权限请求',
                '请手动前往系统设置开启麦克风权限',
                [
                  { text: '取消', onPress: () => resolve(false) },
                  { text: '打开设置', onPress: () => { Linking.openSettings(); resolve(false) } },
                ]
              )
            }
          },
        },
      ]
    )
  })
}
