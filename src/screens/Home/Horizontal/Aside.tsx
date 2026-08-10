import { memo, useMemo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { SvgIcon } from '@/components/common/SvgIcon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
// import commonState from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import { useSettingValue } from '@/store/setting/hook'
import { useWindowSize } from '@/utils/hooks'
import Text from '@/components/common/Text'
import { DESIGN } from '@/theme/design'
import { useI18n } from '@/lang'

const NAV_WIDTH = 68
// 车机大屏侧边栏宽度(横屏>=1000dp): 显示文字, 大图标
const NAV_WIDTH_CAR = 280

const styles = createStyle({
  container: {
    flexGrow: 0,
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    // padding: 10,
    borderRightWidth: BorderWidths.normal,
    paddingBottom: 10,
    width: NAV_WIDTH,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    marginLeft: 16,
  },
  menus: {
    flex: 1,
  },
  list: {
    // paddingTop: 10,
    paddingBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    paddingTop: 15,
    paddingBottom: 15,
    // paddingLeft: 25,
    // paddingRight: 25,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  iconContent: {
    // width: 24,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
  },
  text: {
    paddingLeft: 15,
    // fontWeight: '500',
  },
  // ===== 车机单独布局样式 =====
  headerCar: {
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'flex-start',
    paddingLeft: 20,
  },
  headerTextCar: {
    marginLeft: 12,
  },
  menuItemCar: {
    height: 64,
    justifyContent: 'flex-start',
    paddingLeft: 20,
    marginBottom: 4,
    position: 'relative',
  },
  textCar: {
    marginLeft: 12,
    flex: 1,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '18%',
    bottom: '18%',
    width: 4,
    borderRadius: 2,
  },
})

const Header = ({ isCar }: { isCar: boolean }) => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={[styles.header, isCar ? styles.headerCar : null]}>
        <Icon name="logo" color={isCar ? theme['c-primary'] : theme['c-primary-dark-100-alpha-300']} size={isCar ? 30 : 22} />
        {isCar ? (
          <Text style={styles.headerTextCar} size={22} color="#ffffff">LX-N Music</Text>
        ) : null}
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const renderIcon = (icon: string, size: number, color: string) => {
  if (icon.startsWith('svg:')) {
    return <SvgIcon name={icon.slice(4)} size={size} color={color} />
  }
  return <Icon name={icon} size={size} color={color} />
}

const MenuItem = ({
  id,
  icon,
  isCar,
  onPress,
}: {
  id: IdType
  icon: string
  isCar: boolean
  onPress: (id: IdType) => void
}) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()

  const iconSize = isCar ? 30 : 20
  const active = activeId == id

  return active ? (
    <View style={[styles.menuItem, isCar ? styles.menuItemCar : null, { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14 }]}>
      {active && isCar ? (
        <View style={[styles.activeBar, { backgroundColor: theme['c-primary'] }]} />
      ) : null}
      <View style={styles.iconContent}>
        {renderIcon(icon, iconSize, isCar ? theme['c-primary'] : theme['c-primary-font-active'])}
      </View>
      {isCar ? <Text style={styles.textCar} size={22} color="#ffffff">{t(id)}</Text> : null}
    </View>
  ) : (
    <TouchableOpacity
      style={[styles.menuItem, isCar ? styles.menuItemCar : null]}
      onPress={() => {
        onPress(id)
      }}
    >
      <View style={styles.iconContent}>
        {renderIcon(icon, iconSize, isCar ? '#ffffff' : theme['c-font-label'])}
      </View>
      {isCar ? <Text style={styles.textCar} size={22} color="rgba(255,255,255,0.9)">{t(id)}</Text> : null}
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  // 车机单独布局: 短边(竖向最小边) >= 1000dp 即大屏车机/平板(兼容横竖屏)
  const { width, height } = useWindowSize()
  const isCar = Math.min(width, height) >= 1000
  // console.log('render drawer nav')
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')
  const navStatus = useSettingValue('common.navStatus');

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then((isExit) => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }

    global.app_event.changeMenuVisible(false)
    setNavActiveId(id as any)
  }

  const filteredNavMenus = useMemo(() => {
    return NAV_MENUS.filter(
      menu => menu.id !== 'nav_play_history' && (menu.id === 'nav_search' || menu.id === 'nav_setting' || (navStatus[menu.id] ?? true))
    );
  }, [navStatus]);
  return (
    <View
      style={[
        styles.container,
        isCar ? { width: NAV_WIDTH_CAR, backgroundColor: DESIGN.cardDark, borderRightWidth: 0 } : { borderRightColor: theme['c-border-background'] },
      ]}
    >
      <Header isCar={isCar} />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {filteredNavMenus.map((menu) => ( // 使用过滤后的菜单
            <MenuItem key={menu.id} id={menu.id} icon={menu.icon} isCar={isCar} onPress={handlePress} />
          ))}
        </View>
      </ScrollView>
      {global.lx.isCarMode && showBackBtn ? <MenuItem id="back_home" icon="home" isCar={isCar} onPress={handlePress} /> : null}
      {global.lx.isCarMode && showExitBtn ? <MenuItem id="nav_exit" icon="exit2" isCar={isCar} onPress={handlePress} /> : null}
    </View>
  )
})
