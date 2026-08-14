package com.lxnetease.music.mobile.spectrum;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.audiofx.Visualizer;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nullable;

/**
 * AudioSpectrumModule - 实时音频频谱采集 (移植自 Mineradio AudioCapture)
 * Visualizer 系统音频 FFT → 64 bins 归一化频谱 → 事件推送
 * 算法: FFT_SIZE=1024, OUTPUT_BINS=64, 平滑 0.3, 增益 1.8
 */
public class AudioSpectrumModule extends ReactContextBaseJavaModule {

  public static final String NAME = "AudioSpectrum";
  public static final String EVENT_SPECTRUM = "onSpectrum";

  private static final int FFT_SIZE = 1024;
  private static final int OUTPUT_BINS = 64;
  private static final float ANALYSER_SMOOTHING = 0.3f;
  private static final float BIN_GAIN = 1.8f;
  private static final float NOISE_FLOOR_DECAY_RATE = 0.05f;
  private static final float NOISE_FLOOR_LEARN_RATE = 0.002f;
  private static final float NOISE_SUBTRACTION_MARGIN = 1.5f;

  private final ReactApplicationContext reactContext;
  private Visualizer visualizer;
  private float[] smoothedBins;
  private float[] noiseFloor;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private boolean running = false;
  private int silentFrameCount = 0;

  public AudioSpectrumModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void start(com.facebook.react.bridge.Promise promise) {
    if (running) {
      promise.resolve(true);
      return;
    }
    // Visualizer 需要 RECORD_AUDIO 权限 (Android 6+ 采集其他应用音频需该权限)
    boolean hasMic = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO)
        == PackageManager.PERMISSION_GRANTED;
    if (!hasMic) {
      sendError("RECORD_AUDIO permission not granted");
      promise.reject("NO_PERMISSION", "RECORD_AUDIO permission not granted");
      return;
    }
    try {
      int[] range = Visualizer.getCaptureSizeRange();
      int captureSize = Math.min(range[1], FFT_SIZE);
      captureSize = Math.max(captureSize, range[0]);
      // 使用与播放器共享的音频会话(精确采集自身音频); 未创建时回退默认会话
      visualizer = new Visualizer(AudioSession.current());
      visualizer.setCaptureSize(captureSize);
      visualizer.setDataCaptureListener(new Visualizer.OnDataCaptureListener() {
        @Override
        public void onWaveFormDataCapture(Visualizer visualizer, byte[] waveform, int samplingRate) {
          // 波形数据(时域), 不使用
        }

        @Override
        public void onFftDataCapture(Visualizer visualizer, byte[] fft, int samplingRate) {
          processVisualizerFft(fft, samplingRate);
        }
      }, Visualizer.getMaxCaptureRate() / 2, false, true);
      visualizer.setEnabled(true);
      running = true;
      android.util.Log.d("AudioSpectrum", "Visualizer started, captureSize=" + captureSize);
      // 静音检测: 无音频播放时停止推送
      mainHandler.postDelayed(silentCheck, 2000);
      promise.resolve(true);
    } catch (Exception e) {
      sendError("Visualizer start failed: " + e.getMessage());
      promise.reject("START_FAILED", e.getMessage());
    }
  }

  @ReactMethod
  public void stop() {
    android.util.Log.d("AudioSpectrum", "Visualizer stopped");
    running = false;
    mainHandler.removeCallbacks(silentCheck);
    if (visualizer != null) {
      try {
        visualizer.setEnabled(false);
        visualizer.release();
      } catch (Exception ignored) {
      }
      visualizer = null;
    }
  }

  private final Runnable silentCheck = new Runnable() {
    @Override
    public void run() {
      if (running) {
        // 持续静音则通知 JS 停止动画
        if (silentFrameCount > 30) {
          WritableMap params = Arguments.createMap();
          params.putBoolean("silent", true);
          sendEvent(EVENT_SPECTRUM + "Silent", params);
          silentFrameCount = 0;
        }
        mainHandler.postDelayed(this, 2000);
      }
    }
  };

  /** Visualizer FFT 字节 → 64 bins 归一化频谱 (移植 Mineradio AudioCapture) */
  private void processVisualizerFft(byte[] data, int samplingRate) {
    int numBins = data.length / 2;
    if (numBins <= 0) return;

    float sampleRateKHz = samplingRate / 1000f;
    float binHz = sampleRateKHz / data.length;

    // 幅度计算
    float[] mag = new float[numBins];
    float rawMax = 0f;
    float rawMin = 999f;
    boolean allZero = true;
    for (int i = 0; i < numBins; i++) {
      float re = data[2 * i];
      float im = data[2 * i + 1];
      float m = (float) Math.sqrt(re * re + im * im);
      mag[i] = m;
      if (m > 0) allZero = false;
      if (m > rawMax) rawMax = m;
      if (m < rawMin) rawMin = m;
    }

    // MIUI 兼容: 全零数据静音
    if (allZero) {
      silentFrameCount++;
      return;
    }
    silentFrameCount = 0;

    // 归一化 + dB 压缩 + 降噪
    if (noiseFloor == null) noiseFloor = new float[OUTPUT_BINS];
    if (smoothedBins == null) smoothedBins = new float[OUTPUT_BINS];
    float[] bins = new float[OUTPUT_BINS];

    float range = Math.max(rawMax - rawMin, 1f);
    for (int i = 0; i < OUTPUT_BINS; i++) {
      // 线性映射原始 bin 到输出 bin (低频集中)
      int srcIdx = Math.min((int) (i * (numBins - 1) / (float) (OUTPUT_BINS - 1)), numBins - 1);
      float v = mag[srcIdx] / range;
      // 噪声地板学习
      noiseFloor[i] = noiseFloor[i] * (1 - NOISE_FLOOR_LEARN_RATE) + v * NOISE_FLOOR_LEARN_RATE;
      float denoised = Math.max(v - noiseFloor[i] * NOISE_SUBTRACTION_MARGIN, 0f);
      // dB 压缩 + 增益 + 平滑
      float db = (float) (Math.log10(Math.max(denoised, 1e-4f)) + 4f) / 4f; // 0-1 近似
      float target = Math.min(Math.max(db * BIN_GAIN, 0f), 1f);
      smoothedBins[i] = smoothedBins[i] * (1 - ANALYSER_SMOOTHING) + target * ANALYSER_SMOOTHING;
      bins[i] = smoothedBins[i];
    }

    // 推送事件
    WritableArray arr = Arguments.createArray();
    for (int i = 0; i < OUTPUT_BINS; i++) {
      arr.pushDouble(bins[i]);
    }
    WritableMap params = Arguments.createMap();
    params.putArray("bins", arr);
    params.putBoolean("silent", false);
    sendEvent(EVENT_SPECTRUM, params);
  }

  private void sendEvent(String eventName, WritableMap params) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  private void sendError(String msg) {
    WritableMap params = Arguments.createMap();
    params.putString("error", msg);
    sendEvent(EVENT_SPECTRUM + "Error", params);
  }

  @Override
  public void invalidate() {
    stop();
    super.invalidate();
  }
}
