import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, type ImageSourcePropType } from 'react-native'
import { setTheme } from '@/core/theme'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'

import SubTitle from '../../components/SubTitle'
import { BG_IMAGES, getAllThemes, type LocalTheme } from '@/theme/themes'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import ImageBackground from '@/components/common/ImageBackground'
import Chip from '@/components/common/Chip'

const useActive = (id: string) => {
  const activeThemeId = useSettingValue('theme.id')
  const isActive = useMemo(() => activeThemeId == id, [activeThemeId, id])
  return isActive
}

const ThemeItem = ({
  id,
  name,
  color,
  image,
  setTheme,
}: {
  id: string
  name: string
  color: string
  image?: ImageSourcePropType
  setTheme: (id: string) => void
}) => {
  const theme = useTheme()
  const isActive = useActive(id)

  return (
    <Chip
      label={name}
      active={isActive}
      onPress={() => setTheme(id)}
      size={11}
      leading={
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: color,
            marginRight: 6,
          }}
        />
      }
    />
  )
}

interface ThemeInfo {
  themes: Readonly<LocalTheme[]>
  userThemes: LX.Theme[]
  dataPath: string
}
const initInfo: ThemeInfo = { themes: [], userThemes: [], dataPath: '' }
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [themeInfo, setThemeInfo] = useState(initInfo)
  const setThemeId = useCallback((id: string) => {
    requestAnimationFrame(() => {
      setTheme(id)
    })
  }, [])

  useEffect(() => {
    void getAllThemes().then(setThemeInfo)
  }, [])

  return (
    <View style={styles.container}>
      <Text size={12} color={theme['c-font-label']} style={styles.optionLabel}>
        {t('setting_basic_theme')}
      </Text>
      <View style={styles.list}>
        {themeInfo.themes.map(({ id, config }) => {
          return (
            <ThemeItem
              key={id}
              color={config.themeColors['c-theme']}
              image={config.extInfo['bg-image'] ? BG_IMAGES[config.extInfo['bg-image']] : undefined}
              id={id}
              name={t(`theme_${id}`)}
              setTheme={setThemeId}
            />
          )
        })}
        {themeInfo.userThemes.map(({ id, name, config }) => {
          return (
            <ThemeItem
              key={id}
              color={config.themeColors['c-theme']}
              // image={undefined}
              id={id}
              name={name}
              setTheme={setThemeId}
            />
          )
        })}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  optionLabel: {
    marginBottom: 8,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
})
