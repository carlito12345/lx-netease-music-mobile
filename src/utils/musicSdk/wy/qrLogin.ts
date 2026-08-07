import { httpFetch } from '../../request';
import { weapi } from './utils/crypto';

const QR_LOGIN_BASE_URL = 'https://music.163.com';
const QR_LOGIN_ORIGIN = `${QR_LOGIN_BASE_URL}/`;

export type QrCodeStatus = 800 | 801 | 802 | 803;

export interface QrCreateResponse {
  code: number;
  qrimg?: string;
  qrurl: string;
}

export interface QrLoginResult {
  code: QrCodeStatus | 0;
  message: string;
  cookie?: string;
}

interface HttpResponse<T> {
  body: T;
  headers?: Record<string, string | string[] | undefined>;
  statusCode: number;
  statusMessage?: string;
  url?: string;
}

interface QrKeyBody {
  code: number;
  unikey?: string;
  message?: string;
}

interface QrCheckBody {
  code: QrCodeStatus;
  message?: string;
  msg?: string;
  cookie?: string;
}

interface QrSession {
  chainId: string;
  ydDeviceToken?: string;
  cookie?: string;
}

export interface QrWebSession {
  ydDeviceToken?: string;
  sDeviceId?: string;
  cookie?: string;
}

const sessions = new Map<string, QrSession>();
let webSession: QrWebSession = {};

export const setQrWebSession = (session: QrWebSession): void => {
  webSession = { ...session };
};

export const clearQrWebSession = (): void => {
  webSession = {};
};

const getHeader = (
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string
): string => {
  if (!headers) return '';
  const value = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
  return Array.isArray(value) ? value.join('; ') : value || '';
};

const normalizeCookie = (value: string): string => {
  const cookies = new Map<string, string>();
  const attributes = new Set(['path', 'domain', 'expires', 'max-age', 'httponly', 'secure', 'samesite', 'priority', 'partitioned']);
  for (const item of value.split(/;\s*(?=[^;=]+=|(?:Path|Domain|Expires|Max-Age|HttpOnly|Secure|SameSite|Priority|Partitioned)(?:=|;|$))/i)) {
    const separator = item.indexOf('=');
    if (separator <= 0) continue;
    const name = item.slice(0, separator).trim();
    const cookieValue = item.slice(separator + 1).trim();
    if (!name || !cookieValue || attributes.has(name.toLowerCase())) continue;
    cookies.set(name, cookieValue);
  }
  return Array.from(cookies, ([name, cookieValue]) => `${name}=${cookieValue}`).join('; ');
};

const asObject = (value: unknown): Record<string, any> | null =>
  value && typeof value === 'object' ? value as Record<string, any> : null;

const parseBody = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findBodyWithCode = (value: unknown, expectedCodes: number[]): Record<string, any> | null => {
  const parsed = parseBody(value);
  const object = asObject(parsed);
  if (!object) return null;
  const code = Number(object.code);
  if (expectedCodes.includes(code)) return object;
  for (const key of ['data', 'result', 'body', 'response']) {
    const nested = findBodyWithCode(object[key], expectedCodes);
    if (nested) return nested;
  }
  return null;
};

const describeBody = (value: unknown): string => {
  if (value === undefined) return '<undefined>';
  if (value === null) return '<null>';
  const parsed = parseBody(value);
  if (typeof parsed === 'string') return parsed ? parsed.slice(0, 180) : '<empty>';
  try {
    const result = JSON.stringify(parsed);
    return result || '<empty>';
  } catch {
    return String(parsed);
  }
};

const describeResponse = (response: HttpResponse<unknown>): string => {
  const headerNames = response.headers ? Object.keys(response.headers).slice(0, 8).join(',') : '';
  return `HTTP ${response.statusCode}${response.statusMessage ? ` ${response.statusMessage}` : ''}; url=${response.url || '<unknown>'}; headers=${headerNames || '<none>'}; body=${describeBody(response.body)}`;
};

const requestJson = async <T>(
  path: string,
  params: Record<string, unknown>,
  headers: Record<string, string> = {}
): Promise<HttpResponse<T>> => {
  const response = await httpFetch(`${QR_LOGIN_BASE_URL}${path}`, {
    method: 'post',
    headers: {
      Accept: '*/*',
      Origin: QR_LOGIN_BASE_URL,
      Referer: QR_LOGIN_ORIGIN,
      'x-os': 'web',
      'x-channelsource': 'undefined',
      'nm-gcore-status': '1',
      ...(webSession.cookie ? { cookie: webSession.cookie } : {}),
      ...headers,
    },
    form: weapi(params),
  }).promise;

  if (response.statusCode !== 200) {
    throw new Error(`网易云二维码请求失败: HTTP ${response.statusCode}`);
  }
  return response as unknown as HttpResponse<T>;
};

const createChainId = (): string => {
  const deviceId = webSession.sDeviceId?.trim();
  return deviceId
    ? `v1_${deviceId}_web_login_${Date.now()}`
    : `v1_web_qr_login_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/** 获取二维码登录用的 unikey。 */
export const getQrKey = async (): Promise<string> => {
  const response = await requestJson<QrKeyBody>('/weapi/login/qrcode/unikey', {
    type: 1,
    noCheckToken: true,
  });
  const body = findBodyWithCode(response.body, [200]);
  if (!body || typeof body.unikey !== 'string' || !body.unikey) {
    throw new Error(`获取网易云二维码登录 key 失败: ${describeBody(response.body)}`);
  }
  sessions.set(body.unikey, {
    chainId: createChainId(),
    ydDeviceToken: webSession.ydDeviceToken,
    cookie: webSession.cookie,
  });
  return body.unikey;
};

/** 根据 unikey 创建网易云客户端扫码登录二维码。 */
export const createQrCode = async (unikey: string): Promise<QrCreateResponse> => {
  if (!unikey) throw new Error('二维码登录 key 不能为空');
  const session = sessions.get(unikey) || { chainId: createChainId() };
  sessions.set(unikey, session);
  const query = [
    ['codekey', unikey],
    ['chainId', session.chainId],
    ['hdw_device', 'web'],
    ['hdw_appid', 'web'],
    ['hitExp', '1'],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return { code: 200, qrurl: `${QR_LOGIN_BASE_URL}/st/platform/scanlogin?${query}` };
};

/** 查询二维码状态,并在登录成功时返回 Cookie。 */
export const checkQrCode = async (unikey: string): Promise<QrLoginResult> => {
  if (!unikey) throw new Error('二维码登录 key 不能为空');
  const session = sessions.get(unikey) || { chainId: createChainId() };
  const response = await requestJson<QrCheckBody>(
    '/weapi/login/qrcode/client/login',
    {
      type: 1,
      noCheckToken: true,
      key: unikey,
      ...(session.ydDeviceToken ? { ydDeviceToken: session.ydDeviceToken } : {}),
    },
    {
      'x-loginmethod': 'QrCode',
      'x-login-chain-id': session.chainId,
      ...(session.cookie ? { cookie: session.cookie } : {}),
    }
  );
  const body = findBodyWithCode(response.body, [800, 801, 802, 803]);
  if (!body) {
    // Android fetch may occasionally expose a successful poll response with an empty body.
    // This is not a terminal QR state: preserve the QR and try again on the next interval.
    if (response.body === '' || response.body === null || response.body === undefined) {
      return { code: 0, message: '等待二维码状态响应' };
    }
    throw new Error(`网易云二维码响应异常: ${describeResponse(response)}`);
  }
  const code = Number(body.code) as QrCodeStatus;

  const headerCookie = getHeader(response.headers, 'set-cookie');
  const refreshToken = getHeader(response.headers, 'x-refresh-token');
  const rawCookie = [typeof body.cookie === 'string' ? body.cookie : '', headerCookie, refreshToken ? `MUSIC_U=${refreshToken}` : ''].join('; ');
  const cookie = normalizeCookie(rawCookie);
  const messages: Record<QrCodeStatus, string> = {
    800: '二维码已过期',
    801: '等待扫码',
    802: '已扫码,等待确认',
    803: '登录成功',
  };
  if (code === 803) sessions.delete(unikey);
  return { code, message: body.message || body.msg || messages[code], ...(cookie ? { cookie } : {}) };
};

export const getQrLogin = async (): Promise<QrCreateResponse & { unikey: string }> => {
  const unikey = await getQrKey();
  return { unikey, ...(await createQrCode(unikey)) };
};
