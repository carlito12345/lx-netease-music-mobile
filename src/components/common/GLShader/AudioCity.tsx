/**
 * AudioCity - 3D 音频城市 (原生 GLES20 渲染, Mineradio 同架构)
 * 频谱驱动柱体律动 + 自动 360° 旋转
 */
import { memo, useRef, useEffect, useCallback } from 'react'
import GLShaderView, { type GLShaderViewHandle } from './GLShaderView'
import { useAudioSpectrum } from '@/components/echo/useAudioSpectrum'

// GLSL ES (与提取的 AudioCityVisualizer 一致)
const AUDIO_CITY_SOURCE = `
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

void main() {
    // vUv 左下原点 → 左上原点 → uv.y 翻转(Y 向上, 匹配相机计算)
    vec2 fragCoord = vec2(vUv.x, 1.0 - vUv.y) * uResolution.xy;
    vec2 uv = (2.0 * fragCoord - uResolution.xy) / uResolution.y;
    uv.y = -uv.y;

    vec3 col = vec3(0.1, 0.0, 0.14);
    float vol = uVolume;

    vec3 ro = vec3(0.0, 4.0, 10.0) * (1.0 + vol * 0.3);
    vec2 rotXZ = rot2d(vec2(ro.x, ro.z), uTime * 0.15);
    ro = vec3(rotXZ.x, ro.y, rotXZ.y);

    vec3 f = normalize(-ro);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 r = normalize(cross(worldUp, f));
    vec3 u = cross(f, r);
    vec3 rd = normalize(f + uv.x * r + uv.y * u);

    vec3 warmCol = vec3(0.8, 0.2, 0.4);
    vec3 greenCol = vec3(0.0, 1.0, 0.0);
    vec3 coolCol = vec3(0.5, 0.3, 1.2);

    float t = 0.0;
    for (float i = 0.0; i < 25.0; i += 1.0) {
        vec3 p = ro + t * rd;

        vec2 cen = floor(p.xz) + 0.5;
        vec3 id = abs(vec3(cen.x, 0.0, cen.y));
        float d = length(id);

        float freq = smoothstep(0.0, 20.0, d) * 3.0 + hash13(id) * 2.0;
        float pitch = getPitch(freq);

        float v = vol * smoothstep(2.0, 0.0, d);
        float h = d * 0.15 + pitch * 1.5 + v * 1.0 + 0.3;

        float me = sdBox(
            p - vec3(cen.x, -50.0, cen.y),
            vec3(0.25, 50.0 + h, 0.25)
        ) - 0.03;

        vec3 baseCol = mix(
            mix(warmCol, greenCol, min(v * 2.0, 1.0)),
            coolCol,
            smoothstep(10.0, 30.0, d)
        );

        col += baseCol
             * (cos(id) + 1.5)
             * (pitch * d * 0.04 + v * 0.4 + 0.12)
             * light(me, 20.0)
             * (1.0 + vol * 0.8)
             * 0.5;

        t += max(me, 0.02);
        if (t > 40.0) { break; }
    }

    gl_FragColor = vec4(col, 1.0);
}
`

interface Props {
  baseColor?: [number, number, number]
  style?: any
}

const AudioCity = memo(({ baseColor = [0.8, 0.2, 0.4], style }: Props) => {
  const ref = useRef<GLShaderViewHandle>(null)
  const { bins } = useAudioSpectrum()
  const binsRef = useRef<number[]>(new Array(16).fill(0.1))
  if (bins && bins.length >= 16) binsRef.current = bins.slice(0, 16)

  useEffect(() => {
    let raf = 0
    const push = () => {
      ref.current?.setBands(binsRef.current)
      raf = requestAnimationFrame(push)
    }
    raf = requestAnimationFrame(push)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <GLShaderView
      ref={ref}
      shaderSource={AUDIO_CITY_SOURCE}
      baseColor={baseColor}
      style={style}
    />
  )
})

export default AudioCity
