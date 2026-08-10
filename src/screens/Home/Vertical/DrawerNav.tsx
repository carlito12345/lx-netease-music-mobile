import { memo, useMemo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { useWindowSize } from '@/utils/hooks'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { SvgIcon } from '@/components/common/SvgIcon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
// import { navigations } from '@/navigation'
// import commonState from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import SidebarNav, { type SidebarNavItem } from '@/components/SidebarNav'
import React, { useState, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { useMyList } from '@/store/list/hook';
import { setActiveList } from '@/core/list';
import { navigations } from "@/navigation";
import commonState from '@/store/common/state';
import { DESIGN } from '@/theme/design';
import { BackgroundColorProvider } from '@/store/backgroundColor';

const CollapsibleMyListItem = () => {
  const t = useI18n();
  const theme = useTheme();
  const activeNavId = useNavActiveId();
  const allList = useMyList();
  const [isExpanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const contentHeight = useRef(0); // 用于存储子列表的实际高度

  const toggleCollapse = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // 高度动画必须禁用原生驱动
    }).start();
    setExpanded(!isExpanded);
  };

  const handleSelect = useCallback((listId: string) => {
    setNavActiveId('nav_love');
    setActiveList(listId);
    global.app_event.changeMenuVisible(false);
  }, []);

  // 动画插值
  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight.current],
  });

  const animatedOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const isCar = Math.min(useWindowSize().width, useWindowSize().height) >= 1000
  const rowH = isCar ? 96 : 52
  const fontS = isCar ? 40 : 16
  const iconS = isCar ? 60 : 20

  return (
    <View>
      {/* 主菜单项(与 SidebarNav 同款: 固定行高 + 居中 + 激活胶囊) */}
      <TouchableOpacity
        style={[styles.navRow, { height: rowH }, activeNavId === 'nav_love' ? { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14 } : null]}
        onPress={toggleCollapse}
      >
        <View style={[styles.navContent, { height: rowH }]}>
          <View style={[styles.iconBox, { width: iconS + 12, marginRight: iconS * 0.9 }]}>
            <Icon name="love" rawSize={iconS} color={activeNavId === 'nav_love' ? theme['c-primary'] : '#ffffff'} />
          </View>
          <Text size={fontS} color={activeNavId === 'nav_love' ? '#ffffff' : 'rgba(255,255,255,0.9)'} numberOfLines={1}>
            {t('nav_love')}
          </Text>
        </View>
        <Animated.View style={{ marginRight: 16, transform: [{ rotate: arrowRotation }] }}>
          <Icon name="chevron-right" size={isCar ? 24 : 16} color="rgba(255,255,255,0.6)" />
        </Animated.View>
      </TouchableOpacity>

      {/* 可折叠的子列表 */}
      <Animated.View style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}>
        <View
          onLayout={(event) => {
            // 测量内容实际高度，用于动画
            contentHeight.current = event.nativeEvent.layout.height;
          }}
          style={{ position: 'absolute', width: '100%' }} // 使用绝对定位来测量，避免影响布局
        >
          {allList.map(list => (
            <TouchableOpacity
              key={list.id}
              style={[styles.subMenuItem, { height: rowH - 8, paddingLeft: iconS + 30 }]}
              onPress={() => handleSelect(list.id)}
            >
              <Text size={fontS - 4} color="rgba(255,255,255,0.8)" numberOfLines={1}>
                {list.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};
const styles = createStyle({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    // padding: 10,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    paddingLeft: 24, // 与 SidebarNav 菜单起点对齐
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  menus: {
    flex: 1,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    marginHorizontal: 12,
  },
  collapsibleMenuItemText: {
    flex: 1,
    paddingLeft: 20,
  },
  list: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  navRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuItem: {
    flexDirection: 'row',
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 25,
    paddingRight: 25,
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  iconContent: {
    width: 24,
    alignItems: 'center',
  },
  text: {
    paddingLeft: 20,
    // fontWeight: '500',
  },
  footer: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footerBtn: {
    padding: 10,
  },
})

const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary']} size={28} />
        <Text style={styles.headerText} size={28} color="#ffffff">
          LX-N Music
        </Text>
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const renderIcon = (icon: string, size: number, color: string) => {
  if (icon.startsWith('svg:')) {
    return <SvgIcon name={icon.slice(4)} size={size} color={color} />
  }
  return <Icon name={icon} rawSize={size} color={color} />
}

const MenuItem = ({
  id,
  icon,
  onPress,
}: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()

  return activeId == id ? (
    <View style={{ ...styles.menuItem, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 12 }}>
      <View style={styles.iconContent}>
        {renderIcon(icon, 20, theme['c-primary'])}
      </View>
      <Text style={styles.text} color="#ffffff">
        {t(id)}
      </Text>
    </View>
  ) : (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        onPress(id)
      }}
    >
      <View style={styles.iconContent}>
        {renderIcon(icon, 20, theme['c-font-label'])}
      </View>
      <Text style={styles.text}>{t(id)}</Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const activeNavId = useNavActiveId()
  // console.log('render drawer nav')
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')
  const navStatus = useSettingValue('common.navStatus');
  const isShowMyListSubMenu = useSettingValue('list.isShowMyListSubMenu');

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

  const handleDownloadPress = () => {
    global.app_event.changeMenuVisible(false);
    navigations.pushDownloadManagerScreen(commonState.componentIds[commonState.componentIds.length - 1]?.id!);
  };
  const handleHistoryPress = () => {
    global.app_event.changeMenuVisible(false);
    setNavActiveId('nav_play_history');
  };
  const filteredNavMenus = useMemo(() => {
    return NAV_MENUS.filter(
      menu => menu.id !== 'nav_play_history' && (menu.id === 'nav_search' || menu.id === 'nav_setting' || (navStatus[menu.id] ?? true))
    );
  }, [navStatus]);

  return (
    <BackgroundColorProvider initialMode="white">
      <View style={styles.container}>
      {/* 顶部镂空区: 透出极光/主题背景(半透明深色渐变, 上部最透) */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          backgroundColor: 'rgba(27,23,34,0.35)',
        }}
      />
      {/* 菜单区: 实心深色盖住下方, 保证可读性 */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 220,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: DESIGN.cardDark,
        }}
      />
      <Header />
      <ScrollView style={styles.menus}>
        {isShowMyListSubMenu && filteredNavMenus.some(m => m.id === 'nav_love') ? (
          <>
            <CollapsibleMyListItem />
            <SidebarNav
              items={filteredNavMenus.filter(m => m.id !== 'nav_love').map(m => ({ id: m.id, label: t(m.id), icon: m.icon }))}
              activeId={activeNavId}
              onPress={(id) => handlePress(id as IdType)}
            />
          </>
        ) : (
          <SidebarNav
            items={filteredNavMenus.map(m => ({ id: m.id, label: t(m.id), icon: m.icon }))}
            activeId={activeNavId}
            onPress={(id) => handlePress(id as IdType)}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleHistoryPress}>
          <Icon name="music_time" size={25} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={handleDownloadPress}>
          <Icon name="download-2" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {global.lx.isCarMode && showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null}
      {global.lx.isCarMode && showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null}
      </View>
    </BackgroundColorProvider>
  )
})
