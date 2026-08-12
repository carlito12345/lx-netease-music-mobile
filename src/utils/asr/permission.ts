import { Platform, Linking } from 'react-native'
import { toast } from '@/utils/tools'
import { hasRecordAudioPermission, openRecordAudioSettings } from './manager'

export async function ensureRecordAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true

  let granted = false
  try {
    granted = await hasRecordAudioPermission()
  } catch (e: any) {
    // 原生调用失败 — 保守起见认为没权限
  }

  if (granted) return true

  // 没权限 → toast 提示 + 直接跳设置
  toast('请授予麦克风权限后重试')
  openRecordAudioSettings()
  return false
}
