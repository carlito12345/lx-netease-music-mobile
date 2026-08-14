/**
 * LiquidChrome - 液态铬交互背景 (原生 GLES20 渲染, Mineradio 同架构)
 * 触摸涟漪交互 (原生 onTouchEvent 处理)
 */
import { memo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import GLShaderView, { type GLShaderViewHandle } from './GLShaderView'
import { useAudioSpectrum } from '@/components/echo/useAudioSpectrum'

// GLSL ES (与提取的 Mineradio LiquidChrome 一致, 加频谱支持)
const LIQUID_SOURCE = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec3 uBaseColor;
uniform float uAmplitude;
uniform float uFrequencyX;
uniform float uFrequencyY;
uniform vec2 uMouse;
uniform float uVolume;
uniform vec4 uBands0;
uniform vec4 uBands1;
uniform vec4 uBands2;
uniform vec4 uBands3;
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

vec4 renderImage(vec2 uvCoord) {
    // 统一左上原点: uvCoord 是 vUv(左下), uMouse 是屏幕(左上)
    vec2 screenPos = vec2(uvCoord.x, 1.0 - uvCoord.y);  // 左上原点 0-1
    vec2 mousePos = vec2(uMouse.x, uMouse.y);            // 已是左上原点 0-1

    vec2 fragCoord = screenPos * uResolution.xy;
    vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

    for (float i = 1.0; i < 10.0; i++) {
        uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + mousePos.x * 3.14159);
        uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + mousePos.y * 3.14159);
    }

    vec2 diff = (screenPos - mousePos);
    float dist = length(diff);
    // 涟漪: 范围更大, 幅度更强
    float falloff = exp(-dist * 8.0);
    float ripple = sin(12.0 * dist - uTime * 3.0) * 0.22 * falloff;
    uv += (diff / (dist + 0.0001)) * ripple;

    // 触摸点高光: 触点周围柔和提亮
    float touchGlow = exp(-dist * 12.0);

    // 频谱调制亮度
    float band = getBand(0.3);
    vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
    color *= 0.8 + uVolume * 0.6 + band * 0.4;
    color += vec3(1.0, 1.0, 0.9) * touchGlow * 0.25;
    return vec4(color, 0.55);  // 半透明, 透出下层
}

void main() {
    // 屏幕归一化坐标(与 uMouse 一致): vUv 是视图坐标, 视图可能小于屏幕
    vec2 screenUV = vUv;  // 视图填满屏幕时两者一致
    vec4 col = vec4(0.0);
    int samples = 0;
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
            col += renderImage(screenUV + offset);
            samples++;
        }
    }
    gl_FragColor = col / float(samples);

    // 触摸光斑: 实心发光圆跟随手指(明显可见)
    vec2 touchPos = vec2(uMouse.x, 1.0 - uMouse.y);  // vUv 坐标系(左下)
    float td = length(vUv - touchPos);
    float glow = exp(-td * 25.0);
    vec4 touchLight = vec4(1.0, 1.0, 0.95, 1.0) * glow * 0.35;
    gl_FragColor = gl_FragColor + touchLight * 0.35;
}
`

interface Props {
  baseColor?: [number, number, number]
  amplitude?: number
  frequencyX?: number
  frequencyY?: number
  style?: any
}

export interface LiquidChromeHandle {
  setMouse: (x: number, y: number) => void
}

const LiquidChrome = memo(forwardRef<LiquidChromeHandle, Props>(({
  baseColor = [0.3, 0.5, 0.9],
  amplitude = 0.06,
  frequencyX = 2.0,
  frequencyY = 1.5,
  style,
}, ref) => {
  const viewRef = useRef<GLShaderViewHandle>(null)
  useImperativeHandle(ref, () => ({
    setMouse: (x: number, y: number) => viewRef.current?.setMouse(x, y),
  }))
  const { bins } = useAudioSpectrum()
  const binsRef = useRef<number[]>(new Array(16).fill(0.1))
  if (bins && bins.length >= 16) {
    // 64 bins → 16 频段(取前16个低中频为主)
    binsRef.current = bins.slice(0, 16)
  }

  // 频谱推送 (rAF 限频)
  useEffect(() => {
    let raf = 0
    const push = () => {
      viewRef.current?.setBands(binsRef.current)
      raf = requestAnimationFrame(push)
    }
    raf = requestAnimationFrame(push)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <GLShaderView
      ref={viewRef}
      shaderSource={LIQUID_SOURCE}
      interactive={false}  // 触摸由外部(JS PanResponder)捕获, 不拦截下层
      baseColor={baseColor}
      amplitude={amplitude}
      frequencyX={frequencyX}
      frequencyY={frequencyY}
      style={style}
    />
  )
}))

export default LiquidChrome
