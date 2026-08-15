/**
 * patchTrackPlayerFfmpeg - 给 react-native-track-player 打 FFmpeg 解码补丁
 * 在 npm install 后自动执行(postinstall):
 *   1. android/build.gradle 加 Jellyfin 预编译 ffmpeg 解码器依赖(含 arm64 .so)
 *   2. MusicManager.java 启用扩展渲染器(原生不支持的格式自动降级 FFmpeg)
 * 幂等: 已打补丁则跳过
 */
const fs = require('fs')
const path = require('path')

const buildGradle = path.join(__dirname, 'node_modules/react-native-track-player/android/build.gradle')
const musicManager = path.join(__dirname, 'node_modules/react-native-track-player/android/src/main/java/com/guichaguri/trackplayer/service/MusicManager.java')

let changed = false

// 1. build.gradle 依赖
try {
  let str = fs.readFileSync(buildGradle, 'utf8')
  if (str.includes('media3-ffmpeg-decoder')) {
    console.log('[patchTrackPlayerFfmpeg] build.gradle 已有 ffmpeg 依赖, 跳过')
  } else {
    const target = 'implementation "androidx.media3:media3-exoplayer:1.8.0"'
    if (str.includes(target)) {
      str = str.replace(target, target + '\n\n    // LX: FFmpeg 扩展解码器(ape/dsd/flac 等兜底, 含 arm64 .so)\n    implementation "org.jellyfin.media3:media3-ffmpeg-decoder:1.8.0+1"')
      fs.writeFileSync(buildGradle, str, 'utf8')
      console.log('[patchTrackPlayerFfmpeg] build.gradle 已加 ffmpeg 依赖')
      changed = true
    } else {
      console.error('[patchTrackPlayerFfmpeg] 未找到 media3-exoplayer 依赖锚点, 需手动检查')
    }
  }
} catch (e) {
  console.error('[patchTrackPlayerFfmpeg] build.gradle 补丁失败:', e.message)
}

// 2. MusicManager 启用扩展渲染器
try {
  let str = fs.readFileSync(musicManager, 'utf8')
  if (str.includes('setExtensionRendererMode')) {
    console.log('[patchTrackPlayerFfmpeg] MusicManager 已有扩展渲染器, 跳过')
  } else {
    const target = 'DefaultRenderersFactory renderersFactory = new DefaultRenderersFactory(service);'
    if (str.includes(target)) {
      str = str.replace(target, target + '\n        // LX: 启用 FFmpeg 扩展解码器(原生不支持的格式自动降级)\n        renderersFactory.setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER);')
      fs.writeFileSync(musicManager, str, 'utf8')
      console.log('[patchTrackPlayerFfmpeg] MusicManager 已启用扩展渲染器')
      changed = true
    } else {
      console.error('[patchTrackPlayerFfmpeg] 未找到 DefaultRenderersFactory 锚点, 需手动检查')
    }
  }
} catch (e) {
  console.error('[patchTrackPlayerFfmpeg] MusicManager 补丁失败:', e.message)
}

// 3. MusicManager 音频会话补丁(频谱采集依赖: 不设会话 AudioSpectrum 采不到 → 特效不律动)
try {
  let str = fs.readFileSync(musicManager, 'utf8')
  if (str.includes('getOrCreateAudioSessionId')) {
    console.log('[patchTrackPlayerFfmpeg] MusicManager 已有音频会话补丁, 跳过')
  } else {
    const patches = [
      // 3a. 构造器初始化
      {
        from: 'public MusicManager(MusicService service) {',
        to: 'public MusicManager(MusicService service) {\n        initAudioSessionId(service); // LX 补丁: 初始化音频会话供频谱采集',
      },
      // 3b. ExoPlayer 构建后设置会话
      {
        from: 'player.setAudioSessionId(',
        to: 'player.setAudioSessionId(',  // 占位, 下面用真锚点
      },
    ]
    // 3b 用真实锚点: ExoPlayer.Builder 链式构建结束(.build();)之后插入
    const wakeAnchor = '.setWakeMode(WAKE_MODE_NONE)'
    if (str.includes(wakeAnchor)) {
      // 找到 setWakeMode 行末尾, 在其后的 .build(); 之后插入
      const buildAnchor = '.build();'
      const wakeIdx = str.indexOf(wakeAnchor)
      const buildIdx = str.indexOf(buildAnchor, wakeIdx)
      if (buildIdx > wakeIdx) {
        const insertAt = buildIdx + buildAnchor.length
        str = str.slice(0, insertAt) + '\n        // LX 补丁: 显式设置音频会话, 供 AudioSpectrum 频谱精确采集\n        player.setAudioSessionId(getOrCreateAudioSessionId());' + str.slice(insertAt)
      } else {
        console.error('[patchTrackPlayerFfmpeg] 未找到 .build(); 锚点(音频会话补丁 3b 失败)')
      }
    } else {
      console.error('[patchTrackPlayerFfmpeg] 未找到 setWakeMode 锚点(音频会话补丁 3b 失败)')
    }
    if (str.includes('public MusicManager(MusicService service) {')) {
      str = str.replace('public MusicManager(MusicService service) {', 'public MusicManager(MusicService service) {\n        initAudioSessionId(service); // LX 补丁: 初始化音频会话供频谱采集')
    }
    // 3c. 静态方法(文件末尾类闭合前)
    if (!str.includes('lxAudioSessionId')) {
      const lastBrace = str.lastIndexOf('}')
      if (lastBrace > 0) {
        const methods = `\n  private static volatile int lxAudioSessionId = 0;\n  private static volatile android.content.Context lxAppContext = null;\n  public static synchronized void initAudioSessionId(android.content.Context ctx) {\n    if (lxAppContext == null) lxAppContext = ctx.getApplicationContext();\n  }\n  public static synchronized int getOrCreateAudioSessionId() {\n    if (lxAudioSessionId == 0 && lxAppContext != null) {\n      android.media.AudioManager am = (android.media.AudioManager) lxAppContext.getSystemService(android.content.Context.AUDIO_SERVICE);\n      if (am != null) lxAudioSessionId = am.generateAudioSessionId();\n    }\n    return lxAudioSessionId;\n  }`
        str = str.slice(0, lastBrace) + methods + str.slice(lastBrace)
      }
    }
    fs.writeFileSync(musicManager, str, 'utf8')
    console.log('[patchTrackPlayerFfmpeg] MusicManager 音频会话补丁已打')
    changed = true
  }
} catch (e) {
  console.error('[patchTrackPlayerFfmpeg] 音频会话补丁失败:', e.message)
}

if (changed) console.log('[patchTrackPlayerFfmpeg] 补丁完成')
else console.log('[patchTrackPlayerFfmpeg] 无变更')
