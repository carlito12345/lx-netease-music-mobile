/**
 * StarField - 星河闪烁星云 (Mineradio ShiningStarsVisualizer 移植)
 * 4 层分形迭代, 每层取不同频段驱动空间扭曲/波纹/辉光
 * 音频驱动: 音量加速旋转 + 频谱调制波纹频率 + 辉光增强
 */
import { memo, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import GLShaderView, { type GLShaderViewHandle } from './GLShaderView'
import { useAudioSpectrum } from '@/components/echo/useAudioSpectrum'

const STARFIELD_SOURCE = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec3 uBaseColor;
uniform float uVolume;
uniform vec4 uBands0;
uniform vec4 uBands1;
uniform vec4 uBands2;
uniform vec4 uBands3;
varying vec2 vUv;

vec3 palette(float t, vec3 base) {
    vec3 a = vec3(0.5);
    float bm = max(max(base.r, base.g), base.b + 0.01);
    vec3 b = vec3(0.5) * base / bm;
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

vec2 rotate(vec2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
}

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
    float frac = idx - fi;
    return mix(sampleBands(fi), sampleBands(min(fi + 1.0, 15.0)), frac);
}

void main() {
    vec2 fragCoord = vec2(vUv.x, 1.0 - vUv.y) * uResolution.xy;
    vec2 uv = (fragCoord * 2.0 - uResolution.xy) / uResolution.y;

    // 缓慢旋转, 音频增大时加速
    float rotSpeed = 0.15 + uVolume * 0.015;
    uv = rotate(uv, uTime * rotSpeed);

    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    vec3 base = uBaseColor;

    // 4 层分形迭代
    for (float i = 0.0; i < 4.0; i++) {
        float freq = (i + 0.5) / 4.0;
        float bandVal = getBand(freq);

        // 空间扭曲强度受音频驱动
        float warp = 1.5 + bandVal * 0.3;
        uv = fract(uv * warp) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i * 0.4 + uTime * 0.35, base);

        float waveFreq = 8.0 + bandVal * 6.0;
        d = sin(d * waveFreq + uTime * 0.8) / 8.0;
        d = abs(d);

        float glow = 0.012 + bandVal * 0.008;
        d = pow(glow / d, 1.2);

        finalColor += col * d;
    }

    finalColor *= (0.85 + uVolume * 0.3);

    gl_FragColor = vec4(finalColor, 1.0);
}
`

export interface StarFieldHandle {
  setVolume: (v: number) => void
}

interface Props {
  baseColor?: [number, number, number]
  style?: any
}

const StarField = memo(forwardRef<StarFieldHandle, Props>(({
  baseColor = [0.5, 0.4, 1.0],
  style,
}, ref) => {
  const viewRef = useRef<GLShaderViewHandle>(null)
  const { bins } = useAudioSpectrum()
  const binsRef = useRef<number[]>(new Array(16).fill(0.1))
  if (bins && bins.length >= 16) binsRef.current = bins.slice(0, 16)

  useImperativeHandle(ref, () => ({
    setVolume: (v: number) => viewRef.current?.setVolume(v),
  }), [])

  // 频谱推流
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
      shaderSource={STARFIELD_SOURCE}
      baseColor={baseColor}
      style={style}
    />
  )
}))

export default StarField
