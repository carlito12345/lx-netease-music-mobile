import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native'

let hasRecordAudio = false

export async function ensureRecordAudioPermission(): Promise<boolean> {
  if (hasRecordAudio) return true
  if (Platform.OS !== 'android') return true

  const perm = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO

  // First check current status
  try {
    const granted = await PermissionsAndroid.check(perm)
    if (granted) { hasRecordAudio = true; return true }
  } catch (_) {}

  // Request
  try {
    const result = await PermissionsAndroid.request(perm, {
      title: '需要麦克风权限',
      message: '语音识别需要使用麦克风录制您的声音,请授予权限',
      buttonPositive: '允许',
      buttonNegative: '拒绝',
    })
    if (result === 'granted') { hasRecordAudio = true; return true }

    // Check if "never ask again" — if denied without showing rationale, guide to settings
    const shouldShow = await PermissionsAndroid.shouldShowRequestPermissionRationale(perm)
    if (!shouldShow) {
      // User selected "never ask again"
      Alert.alert(
        '需要麦克风权限',
        '语音识别需要麦克风权限,但该权限已被永久拒绝。\n\n请前往"设置 → 应用管理 → LX Music → 权限"中手动开启麦克风权限。',
        [
          { text: '取消', style: 'cancel' },
          { text: '前往设置', onPress: () => Linking.openSettings() },
        ]
      )
    } else {
      Alert.alert('权限被拒绝', '未授予麦克风权限,无法使用语音识别功能')
    }
    return false
  } catch (e) {
    return false
  }
}
