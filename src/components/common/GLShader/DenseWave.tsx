/**
 * DenseWave - 音域地形荧光柱阵 (从头重写)
 * 结构: 音频城市 raymarching + sonic-topography 柱高公式 + 荧光散射
 * 交互: 涟漪(kick/snare/触摸) + 流星(落地炸坑+涟漪)
 * 配置: 金属感(uMetalness) + 荧光(uNeon)
 */
import { memo, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import GLShaderView, { type GLShaderViewHandle } from './GLShaderView'
import { useAudioSpectrum } from '@/components/echo/useAudioSpectrum'

const DENSE_WAVE_SOURCE = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec3 uBaseColor;
uniform float uVolume;
uniform vec4 uBands0;
uniform vec4 uBands1;
uniform vec4 uBands2;
uniform vec4 uBands3;
uniform vec4 uRipples[8];
uniform vec4 uMeteor;
uniform vec4 uCrater;
uniform float uMetalness;
uniform float uNeon;
uniform float uCamH;
uniform float uCamD;
uniform float uCamSpeed;
uniform float uFov;
uniform float uCell;
uniform float uHalfW;
uniform float uHScale;
uniform vec3 uWarmCol;
uniform vec3 uGreenCol;
uniform vec3 uCoolCol;
uniform vec3 uBgCol;
uniform float uPresence;
uniform float uBrilliance;
uniform vec4 uFloating[8];
varying vec2 vUv;

float sampleBands(float fi) {
    float s = clamp(fi, 0.0, 15.0);
    float g = floor(s / 4.0);
    float l = s - g * 4.0;
    vec4 v = mix(mix(uBands0, uBands1, step(1.0, g)),
                 mix(uBands2, uBands3, step(3.0, g)),
                 step(2.0, g));
    return mix(mix(v.x, v.y, step(1.0, l)),
               mix(v.z, v.w, step(3.0, l)),
               step(2.0, l));
}
float getBand(float freq) {
    float idx = clamp(freq, 0.0, 1.0) * 15.0;
    float fi = floor(idx);
    float fr = idx - fi;
    return mix(sampleBands(fi), sampleBands(min(fi + 1.0, 15.0)), fr);
}
float getPitch(float freq) {
    float norm = clamp(freq / 5.0, 0.0, 1.0);
    return getBand(norm) * 0.8;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, vec3(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}
float light(float d, float att) {
    return 1.0 / (1.0 + pow(abs(d * att), 1.5));
}
vec2 rot2d(vec2 v, float a) {
    float ca = cos(a);
    float sa = sin(a);
    return vec2(v.x * ca - v.y * sa, v.x * sa + v.y * ca);
}

// 涟漪(原版 sonic-topography): 返回 vec2(高度, 白色强度)
vec2 rippleAt(vec2 pos2D) {
    float elev = 0.0;
    float whiteAmt = 0.0;
    for (int i = 0; i < 8; i++) {
        vec4 rd = uRipples[i];
        if (rd.w != 0.0) {
            bool white = rd.w < 0.0;
            float strength = abs(rd.w);
            float dist = length(pos2D - rd.xy);
            float ts = rd.z;
            float spd = white ? 18.0 : 13.0;
            float wid = white ? 1.35 : 5.5;
            float fd = white ? 12.0 : 26.0;
            float esc = white ? 1.15 : 3.35;
            float wr = ts * spd;
            float dd = dist - wr;
            float rw = exp(-dd * dd / wid);
            float fad = exp(-wr / fd);
            float lf = 1.0 - smoothstep(2.10, 4.80, ts);
            float rPulse = rw * fad * lf * strength;
            elev += rPulse * esc;
            if (white) { whiteAmt += rPulse; } else { whiteAmt += rPulse * 0.3; }
        }
    }
    return vec2(elev, whiteAmt);
}

void main() {
    vec2 fragCoord = vec2(vUv.x, 1.0 - vUv.y) * uResolution.xy;
    vec2 uv = (2.0 * fragCoord - uResolution.xy) / uResolution.y;
    uv.y = -uv.y;

    float vol = clamp(uVolume, 0.0, 1.0);
    vec3 col = uBgCol;  // 背景色(可调)

    vec3 warmCol = uWarmCol;
    vec3 greenCol = uGreenCol;
    vec3 coolCol = uCoolCol;
    vec3 whiteCol = vec3(0.95, 1.0, 1.0);

    // 相机(可调): 高度/距离/旋转速度/视场
    vec3 ro = vec3(0.0, uCamH, uCamD);
    vec2 rotXZ = rot2d(vec2(ro.x, ro.z), uTime * uCamSpeed);
    ro = vec3(rotXZ.x, ro.y, rotXZ.y);

    vec3 f = normalize(-ro);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 r = normalize(cross(worldUp, f));
    vec3 u = cross(f, r);
    vec3 rd = normalize(f + uv.x * r * uFov + uv.y * u * uFov);  // 视场可调

    float t = 0.0;
    float cell = uCell;
    float halfW = uHalfW;
    bool hitDone = false;

    for (float i = 0.0; i < 26.0; i += 1.0) {
        vec3 p = ro + t * rd;
        if (hitDone) { break; }

        vec2 cen = floor(p.xz / cell) + 0.5;
        vec3 id = abs(vec3(cen.x, 0.0, cen.y));
        float d = length(id) * cell;
        float rnd = hash13(vec3(cen.x, 0.0, cen.y));

        float freq = smoothstep(0.0, 20.0, d) * 3.0 + rnd * 2.0;
        float pitch = getPitch(freq);
        float v = vol * smoothstep(2.0, 0.0, d);

        // 柱高: 距离 + 频谱 + 音量 + 随机参差 (hScale 可调)
        float h = (d * 0.06 + pitch * 1.1 + v * 0.8 + 0.22) * uHScale;
        h += (rnd - 0.5) * 0.15;
        vec2 rip = rippleAt(cen * cell);
        h += rip.x * 0.15;
        if (uCrater.z > 0.0 && uCrater.z < 1.8) {
            float cd = length(cen * cell - uCrater.xy);
            float cf = 1.0 - uCrater.z / 1.8;
            h -= exp(-cd * cd / 0.7) * uCrater.w * cf;
        }

        // 柱色: 频率分色 + 原版 warm/cool 分区(距离混合)
        vec3 baseCol = mix(warmCol, greenCol, clamp(freq / 3.0, 0.0, 1.0));
        baseCol = mix(baseCol, coolCol, clamp((freq - 1.5) / 3.0, 0.0, 1.0));
        float warmBlend = smoothstep(0.0, 1.0, 0.5 - d / 20.0);
        vec3 zoneCore = mix(coolCol, warmCol, warmBlend);
        float distFade = 1.0 - smoothstep(30.0, 60.0, d);
        vec3 targetGlow = mix(zoneCore, baseCol, rnd * 0.5);

        float me = sdBox(
            p - vec3(cen.x * cell, -50.0, cen.y * cell),
            vec3(halfW, 50.0 + h, halfW)
        ) - 0.015;

        // ===== 荧光散射(独立层, 不依赖命中): 接近柱体即扩散光晕 =====
        // 范围更大(霓虹光晕扩散), 距离衰减柔和
        float neonGlow = exp(-me * 5.0) * uNeon;
        col += baseCol * neonGlow * 0.35;

        float hit = 1.0 - smoothstep(0.0, 0.02, me);
        if (hit > 0.0) {
            float relY = p.y / max(h, 0.01);
            float normElev = clamp(h / 2.6, 0.0, 1.0);
            float isTop = smoothstep(0.82, 1.0, relY);

            // 光照(音频城市模型)
            float idShade = cos(d) + 1.5;
            float freqLight = pitch * d * 0.04 + v * 0.4 + 0.12;
            float soft = light(me, 20.0);
            float volBoost = 1.0 + vol * 0.8;

            vec3 pillarCol = baseCol * idShade * freqLight * soft * volBoost * 0.5;
            // 顶面发光(金属感配置)
            pillarCol += whiteCol * isTop * normElev * 0.3 * uMetalness;
            // 原版: 顶面闪烁(随机点 + presence 驱动)
            float twinkleDist = smoothstep(45.0, 15.0, d);
            float twinkleMul = mix(twinkleDist, 1.0, smoothstep(0.01, 0.1, normElev));
            if (fract(rnd * 31.0) > 0.95 && normElev < 0.1) {
                pillarCol += whiteCol * uPresence * 1.6 * twinkleMul;
            }
            // 原版: presence 闪光(柱顶)
            float flashChance = smoothstep(0.3, 1.0, uPresence);
            if (fract(rnd * 53.0) > 0.98 - flashChance * 0.1) {
                float flashSync = sin(uTime * 40.0 + rnd * 100.0) * 0.5 + 0.5;
                pillarCol += mix(whiteCol, vec3(0.5, 1.0, 1.0), rnd) * flashSync * uPresence * twinkleMul;
            }
            // 原版: 侧面边缘辉光(从顶向下衰减)
            float distFromTop = 1.0 - clamp(relY, 0.0, 1.0);
            float sideGlow = smoothstep(0.17, 0.0, distFromTop) * normElev;
            pillarCol += targetGlow * sideGlow * 1.2;
            // 涟漪顶部白色高光(随涟漪消散衰减)
            pillarCol += whiteCol * rip.y * 0.8 * (0.4 + 0.6 * isTop);

            col += pillarCol * hit;
            hitDone = true;
        }

        t += max(me, 0.045);
        if (t > 38.0) { break; }
    }

    // 地面光晕(原版: 底部向中心渐变辉光)
    {
        vec3 groundP = ro + rd * t;
        float groundDist = length(groundP.xz);
        float groundFade = 1.0 - smoothstep(8.0, 55.0, groundDist);
        float horizonGlow = exp(-abs(groundP.y + 0.5) * 1.2);
        vec3 groundGlowCol = mix(warmCol, coolCol, 0.5 + groundDist / 60.0);
        col += groundGlowCol * groundFade * horizonGlow * 0.35;
    }

    // 漂浮方块(billboard 光点, 性能友好; 位置正弦浮动 + 脉动缩放)
    for (int i = 0; i < 8; i++) {
        vec4 fb = uFloating[i];
        if (fb.w > 0.0) {
            float phase = float(i) * 1.7;
            vec3 fPos = vec3(
                fb.x + sin(uTime * 0.4 + phase) * 0.6,
                fb.y + sin(uTime * 0.7 + phase * 1.3) * 0.4,
                fb.z + cos(uTime * 0.5 + phase) * 0.6
            );
            vec3 fp = fPos - ro;
            float fT = dot(fp, rd);
            vec3 fProj = ro + rd * fT - fPos;
            float fDist = length(fProj);
            float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + phase);
            float fGlow = exp(-fDist * fDist / (fb.w * fb.w * pulse)) * 0.7;
            col += mix(warmCol, coolCol, 0.5 + 0.3 * sin(uTime * 0.3 + phase)) * fGlow;
        }
    }

    // 流星
    vec4 met = uMeteor;
    if (met.w > 0.0 && met.w < 3.0) {
        vec3 mp2 = vec3(met.x, met.y - met.w * 20.0, met.z) - ro;
        float mT = dot(mp2, rd);
        vec3 mProj = ro + rd * mT - (vec3(met.x, met.y - met.w * 20.0, met.z));
        float mDist = length(mProj);
        float mGlow = exp(-mDist * mDist * 3.0);
        float mTrail = exp(-mDist * mDist * 1.2) * smoothstep(0.0, 0.8, met.w);
        col += whiteCol * (mGlow * 1.8 + mTrail * 1.0);
    }

    // 天空渐暗(减轻, 保留荧光)
    col = mix(col, vec3(0.015, 0.01, 0.035), smoothstep(0.5, 0.95, uv.y) * 0.4);
    // 轻 tone mapping(仅防极端过曝)
    col = clamp(col / (1.0 + col * 0.2), 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
`

export interface DenseWaveHandle {
  addRipple: (x: number, z: number, strength?: number) => void
  spawnMeteor: (strength: number) => void
}

interface Props {
  baseColor?: [number, number, number]
  metalness?: number   // 金属感 0-1
  neon?: number        // 荧光 0-1
  params?: import('./GLShaderView').DenseParams  // 可调参数
  floating?: number[]  // 漂浮方块 [x,y,z,size]*8
  style?: any
}

const DenseWave = memo(forwardRef<DenseWaveHandle, Props>(({
  baseColor = [0.5, 0.3, 1.2],
  metalness = 0.8,
  neon = 0.5,
  params,
  floating,
  style,
}, ref) => {
  const viewRef = useRef<GLShaderViewHandle>(null)
  const { bins } = useAudioSpectrum()
  const binsRef = useRef<number[]>(new Array(16).fill(0.1))
  if (bins && bins.length >= 16) binsRef.current = bins.slice(0, 16)

  // 漂浮方块默认数据(环形分布: 半径 4-12, 高度 0.5-3)
  const defaultFloating = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + i * 0.7
      const r = 4 + (i % 5) * 2
      arr.push(
        Math.cos(a) * r,
        0.5 + ((i * 13) % 8) * 0.35,
        Math.sin(a) * r,
        0.35 + ((i * 7) % 5) * 0.12,
      )
    }
    return arr
  }, [])

  // 触摸涟漪(原版 pointerRipple 强度 1.2)
  const addRipple = useCallback((screenX: number, screenY: number) => {
    const wx = (screenX - 0.5) * 9.0
    const wz = (screenY - 0.5) * 9.0
    viewRef.current?.addRipple(wx, wz, 1.2)
  }, [])

  const spawnMeteor = useCallback((strength: number) => {
    viewRef.current?.spawnMeteor(strength)
  }, [])

  useImperativeHandle(ref, () => ({
    addRipple: (x: number, z: number, strength?: number) => {
      viewRef.current?.addRipple(x, z, strength ?? 1.2)
    },
    spawnMeteor,
  }), [spawnMeteor])

  // 音频触发(原版 updateAudioTriggers)
  useEffect(() => {
    let raf = 0
    let lastKick = false
    let lastSnare = false
    let lastMeteorAt = -999
    const push = () => {
      const bands = binsRef.current
      viewRef.current?.setBands(bands)
      // presence/brilliance(高频段驱动顶面闪光)
      viewRef.current?.setPresence(Math.min(bands[7] * 0.7 + bands[8] * 0.3, 1.0))
      viewRef.current?.setBrilliance(Math.min(bands[9] + bands[10] * 0.5, 1.0))
      const time = performance.now() / 1000

      const kickEnv = Math.min(bands[0] * 0.7 + bands[1] * 0.3, 1.0)
      const presence = Math.min(bands[7] + bands[8] * 0.5, 1.0)
      const brilliance = Math.min(bands[9] + bands[10] * 0.5, 1.0)

      // kick → 青色涟漪
      const kickActive = kickEnv > 0.58
      if (kickActive && !lastKick) {
        const a = Math.random() * Math.PI * 2
        const dist = Math.random() * 20
        viewRef.current?.addRipple(Math.cos(a) * dist, Math.sin(a) * dist, Math.min(kickEnv * 2.0, 3.0))
      }
      lastKick = kickEnv > 0.32

      // snare → 白色涟漪
      const snareActive = presence > 0.52 || brilliance > 0.56
      if (snareActive && !lastSnare && Math.random() < 0.55) {
        const a2 = Math.random() * Math.PI * 2
        const d2 = 10 + Math.random() * 35
        viewRef.current?.addRipple(Math.cos(a2) * d2, Math.sin(a2) * d2, -Math.min((presence + brilliance) * 1.2, 3.0))
      }
      lastSnare = presence > 0.38 || brilliance > 0.42

      // 流星: kick>0.62, 4.5%, 0.55s 冷却
      if (kickEnv > 0.62 && Math.random() < 0.045 && (time - lastMeteorAt) > 0.55) {
        lastMeteorAt = time
        viewRef.current?.spawnMeteor(Math.min(Math.max(kickEnv, 0.28), 0.9))
      }

      raf = requestAnimationFrame(push)
    }
    raf = requestAnimationFrame(push)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <GLShaderView
      ref={viewRef}
      shaderSource={DENSE_WAVE_SOURCE}
      baseColor={baseColor}
      metalness={metalness}
      neon={neon}
      params={{ ...params, floating: floating ?? defaultFloating }}
      style={style}
    />
  )
}))

export default DenseWave
