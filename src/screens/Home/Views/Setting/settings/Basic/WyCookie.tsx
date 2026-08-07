import { memo, useEffect } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle, toast } from '@/utils/tools';
import Button from '../../components/Button';
import CookieManager from '@react-native-cookies/cookies';



const COOKIE_ATTRIBUTES = new Set([
  'path', 'domain', 'expires', 'max-age', 'httponly', 'secure',
  'samesite', 'priority', 'partitioned',
]);

// 将 Cookie 字符串解析为纯 name=value 列表,丢弃 Set-Cookie 属性
// 和 Android HttpCookie 无法接受的条目(value 含空格/逗号/分号)。
const parseCookieEntries = (cookie: string): Array<{ name: string; value: string }> => {
  const seen = new Map<string, string>();
  for (let part of cookie.split(';')) {
    part = part.trim();
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!name || !value) continue;
    if (COOKIE_ATTRIBUTES.has(name.toLowerCase())) continue;
    // HttpCookie 不允许 name/value 含空格、逗号、分号
    if (/[,\s;]/.test(name) || /[,\s;]/.test(value)) continue;
    seen.set(name, value);
  }
  return Array.from(seen, ([name, value]) => ({ name, value }));
};

const syncCookieToNative = async (cookie: string) => {
  const domain = 'https://music.163.com';
  const entries = parseCookieEntries(cookie);
  let failed = 0;
  try {
    // 1. 关键步骤:清除该域名的所有原生Cookie,`true` 表示使用共享存储
    await CookieManager.clearAll(true);

    // 2. 将新的Cookie逐条设置回原生Cookie Jar;单条失败只跳过该条,
    //    不中断整体同步,避免清空旧 Cookie 后无法恢复。
    for (const { name, value } of entries) {
      try {
        await CookieManager.set(domain, {
          name,
          value,
          domain: 'music.163.com',
          path: '/',
        });
      } catch (err) {
        failed += 1;
        console.warn(`Failed to sync native cookie: ${name}`, err);
      }
    }
    if (failed > 0) {
      console.warn(`Cookie sync finished with ${failed}/${entries.length} failures`);
    } else {
      console.log('Native cookie synchronized successfully.');
    }
  } catch (error) {
    console.error('Failed to sync native cookie:', error);
    toast('Cookie 同步失败,部分请求可能异常', 'long');
  }
};

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.wy_cookie');
  const serpApiKey = useSettingValue('common.wy_serpapi_key');

  const setCookie = (val: string) => {
    // 先同步到原生层
    void syncCookieToNative(val).then(() => {
      // 再更新应用状态
      updateSetting({ 'common.wy_cookie': val });
    });
  };

  const handleChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setCookie(text);
  };

  const handleSerpApiKeyChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    updateSetting({ 'common.wy_serpapi_key': text.trim() });
  };

  const handleShowQrLoginModal = () => {
    (global.app_event as any).emit('showWyQrLogin');
  };

  const handleShowLoginModal = () => {
    (global.app_event as any).emit('showWebLogin');
  };

  useEffect(() => {
    const handleCookieSet = (cookie: string) => {
      setCookie(cookie);
    };

    (global.app_event as any).on('wy-cookie-set', handleCookieSet);
    return () => {
      (global.app_event as any).off('wy-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={cookie}
        label={t('setting_basic_wy_cookie')}
        onChanged={handleChanged}
        placeholder={t('setting_basic_wy_cookie_placeholder')}
      />
      <InputItem
        value={serpApiKey}
        label="SerpApi API Key"
        onChanged={handleSerpApiKeyChanged}
        placeholder="用于网易云搜索补充 Google 搜索结果"
      />
      <View style={styles.btnContainer}>
        <Button onPress={handleShowQrLoginModal}>扫码登录</Button>
        <Button onPress={handleShowLoginModal}>网页登录</Button>
      </View>
    </View>
  );
});

const styles = createStyle({
  content: {
    // marginTop: 10,
  },
  btnContainer: {
    marginBottom: 5,
    paddingLeft: 20,
    flexDirection: 'row',
  },
});
