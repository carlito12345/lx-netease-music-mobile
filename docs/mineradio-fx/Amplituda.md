# Amplituda 波形分析移植指南

来源: com.linc.amplituda (Mineradio 内置, libavcodec-amplituda.so)

## 用途
Mineradio 的 ExpandedPlayerScreen (播放器页) 用 Amplituda 生成波形进度条:
- 输入: 音频文件
- 输出: 振幅序列 (时间轴上的音量包络)

## 核心 API (从 smali 还原)

```
Amplituda(context)                     # 构造函数
  .process(uri/file)                   # 处理音频
  .getResult() -> AmplitudaResult      # 同步结果
  # 或 callback: .get(output -> ...)  AmplitudaProcessingOutput

AmplitudaResult:
  - getAmplitudes() -> List<Float>     # 振幅序列 (0-1)
  - getSequence(SequenceFormat)        # 格式化序列 (JSON等)
  - getDuration()                      # 时长 (DurationUnit)
```

AmplitudaProcessingOutput:
  - getAmplitudaResult()               # 成功结果
  - handleAmplitudaProcessingErrors()  # 错误处理

## 在播放器的典型用法 (ExpandedPlayerScreen)

1. 歌曲加载时: loadAmplitudeData() 异步调用 Amplituda
2. 得到振幅序列 → 传给波形 UI 组件
3. UI: Canvas 画波形 (柱状/曲线), 进度由播放时间驱动, 高亮已播放部分

## 移植到 LX Music (RN)

**方案 A - 原生模块**: 
- Amplituda 是纯 Kotlin 库 (GitHub: linc-com/Amplituda), 直接 gradle 依赖
- 包成 RN 原生模块: analyzeAudio(path) -> Promise<float[]>
- RN 端: 波形组件用 skia/svg 画, 进度驱动高亮

**方案 B - 纯 JS 波形**:
- 已有音频文件: 用 JS 解码 (如 react-native 播放器拿 PCM)
- 分窗 RMS: 每 100ms 一个窗口算 RMS → 归一化波形
- 无原生依赖, 精度足够进度条使用

## RN 波形进度条组件示意 (skia)

```tsx
// WaveformBar: 输入 amplitudes: number[], progress: number (0-1)
// 已播放段白色高亮, 未播放灰色
```
