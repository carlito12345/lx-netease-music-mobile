package com.lxnetease.music.mobile.spectrum;

/**
 * AudioSession - 通过反射获取 track-player 的音频会话 ID
 * track-player 的 MusicManager.getOrCreateAudioSessionId() 是静态方法,
 * AudioSpectrum 的 Visualizer 用它精确采集播放器自身音频。
 * 未找到(模块未加载)时回退 0(默认会话)。
 */
public class AudioSession {
  private static volatile int cached = 0;

  private AudioSession() {}

  public static synchronized int current() {
    if (cached != 0) return cached;
    try {
      Class<?> cls = Class.forName("com.guichaguri.trackplayer.service.MusicManager");
      java.lang.reflect.Method m = cls.getMethod("getOrCreateAudioSessionId");
      Object r = m.invoke(null);
      if (r instanceof Integer) {
        cached = (Integer) r;
        return cached;
      }
    } catch (Throwable ignored) {
    }
    return 0;
  }
}
