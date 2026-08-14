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

if (changed) console.log('[patchTrackPlayerFfmpeg] 补丁完成')
else console.log('[patchTrackPlayerFfmpeg] 无变更')
