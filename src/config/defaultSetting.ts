const defaultSetting: LX.AppSetting = {
  version: '2.0',
  'version.autoCheckUpdate': true,
  'common.isAutoTheme': false,
  'common.langId': null,
  'common.apiSource': '',
  'common.sourceNameType': 'alias',
  'common.shareType': 'system',
  'common.isAgreePact': true,
  'common.autoHidePlayBar': true,
  'common.drawerLayoutPosition': 'left',
  'common.homePageScroll': true,
  'common.showBackBtn': false,
  'common.showExitBtn': false,
  'common.useSystemFileSelector': true,
  'common.wy_cookie': '',
  'common.wy_serpapi_key': '',
  'common.yt_cookie': '',
  'common.alwaysKeepStatusbarHeight': false,

  'common.navStatus': {
    nav_songlist: true,
    nav_top: true,
    nav_love: true,
    nav_daily_rec: true,
    nav_my_playlist: true,
    nav_followed_artists: true,
    nav_subscribed_albums: true,
    nav_onedrive: true,
  },

  'player.startupAutoPlay': false,
  'player.startupPushPlayDetailScreen': false,
  'player.togglePlayMethod': 'listLoop',
  'player.playQuality': '320k',
  'player.isSavePlayTime': false,
  'player.volume': 1,
  'player.playbackRate': 1,
  'player.cacheSize': '1024',
  'player.timeoutExit': '',
  'player.timeoutExitPlayed': true,
  'player.isAutoCleanPlayedList': false,
  'player.isHandleAudioFocus': true,
  'player.isEnableAudioOffload': true,
  'player.isShowLyricTranslation': true,
  'player.isShowLyricRoma': false,
  'player.isShowNotificationImage': true,
  'player.isS2t': true,
  'player.isShowBluetoothLyric': false,

  'playDetail.isCoverSpin': true,
  'playDetail.style.align': 'center',
  'playDetail.vertical.style.lrcFontSize': 200,
  'playDetail.horizontal.style.lrcFontSize': 220,
  'playDetail.isShowLyricProgressSetting': true,

  'desktopLyric.enable': false,
  'desktopLyric.isLock': false,
  'desktopLyric.width': 100,
  'desktopLyric.maxLineNum': 5,
  'desktopLyric.isSingleLine': false,
  'desktopLyric.showToggleAnima': true,
  'desktopLyric.position.x': 0,
  'desktopLyric.position.y': 0,
  'desktopLyric.textPosition.x': 'center',
  'desktopLyric.textPosition.y': 'center',
  'desktopLyric.style.fontSize': 180,
  'desktopLyric.style.opacity': 100,
  'desktopLyric.style.lyricUnplayColor': 'rgba(255, 255, 255, 1)',
  'desktopLyric.style.lyricPlayedColor': 'rgba(7, 197, 86, 1)',
  'desktopLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.6)',

  'search.isShowHotSearch': false,
  'search.isShowHistorySearch': true,

  'list.isClickPlayList': false,
  'list.isShowSource': true,
  'list.isShowAlbumName': true,
  'list.isShowInterval': true,
  'list.isSaveScrollLocation': true,
  'list.addMusicLocationType': 'top',
  'list.isShowMyListSubMenu': true,
  'list.isAutoSaveDailyRec': true,
  'list.isShowCover': true,

  'menu.playLater': true,
  'menu.addTo': true,
  'menu.share': true,
  'menu.playMV': true,
  'menu.songDetail': true,
  'menu.dislike': true,
  'menu.downloadOneDrive': true,

  'menu.moveTo': true,
  'menu.changePosition': true,
  'menu.changeSource': true,
  'artistDetail.albumViewMode': 'grid',

  'download.enable': true,
  'download.path': '',
  'download.fileName': '歌名 - 歌手',
  'download.writeLyric': false,
  'download.writeRomaLyric': false,
  'download.writeEmbedLyric': true,
  'download.writeMetadata': true,
  'download.writePicture': true,
  'download.writeAlias': false,

  'sync.enable': false,
  'sync.webdav.enable': false,
  'sync.webdav.syncLists': false,
  'sync.webdav.url': '',
  'sync.webdav.username': '',
  'sync.webdav.password': '',
  'sync.webdav.path': '/LX_Music/',
  'sync.webdav.lastSyncTimeLists': 0,

  'theme.id': 'green',
  'theme.lightId': 'green',
  'theme.darkId': 'black',
  'theme.hideBgDark': false,
  'theme.dynamicBg': true,
  'theme.blur': 18,
  'theme.fontShadow': false,
  'theme.customBgPicPath': '',
  'theme.picOpacity': 76,

  // 极光背景
  'app.background.aurora.enabled': false,
  'app.background.aurora.preset': 'aurora',
  'app.background.aurora.intensity': 1,

  // 播放页特效
  'playDetail.effect.shinyText.enabled': false,
  'playDetail.effect.magicRings.enabled': false,
  'playDetail.effect.magicRings.radius': 34,

  // 粒子/回声/频谱特效
  'playDetail.effect.starfield.enabled': false,
  'playDetail.effect.starfield.particleCount': 40,
  'playDetail.effect.starfield.particleSize': 2,
  'playDetail.effect.starfield.speed': 1,
  'playDetail.effect.starfield.pattern': 'random',
  'playDetail.effect.wallpaper.enabled': false,
  'playDetail.effect.wallpaper.color': '',
  'playDetail.effect.slideshow.enabled': false,
  'playDetail.effect.spectrum.enabled': false,

  // 歌词渐变色
  'playDetail.effect.lyricGradient.enabled': false,
  'playDetail.effect.lyricGradient.preset': 'aurora',

  // 歌词舞台/聚焦
  'playDetail.effect.lyricStage.enabled': false,
  'playDetail.effect.lyricProximity.enabled': false,

  // 背景模式
  'playDetail.background.type': 'theme',
  'playDetail.background.solidColor': '#000000',
  'playDetail.background.followCover': false,
  'playDetail.background.blurRadius': 20,

  // 封面样式
  'playDetail.cover.style': 'circle',
  'playDetail.cover.effect.glow': false,
  'playDetail.cover.effect.particles': false,
  'playDetail.cover.effect.rotate': false,
  'playDetail.cover.effect.swipe': false,

  // 迷你播放器
  'miniPlayer.followBgColor': true,
  'miniPlayer.customWidth': 500,
  'miniPlayer.customHeight': 900,
  'miniPlayer.lyricLines': 3,
  'miniPlayer.lyricFontSize': 15,
  'miniPlayer.lyricLineSpacing': 6,
  'miniPlayer.lyricOffsetMs': 0,
  'miniPlayer.lyricHighlightColor': '#ffffff',
  'miniPlayer.coverStyle': 'follow',
  'miniPlayer.enableParticles': false,
}

// 使用新年皮肤
if (new Date().getMonth() < 2) {
  defaultSetting['theme.id'] = 'happy_new_year'
  defaultSetting['desktopLyric.style.lyricPlayedColor'] = 'rgba(255, 18, 34, 1)'
}

export default defaultSetting
