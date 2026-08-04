import { memo, useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { View, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { useIsPlay, usePlayMusicInfo } from '@/store/player/hook';
import { useWindowSize } from '@/utils/hooks';
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant';
import { HEADER_HEIGHT } from './components/Header';
import Image from '@/components/common/Image';
import { useStatusbarHeight } from '@/store/common/hook';
import { useSettingValue } from '@/store/setting/hook';
import { useTheme } from '@/store/theme/hook';
import { createStyle, toast, requestStoragePermission } from '@/utils/tools';
import Menu, { type MenuType, type Menus } from '@/components/common/Menu';
import { addTask } from '@/core/download';
import RNFetchBlob from 'rn-fetch-blob';
import { getPicUrl } from '@/core/music/online';
import { getFileExtensionFromUrl } from '@/screens/Home/Views/Mylist/MusicList/download/utils';
import settingState from '@/store/setting/state';

export default memo(({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayMusicInfo();
  const { width: winWidth, height: winHeight } = useWindowSize();
  const statusBarHeight = useStatusbarHeight();
  const isPlay = useIsPlay();
  const isCoverSpin = useSettingValue('playDetail.isCoverSpin');
  const theme = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isAnimating = useRef(false);
  const menuRef = useRef<MenuType>(null);
  const coverRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const createAnimation = useCallback((value: number) => {
    return Animated.timing(spinValue, {
      toValue: 1,
      duration: 25000 * (1 - value),
      easing: Easing.linear,
      useNativeDriver: true,
    });
  }, [spinValue]);

  const startAnimation = useCallback(() => {
    if (isAnimating.current || !isCoverSpin) return;
    isAnimating.current = true;
    spinValue.stopAnimation(value => {
      animationRef.current = createAnimation(value);
      animationRef.current.start(({ finished }) => {
        if (finished && isAnimating.current) {
          spinValue.setValue(0);
          isAnimating.current = false;
          startAnimation();
        }
      });
    });
  }, [spinValue, createAnimation, isCoverSpin]);

  const stopAnimation = useCallback(() => {
    if (!isAnimating.current) return;
    isAnimating.current = false;
    animationRef.current?.stop();
    animationRef.current = null;
    spinValue.stopAnimation();
  }, [spinValue]);

  useEffect(() => {
    if (isPlay && isCoverSpin) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isPlay, isCoverSpin, startAnimation, stopAnimation]);

  useEffect(() => {
    stopAnimation();
    if (isPlay && isCoverSpin) {
      startAnimation();
    }
  }, [musicInfo.musicInfo?.id, isCoverSpin, startAnimation, stopAnimation]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const coverStyle = useSettingValue('playDetail.cover.style')
  const { imgWidth, borderRadius, ringSize } = useMemo(() => {
    const w = Math.min(winWidth * 0.85, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.5);
    let br: number
    switch (coverStyle) {
      case 'circle': br = w / 2; break
      case 'square': br = 0; break
      case 'rounded': br = w * 0.08; break
      case 'vinyl': br = w / 2; break
      default: br = w / 2
    }
    return { imgWidth: w, borderRadius: br, ringSize: w + 4 }
  }, [statusBarHeight, winHeight, winWidth, coverStyle])

  const imageStyle = useMemo(() => ({
    width: imgWidth,
    height: imgWidth,
    borderRadius,
  } as any), [imgWidth, borderRadius]);

  const menus = useMemo((): Menus => [
    { action: 'download_song', label: '下载歌曲' },
    { action: 'download_pic', label: '下载封面' },
  ], []);

  const handleLongPress = () => {
    if (!coverRef.current) return;
    coverRef.current.measure((x, y, w, h, px, py) => {
      setMenuVisible(true);
      requestAnimationFrame(() => {
        menuRef.current?.show({ x: px, y: py, w, h });
      });
    });
  };

  const handleMenuPress = ({ action }: typeof menus[number]) => {
    switch (action) {
      case 'download_song':
        if (musicInfo.musicInfo) {
          const quality = settingState.setting['player.playQuality'];
          addTask(musicInfo.musicInfo as LX.Music.MusicInfo, quality);
        }
        break;
      case 'download_pic':
        if (musicInfo.musicInfo) {
          void (async () => {
            try {
              const isGranted = await requestStoragePermission();
              if (isGranted === false) {
                toast('没有存储权限，无法下载', 'short');
                return;
              }

              toast('正在下载封面...', 'short');
              const picUrl = await getPicUrl({ musicInfo: musicInfo.musicInfo as LX.Music.MusicInfoOnline, isRefresh: true });
              const extension = getFileExtensionFromUrl(picUrl);
              const picBaseDir = RNFetchBlob.fs.dirs.PictureDir || RNFetchBlob.fs.dirs.DownloadDir;
              const downloadDir = `${picBaseDir}/LX-N-Music`;
              const mInfo = musicInfo.musicInfo as LX.Music.MusicInfo;
              const fileName = `${mInfo.name}_${mInfo.singer}.${extension}`.replace(/[\\/:*?"<>|]/g, '_');
              const filePath = `${downloadDir}/${fileName}`;

              const exists = await RNFetchBlob.fs.exists(downloadDir);
              if (!exists) {
                try {
                  await RNFetchBlob.fs.mkdir(downloadDir);
                } catch (e) {
                  console.warn('mkdir failed');
                }
              }

              const targetPath = (await RNFetchBlob.fs.exists(downloadDir)) ? filePath : `${picBaseDir}/${fileName}`;

              await RNFetchBlob.config({ path: targetPath }).fetch('GET', picUrl);
              await RNFetchBlob.fs.scanFile([{ path: targetPath }]);
              toast(`封面已保存到: ${targetPath}`, 'long');
            } catch (err: any) {
              toast(`下载封面失败: ${err.message}`, 'long');
            }
          })();
        }
        break;
    }
  };

  // 黑胶唱片中心孔
  const vinylHole = coverStyle === 'vinyl' && (
    <View style={{
      position: 'absolute',
      width: imgWidth * 0.18,
      height: imgWidth * 0.18,
      borderRadius: imgWidth * 0.09,
      backgroundColor: theme['c-content-background'],
      borderWidth: 2,
      borderColor: theme['c-primary-alpha-400'],
    }} />
  )

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onLongPress={handleLongPress}>
        <View ref={coverRef} style={[styles.content, { opacity: coverStyle === 'hidden' ? 0 : 1 }]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={{
              width: ringSize, height: ringSize, borderRadius: ringSize / 2,
              borderWidth: coverStyle === 'vinyl' ? 3 : 1,
              borderColor: coverStyle === 'vinyl' ? theme['c-primary-alpha-600'] : theme['c-primary-alpha-400'],
              justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent',
            }}>
              <Image
                url={(musicInfo.musicInfo as LX.Music.MusicInfo)?.meta?.picUrl}
                nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
                style={imageStyle}
              />
              {vinylHole}
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      {menuVisible && <Menu ref={menuRef} menus={menus} onPress={handleMenuPress} onHide={() => setMenuVisible(false)} />}
    </View>
  );
});

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '3%',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0)',
  },
});
