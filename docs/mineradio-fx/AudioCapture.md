# AudioCapture 频谱采集移植指南

来源: com.mineradio.app.audio.AudioCapture (AudioCapture.kt)
提取自 smali, 算法完整还原

## 常量

| 常量 | 值 | 说明 |
|------|-----|------|
| SAMPLE_RATE | 44100 | 采样率 |
| FFT_SIZE | 1024 | FFT 窗口 |
| OUTPUT_BINS | 64 | 输出频段数 |
| ANALYSER_SMOOTHING | 0.3 | 平滑系数 |
| BIN_GAIN | 1.8 | 频段增益 |
| SILENT_THRESHOLD | 30 | 静音帧阈值 |
| NOISE_FLOOR_LEARN_RATE | 0.002 | 噪声地板学习率 |
| NOISE_FLOOR_DECAY_RATE | 0.05 | 噪声地板衰减率 |
| NOISE_SUBTRACTION_MARGIN | 1.5 | 降噪余量 |
| MIC_ENERGY_THRESHOLD | 0.008 | 麦克风能量阈值 |
| MIC_GAIN | 2.5 | 麦克风增益 |

## 处理管线 (processVisualizerFft)

1. **输入**: Visualizer.OnDataCaptureListener 的 FFT 字节数组 [B + 采样率 int
2. **解析**: captureSize/2 = numBins; 每 bin 取实部 data[2*i] 和虚部 data[2*i+1]
3. **幅度**: mag[i] = sqrt(re*re + im*im)
4. **归一化**: 记录 rawMax/rawMin (999/0), 幅度归一化到 0-1
5. **dB 转换**: 20*log10(mag) 压缩动态范围
6. **降噪**: 噪声地板学习 (noiseFloor *= (1-learnRate)), 减去噪声*margin
7. **重采样**: resampleToBins(mag, 64) 线性插值到 64 bins
8. **平滑**: smoothed = lerp(smoothed, current, 0.3) (LERP_DT)
9. **增益**: bin * BIN_GAIN(1.8), clamp 0-1
10. **输出**: listener.onSpectrum(float[64])

## FFT 实现 (fft([F[F)V)
- 自实现 radix-2 FFT: 输入实部+虚部数组, Math.cos/sin 旋转因子
- 86 指令, 支持任意 2 的幂

## 双源策略

```
start(source):
  if source == "mic": startMic()  # AudioRecord 麦克风
  else: 
    if startVisualizer() 失败: # Visualizer 需要 RECORD_AUDIO 权限或会话
      log "Visualizer 启动失败,自动回退到麦克风"
      startMic()
```

- Visualizer: getCaptureSizeRange() → min(max, 期望值), setCaptureSize, setDataCaptureListener
- 全零检测: 连续 30 帧全零 → onVisualizerSilent 回调 (MIUI 兼容)

## 移植到 RN (react-native)

**方案 A - 原生模块** (推荐, 性能最好):
1. 用上面算法写 Kotlin 类 AudioSpectrum
2. 暴露: start()/stop()/setListener
3. RN bridge: NativeEventEmitter 推送频谱数组
4. JS 端: 接数组 → 驱动 skia/svg 可视化

**方案 B - 纯 JS**:
- 用 react-native-sound 或播放器内部 PCM 数据
- JS FFT (如 fft.js) + 相同管线 (重采样/平滑/增益)
- 性能略差, 但无原生代码

## RN 端使用示例

```ts
// 原生模块 (方案A)
import { NativeModules, NativeEventEmitter } from 'react-native'
const { AudioSpectrum } = NativeModules
const emitter = new NativeEventEmitter(AudioSpectrum)

emitter.addListener('onSpectrum', (bins: number[]) => {
  // bins: Float64Array 64 个 0-1 值
  spectrumRef.current = bins
})

AudioSpectrum.start() // 默认 system 源
// AudioSpectrum.start('mic') // 麦克风源
AudioSpectrum.stop()
```
