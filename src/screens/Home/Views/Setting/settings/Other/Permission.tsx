/**
 * Permission - 权限管理(设置>其他 分组)
 * 按新底包设计规范: Section 分组 + CheckBoxItem/Button 组件
 * 支持: 悬浮窗/通知/所有文件访问/电池优化
 */
import { memo, useState, useCallback, useEffect } from 'react'
import { AppState, View, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { DESIGN } from '@/theme/design'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

const { NativeModules } = require('react-native')
const { PermissionModule, AsrModule } = NativeModules as any

interface PermissionItem {
  key: string
  label: string
  description: string
  check: () => Promise<boolean>
  open: () => Promise<void> | void
}

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const [permStatus, setPermStatus] = useState<Record<string, boolean>>({})

  const permissionList: PermissionItem[] = [
    {
      key: 'recordAudio',
      label: '麦克风权限',
      description: '语音识别需要使用麦克风',
      check: async () => {
        try { return await AsrModule?.hasRecordAudioPermission?.() ?? false } catch { return false }
      },
      open: () => { try { AsrModule?.openRecordAudioSettings?.() } catch (_) {} },
    },
    {
      key: 'overlay',
      label: t('setting_other_permission_overlay'),
      description: t('setting_other_permission_overlay_desc'),
      check: async () => {
        try { return await PermissionModule.hasOverlayPermission() } catch { return false }
      },
      open: () => PermissionModule.openOverlaySettings(),
    },
    {
      key: 'manageStorage',
      label: t('setting_other_permission_storage'),
      description: t('setting_other_permission_storage_desc'),
      check: async () => {
        try { return await PermissionModule.hasManageExternalStoragePermission() } catch { return false }
      },
      open: () => PermissionModule.openManageExternalStorageSettings(),
    },
    {
      key: 'notification',
      label: t('setting_other_permission_notification'),
      description: t('setting_other_permission_notification_desc'),
      check: async () => {
        try { return await PermissionModule.hasNotificationPermission() } catch { return false }
      },
      open: () => PermissionModule.openNotificationSettings(),
    },
    {
      key: 'battery',
      label: t('setting_other_permission_battery'),
      description: t('setting_other_permission_battery_desc'),
      check: async () => {
        try { return await PermissionModule.hasIgnoreBatteryOptimization() } catch { return false }
      },
      open: () => PermissionModule.openBatteryOptimizationSettings(),
    },
  ]

  const checkAll = useCallback(async () => {
    const status: Record<string, boolean> = {}
    for (const item of permissionList) {
      status[item.key] = await item.check()
    }
    setPermStatus(status)
  }, [])

  // 实时监控: App 回到前台时自动刷新权限状态
  useEffect(() => {
    void checkAll()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkAll()
    })
    return () => sub.remove()
  }, [checkAll])

  const handleOpen = async (item: PermissionItem) => {
    await item.open()
    setTimeout(() => { void checkAll() }, 1500)
  }

  return (
    <View style={styles.container}>
      {permissionList.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.item}
          onPress={() => handleOpen(item)}
          activeOpacity={0.6}
        >
          <View style={styles.itemLeft}>
            <Text size={14} color={theme['c-font']}>{item.label}</Text>
            <Text size={11} color={theme['c-font-label']}>{item.description}</Text>
          </View>
          <Text
            size={12}
            color={permStatus[item.key] ? theme['c-primary'] : theme['c-font-label']}
          >
            {permStatus[item.key] ? t('setting_other_permission_granted') : t('setting_other_permission_denied')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
})

const styles = createStyle({
  container: {
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: DESIGN.spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: DESIGN.separator,
  },
  itemLeft: {
    flex: 1,
    marginRight: 10,
  },
})
