import themeActions from '@/store/theme/action'
import { getTheme, getThemeById } from '@/theme/themes'
import { updateSetting } from './common'
import themeState from '@/store/theme/state'

export const setShouldUseDarkColors = (shouldUseDarkColors: boolean) => {
  themeActions.setShouldUseDarkColors(shouldUseDarkColors)
}

export const applyTheme = (theme: LX.Theme) => {
  themeActions.setTheme(theme)
}

export const setTheme = (id: string) => {
  updateSetting({ 'theme.id': id })
  // 手动选择主题: 直接应用所选主题,不经过 isAutoTheme 强制(否则跟随系统时选主题无效)
  const theme = getThemeById(id)
  if (theme) {
    if (theme.id == themeState.theme.id) return
    applyTheme(theme)
  } else {
    void getTheme().then((t) => {
      if (t.id == themeState.theme.id) return
      applyTheme(t)
    })
  }
}
