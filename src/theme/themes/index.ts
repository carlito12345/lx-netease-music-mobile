import { getUserTheme, saveUserTheme } from '@/utils/data'
import themes from '@/theme/themes/themes'
import settingState from '@/store/setting/state'
import themeState from '@/store/theme/state'
import { isUrl } from '@/utils'
import { privateStorageDirectoryPath } from '@/utils/fs'
import { type ImageSourcePropType } from 'react-native'

export const BG_IMAGES = {
  'china_ink.jpg': require('./images/china_ink.jpg') as ImageSourcePropType,
  'jqbg.jpg': require('./images/jqbg.jpg') as ImageSourcePropType,
  'landingMoon.png': require('./images/landingMoon2.png') as ImageSourcePropType,
  'myzcbg.jpg': require('./images/myzcbg.jpg') as ImageSourcePropType,
  'xnkl.png': require('./images/xnkl.png') as ImageSourcePropType,
} as const

let userThemes: LX.Theme[]
export const getAllThemes = async () => {
  userThemes ??= await getUserTheme()
  return {
    themes,
    userThemes,
    dataPath: privateStorageDirectoryPath + '/theme_images',
  }
}

export const saveTheme = async (theme: LX.Theme) => {
  const targetTheme = userThemes.find((t) => t.id === theme.id)
  if (targetTheme) Object.assign(targetTheme, theme)
  else userThemes.push(theme)
  await saveUserTheme(userThemes)
}

export const removeTheme = async (id: string) => {
  const index = userThemes.findIndex((t) => t.id === id)
  if (index < 0) return
  userThemes.splice(index, 1)
  await saveUserTheme(userThemes)
}

export type LocalTheme = (typeof themes)[number]
type ColorsKey = keyof LX.Theme['config']['themeColors']
type ExtInfoKey = keyof LX.Theme['config']['extInfo']
const varColorRxp = /^var\((.+)\)$/
export const buildActiveThemeColors = (theme: LX.Theme): LX.ActiveTheme => {
  let bgImg: ImageSourcePropType | undefined
  if (theme.isCustom) {
    if (theme.config.extInfo['bg-image']) {
      theme.config.extInfo['bg-image'] = isUrl(theme.config.extInfo['bg-image'])
        ? theme.config.extInfo['bg-image']
        : `${privateStorageDirectoryPath}/theme_images/${theme.config.extInfo['bg-image']}`
    }
  } else {
    const extInfo = (theme as LocalTheme).config.extInfo
    if (extInfo['bg-image']) {
      bgImg = BG_IMAGES[extInfo['bg-image']]
    }
  }

  theme.config.extInfo = { ...theme.config.extInfo }

  for (const [k, v] of Object.entries(theme.config.extInfo) as Array<
    [ExtInfoKey, LX.Theme['config']['extInfo'][ExtInfoKey]]
  >) {
    if (!v.startsWith('var(')) continue
    theme.config.extInfo[k] = theme.config.themeColors[v.replace(varColorRxp, '$1') as ColorsKey]
  }

  // primary 背景上的文字色: isDark 且 primary 为亮色(黑白对撞)时用深色文字,否则白色
  const primaryRgb = theme.config.themeColors['c-primary'].match(/\d+/g)?.map(Number)
  const primaryLuma = primaryRgb ? (primaryRgb[0] * 299 + primaryRgb[1] * 587 + primaryRgb[2] * 114) / 1000 : 0
  const onPrimaryColor = theme.isDark && primaryLuma > 128
    ? 'rgb(0, 0, 0)'
    : '#ffffff'

  const activeTheme: LX.ActiveTheme = {
    id: theme.id,
    name: theme.name,
    isDark: theme.isDark,
    ...theme.config.themeColors,
    ...theme.config.extInfo,
    'c-font': theme.config.themeColors['c-850'],
    'c-font-label': theme.config.themeColors['c-450'],
    'c-primary-font': theme.config.themeColors['c-primary'],
    'c-primary-font-hover': theme.config.themeColors['c-primary-alpha-300'],
    'c-primary-font-active': theme.config.themeColors['c-primary-dark-100-alpha-200'],
    'c-primary-background': theme.config.themeColors['c-primary-light-400-alpha-700'],
    'c-primary-background-hover': theme.config.themeColors['c-primary-light-300-alpha-800'],
    'c-primary-background-active': theme.config.themeColors['c-primary-light-100-alpha-800'],
    'c-primary-input-background': theme.config.themeColors['c-primary-light-400-alpha-700'],
    'c-button-font': theme.config.themeColors['c-primary-alpha-100'],
    'c-button-font-selected': theme.config.themeColors['c-primary-dark-100-alpha-100'],
    'c-button-background': theme.config.themeColors['c-primary-light-400-alpha-700'],
    'c-button-background-selected': theme.config.themeColors['c-primary-alpha-600'],
    'c-button-background-hover': theme.config.themeColors['c-primary-light-300-alpha-600'],
    'c-button-background-active': theme.config.themeColors['c-primary-light-100-alpha-600'],
    'c-list-header-border-bottom': theme.config.themeColors['c-primary-alpha-900'],
    // extInfo 可覆盖背景色(如纯黑主题覆盖灰色阶),默认取 themeColors
    'c-content-background': theme.config.extInfo['c-content-background'] || theme.config.themeColors['c-primary-light-1000'],
    'c-border-background': theme.config.extInfo['c-border-background'] || theme.config.themeColors['c-primary-light-100-alpha-700'],
    'c-liked': theme.config.extInfo['c-liked']!,
    'c-primary-font-on-primary': onPrimaryColor,
    'bg-image': bgImg,
  };

  // 如果是黑暗主题，我们覆盖掉 'c-primary-font-active'
  if (theme.isDark) {
    // 黑白对撞: 亮色 primary(黑底白字主题)时选中文字用纯白(默认 c-000 可能是中灰)
    activeTheme['c-primary-font-active'] = primaryLuma > 128 ? 'rgb(255, 255, 255)' : activeTheme['c-000']; // 使用纯白色 (rgb(255,255,255))
    // 黑白对撞: 亮色 primary 时选中/高亮背景用白色半透明(叠加黑底=深灰),避免白底白字看不清
    if (primaryLuma > 128) {
      activeTheme['c-primary-background'] = 'rgba(255, 255, 255, 0.12)'
      activeTheme['c-primary-background-hover'] = 'rgba(255, 255, 255, 0.18)'
      activeTheme['c-primary-background-active'] = 'rgba(255, 255, 255, 0.25)'
      activeTheme['c-primary-input-background'] = 'rgba(255, 255, 255, 0.12)'
      activeTheme['c-button-background'] = 'rgba(255, 255, 255, 0.12)'
      activeTheme['c-button-background-selected'] = 'rgba(255, 255, 255, 0.25)'
      activeTheme['c-button-background-hover'] = 'rgba(255, 255, 255, 0.18)'
      activeTheme['c-button-background-active'] = 'rgba(255, 255, 255, 0.22)'
    }
  }

  return activeTheme as const;
}

// const copyTheme = (theme: LX.Theme): LX.Theme => {
//   return {
//     ...theme,
//     config: {
//       ...theme.config,
//       extInfo: { ...theme.config.extInfo },
//       themeColors: { ...theme.config.themeColors },
//     },
//   }
// }
// type IDS = LocalTheme['id']
/** 按 id 直接查找主题(内置 + 自定义),不经过 isAutoTheme 逻辑 */
export const getThemeById = (id: string): LX.Theme | undefined => {
  const local = themes.find((t) => t.id === id)
  if (local) return local
  if (userThemes) {
    const custom = userThemes.find((t) => t.id === id)
    if (custom) return custom
  }
  return undefined
}

export const getTheme = async () => {
  // fs.promises.readdir()
  const shouldUseDarkColors = themeState.shouldUseDarkColors
  // let themeId = settingState.setting['theme.id'] == 'auto'
  //   ? shouldUseDarkColors
  //     ? settingState.setting['theme.darkId']
  //     : settingState.setting['theme.lightId']
  //   // : 'china_ink'
  //   : settingState.setting['theme.id']
  let themeId =
    settingState.setting['common.isAutoTheme'] && shouldUseDarkColors
      ? 'black'
      : settingState.setting['theme.id']
  // themeId = 'naruto'
  // themeId = 'pink'
  // themeId = 'black'
  let theme: LocalTheme | LX.Theme | undefined = themes.find((theme) => theme.id == themeId)
  if (!theme) {
    userThemes = await getUserTheme()
    theme = userThemes.find((theme) => theme.id == themeId)
    if (!theme) {
      themeId =
        settingState.setting['theme.id'] == 'auto' && shouldUseDarkColors ? 'black' : 'green'
      theme = themes.find((theme) => theme.id == themeId) as LX.Theme
    }
  }

  return theme
}
