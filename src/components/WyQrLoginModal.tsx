import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import QRCode from 'react-native-qrcode-svg';
import Modal, { type ModalType } from '@/components/common/Modal';
import ButtonPrimary from '@/components/common/ButtonPrimary';
import Text from '@/components/common/Text';
import { useTheme } from '@/store/theme/hook';
import { toast } from '@/utils/tools';
import wyApi from '@/utils/musicSdk/wy/user';
import { checkQrCode, clearQrWebSession, createQrCode, getQrKey, setQrWebSession } from '@/utils/musicSdk/wy/qrLogin';

const POLL_INTERVAL = 2000;
type LoginStatus = 'loading' | 'waiting' | 'scanned' | 'expired' | 'error';

export interface WyQrLoginModalType {
  show: () => void;
}

export default forwardRef<WyQrLoginModalType>((_, ref) => {
  const theme = useTheme();
  const modalRef = useRef<ModalType>(null);
  const keyRef = useRef('');
  const activeRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<LoginStatus>('loading');
  const [qrValue, setQrValue] = useState('');
  const [error, setError] = useState('');
  const webViewRef = useRef<WebView>(null);
  const webReadyResolverRef = useRef<(() => void) | null>(null);
  const webReadyPromiseRef = useRef<Promise<void> | null>(null);

  const prepareHiddenWebSession = useCallback((): Promise<void> => {
    if (webReadyPromiseRef.current) return webReadyPromiseRef.current;
    webReadyPromiseRef.current = new Promise(resolve => {
      webReadyResolverRef.current = resolve;
      setTimeout(() => {
        webReadyResolverRef.current?.();
        webReadyResolverRef.current = null;
      }, 10000);
    });
    return webReadyPromiseRef.current;
  }, []);

  const handleHiddenWebMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { token?: string; sDeviceId?: string };
      const cookies = await CookieManager.get('https://music.163.com/', true);
      const cookie = Object.values(cookies)
        .filter(item => item.value)
        .map(item => `${item.name}=${item.value}`)
        .join('; ');
      setQrWebSession({
        ydDeviceToken: payload.token,
        sDeviceId: payload.sDeviceId || cookies.sDeviceId?.value,
        cookie,
      });
      webReadyResolverRef.current?.();
      webReadyResolverRef.current = null;
    } catch {
      webReadyResolverRef.current?.();
      webReadyResolverRef.current = null;
    }
  }, []);

  const handleHiddenWebLoad = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function pollNeteaseFingerprint() {
        try {
          if (typeof createNEFingerprint !== 'function') {
            setTimeout(pollNeteaseFingerprint, 500);
            return;
          }
          var cookies = document.cookie.split(';').reduce(function(result, item) {
            var pair = item.trim().split('=');
            if (pair[0]) result[pair[0]] = pair.slice(1).join('=');
            return result;
          }, {});
          var instance = createNEFingerprint({ appId: '9d0ef7e0905d422cba1ecf7e73d77e67', timeout: 6000 });
          instance.getToken().then(function(result) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              token: result && result.token || '',
              sDeviceId: cookies.sDeviceId || ''
            }));
          }).catch(function() { window.ReactNativeWebView.postMessage(JSON.stringify({ sDeviceId: cookies.sDeviceId || '' })); });
        } catch (error) {
          setTimeout(pollNeteaseFingerprint, 500);
        }
      })(); true;
    `);
  }, []);

  const getNativeMusicCookie = useCallback(async (): Promise<string> => {
    const cookies = await CookieManager.get('https://music.163.com/', true);
    return Object.values(cookies)
      .filter(item => item.value)
      .map(item => `${item.name}=${item.value}`)
      .join('; ');
  }, []);

  const mergeCookies = useCallback((...values: string[]): string => {
    const cookies = new Map<string, string>();
    for (const value of values) {
      for (const part of value.split(';')) {
        const separator = part.indexOf('=');
        if (separator <= 0) continue;
        const name = part.slice(0, separator).trim();
        const cookieValue = part.slice(separator + 1).trim();
        if (name && cookieValue && !['path', 'domain', 'expires', 'max-age', 'httponly', 'secure', 'samesite'].includes(name.toLowerCase())) {
          cookies.set(name, cookieValue);
        }
      }
    }
    return Array.from(cookies, ([name, cookieValue]) => `${name}=${cookieValue}`).join('; ');
  }, []);

  const stopPolling = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const close = useCallback(() => {
    stopPolling();
    keyRef.current = '';
    clearQrWebSession();
    modalRef.current?.setVisible(false);
  }, [stopPolling]);

  const poll = useCallback(async (): Promise<void> => {
    if (!activeRef.current || !keyRef.current) return;
    try {
      const result = await checkQrCode(keyRef.current);
      if (!activeRef.current) return;
      if (result.code === 803) {
        const nativeCookie = await getNativeMusicCookie();
        const cookie = mergeCookies(result.cookie || '', nativeCookie);
        if (!cookie.includes('MUSIC_U=')) throw new Error('登录成功但未获取到 MUSIC_U Cookie');
        await wyApi.getUid(cookie);
        if (!activeRef.current) return;
        (global.app_event as any).emit('wy-cookie-set', cookie);
        toast('登录成功,已自动保存 Cookie!');
        close();
        return;
      }
      if (result.code === 800) {
        setStatus('expired');
        stopPolling();
        return;
      }
      setStatus(result.code === 802 ? 'scanned' : 'waiting');
      timerRef.current = setTimeout(() => { void poll(); }, POLL_INTERVAL);
    } catch (err) {
      if (!activeRef.current) return;
      setError(err instanceof Error ? err.message : '二维码状态检查失败');
      setStatus('error');
      stopPolling();
    }
  }, [close, getNativeMusicCookie, mergeCookies, stopPolling]);

  const loadQrCode = useCallback(async (): Promise<void> => {
    stopPolling();
    setStatus('loading');
    setError('');
    setQrValue('');
    try {
      await prepareHiddenWebSession();
      const unikey = await getQrKey();
      const qrCode = await createQrCode(unikey);
      keyRef.current = unikey;
      setQrValue(qrCode.qrurl);
      setStatus('waiting');
      activeRef.current = true;
      void poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取二维码失败');
      setStatus('error');
      stopPolling();
    }
  }, [poll, stopPolling]);

  useImperativeHandle(ref, () => ({
    show() {
      modalRef.current?.setVisible(true);
      webReadyPromiseRef.current = null;
      webReadyResolverRef.current = null;
      requestAnimationFrame(() => { void loadQrCode(); });
    },
  }), [loadQrCode]);

  const message = status === 'loading' ? '正在获取二维码...'
    : status === 'waiting' ? '请使用网易云音乐 App 扫码登录'
      : status === 'scanned' ? '已扫码,请在手机上确认登录'
        : status === 'expired' ? '二维码已过期,请重新获取'
          : error || '二维码登录失败';
  const retryable = status === 'expired' || status === 'error';

  return (
    <Modal ref={modalRef} onHide={stopPolling} bgColor="rgba(0,0,0,.35)">
      <View style={styles.center}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://music.163.com/' }}
          onLoadEnd={handleHiddenWebLoad}
          onMessage={handleHiddenWebMessage}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0"
          pointerEvents="none"
          style={styles.hiddenWebView}
        />
        <View style={[styles.content, { backgroundColor: theme['c-content-background'] }]}
          onStartShouldSetResponder={() => true}>
          <Text size={18} style={styles.title}>网易云音乐扫码登录</Text>
          <View style={styles.qrBox}>
            {qrValue && !retryable
              ? <QRCode value={qrValue} size={210} color="#000" backgroundColor="#fff" />
              : status === 'loading'
                ? <ActivityIndicator size="large" color={theme['c-primary-light-1000']} />
                : <Text size={14}>{retryable ? '二维码不可用' : ''}</Text>}
          </View>
          <Text size={14} style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {retryable && <ButtonPrimary onPress={() => { void loadQrCode(); }}>重新获取</ButtonPrimary>}
            <ButtonPrimary onPress={close}>取消</ButtonPrimary>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hiddenWebView: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  content: { width: 310, borderRadius: 8, alignItems: 'center', padding: 20 },
  title: { marginBottom: 18 },
  qrBox: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  message: { marginTop: 16, marginBottom: 16, textAlign: 'center' },
  actions: { flexDirection: 'row' },
});
