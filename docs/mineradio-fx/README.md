# Mineradio 特效提取文档

来源: Mineradio.apk v2.1.0.0 (com.mineradio.app) - 动态壁纸+音乐应用
提取日期: 2026-08-13
提取工具: MT MCP APK 分析 (workspace kokw6az7)

## 应用架构

- **LWService** (动态壁纸服务, 独立进程 :wallpaper)
  - NativeSceneWallpaperEngine (libscenejni.so 41MB 原生场景引擎, 音频+传感器驱动)
  - GLES20/30WallpaperRenderer (自绘 GL 渲染器)
  - PetWallpaperEngine / Live2DPetView (Live2D 宠物, liblive2d_pet.so + CubismCore)
  - WebWallpaperEngine / VideoMpkgWallpaperEngine (WebView/视频壁纸)
- **Amplituda** (libavcodec-amplituda.so): 离线音频波形/频谱分析 (播放器波形进度条)
- **Node.js 运行时** (libnode.so 49MB): mpkg 脚本壁纸
- **MediaPipe** (hand_landmarker.task 7.8MB): 手势识别控制
- **UI 特效**: Compose + RuntimeShader (AGSL) + android.media.audiofx.Visualizer

## 特效清单

### 1. 音频实时频谱采集 (AudioCapture.kt)
类: com.mineradio.app.audio.AudioCapture
- 双源: Visualizer (系统音频) + AudioRecord (麦克风回退)
- 参数: SAMPLE_RATE=44100, FFT_SIZE=1024, OUTPUT_BINS=64
- 算法: Visualizer FFT 字节 → 幅度 → dB → resample 到 64 bins → 平滑(0.3) → 增益(1.8)
- 输出: SpectrumListener.onSpectrum(float[64]) (0-1 归一化)
- 特性: 噪声地板学习(0.002)、静音检测(30帧)、MIUI 全零回退
- 文件: AudioCapture.md

### 2. 音频城市可视化 (AudioCityVisualizer.kt) ⭐
GLSL AGSL RuntimeShader - 3D 城市柱体 raymarching
- uniforms: u_time/u_resolution/u_baseColor/u_volume/u_bands0-3(16频段)
- 25 步 raymarching, 柱体高度随 FFT 频段律动, 三色渐变(粉红→绿→紫蓝)
- 相机环绕旋转, 音量膨胀效果
- 文件: AudioCityVisualizer.frag

### 3. 闪烁星星可视化 (ShiningStarsVisualizer.kt) ⭐
GLSL AGSL RuntimeShader - 4层分形星云
- 4 层分形迭代, 每层取不同频段驱动空间扭曲/波纹频率/辉光
- palette 函数随径向距离+时间变色, 融入封面色
- 旋转速度随音量加速
- 文件: ShiningStarsVisualizer.frag

### 4. 效果渲染器 (EffectShaderRenderer.kt) ⭐
GLES20 全屏 shader 渲染器 - 三层 simplex noise 涟漪
- uniforms: uAnimTime/uMusicLevel/uBeat/uMidFreq/uHighFreq/uColor/uIsDarkMode
- 3 层 snoise 叠加涟漪, 色相旋转, 暗/亮双模式
- 通用 GLES 渲染器: 可直接用于任意 View
- 文件: EffectShaderRenderer.frag + Renderer.java (移植骨架)

### 5. 粒子/渐变材质 (自研引擎, assets/materials/)
- 粒子: beam光束/bubbles气泡/fire火焰/fog雾/halo光晕/light镜头光晕+体积光/magic魔法符文/drop水滴
- 渐变: ferro_fluid铁磁流体/fire火焰/ice冰/iridescent彩虹/neon霓虹/rainbow彩虹/swamp沼泽/toon卡通
- 格式: .tex (rgba8888 原始) + .tex-json (format/clampuvs/nomip) + .json (passes/shader/blending/textures)
- blending: additive/translucent, shader: genericparticle

### 6. Amplituda 离线波形 (播放器波形进度条)
类: com.linc.amplituda.Amplituda
- 输入音频文件 → 输出振幅序列 (AmplitudaResult)
- 用途: ExpandedPlayerScreen 播放器页波形进度条
- 文件: Amplituda.md

## 可移植性评估 (到 LX Music RN 播放器)

| 特效 | 移植难度 | 方式 |
|------|---------|------|
| AudioCityVisualizer | 中 | AGSL → skia RuntimeEffect (react-native-skia) |
| ShiningStarsVisualizer | 中 | AGSL → skia RuntimeEffect |
| EffectShaderRenderer | 低 | GLES 全屏渲染器, 包成 RN 原生 View |
| AudioCapture FFT | 低 | 原生模块 (Java/Kotlin) + RN bridge |
| 粒子材质 | 中 | .tex → 解码为位图, skia 粒子模拟 |
| Amplituda 波形 | 中 | 原生模块 or 纯 JS FFT |

## 关键文件索引
- AudioCapture.md - 频谱采集移植指南
- AudioCityVisualizer.frag - 城市特效 GLSL
- ShiningStarsVisualizer.frag - 星云特效 GLSL
- EffectShaderRenderer.frag - 涟漪特效 GLSL
- Amplituda.md - 波形分析移植指南

### 7. 液态铬交互背景 (LiquidChrome) ⭐⭐ 可触摸
类: LiquidChromeGLSurfaceView + LiquidChromeRenderer (LiquidChromeBackground.kt)
- GLSurfaceView 全屏渲染器, uniforms: uTime/uResolution/uBaseColor/uAmplitude/uFrequencyX/uFrequencyY/uMouse
- 触摸交互: onTouchEvent → updateMouse(x,y) → uMouse 驱动涟漪波纹 + 波形位移
- 9 邻域采样抗锯齿
- 文件: LiquidChrome.frag + LiquidChromeRenderer.java (移植骨架)

### 8. 触摸水花 (SplashCursor) - 可触摸
类: TouchTracker (SplashCursorEffect.kt) - Kotlin Flow 触摸事件流 → 特效层
