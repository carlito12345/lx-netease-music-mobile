import { PermissionsAndroid, Platform } from 'react-native'

let hasRecordAudio = false

export async function ensureRecordAudioPermission(): Promise<boolean> {
  if (hasRecordAudio) return true
  if (Platform.OS !== 'android') return true

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
    hasRecordAudio = result === 'granted'
    return hasRecordAudio
  } catch (e) {
    return false
  }
}
