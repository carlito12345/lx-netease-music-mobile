package com.lxnetease.music.mobile.logger;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class NativeLoggerModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[NativeLogger]";
  // 动态获取 app 专属外部目录(无需存储权限, 安卓全版本可写)
  // 路径: /storage/emulated/0/Android/data/<包名>/files/LXMusic_Logs/
  private static final long MAX_LOG_SIZE = 50 * 1024 * 1024L;

  // 静态自初始化:首次调用时自动创建文件
  private static boolean initialized = false;
  private static File logFile = null;
  private static ReactApplicationContext appContext = null;

  public NativeLoggerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    appContext = reactContext;
  }

  @Override
  public String getName() { return "NativeLogger"; }

  // JS 调用以确认路径
  @ReactMethod
  public void getLogPath(Promise promise) {
    ensureInit();
    promise.resolve(logFile != null ? logFile.getAbsolutePath() : "(未初始化)");
  }

  // JS 写入日志(调试用)
  @ReactMethod
  public void writeLog(String tag, String level, String message) {
    write(tag, level, message);
  }

  // JS 读取全部日志
  @ReactMethod
  public void readLogs(Promise promise) {
    ensureInit();
    if (logFile == null) { promise.resolve(""); return; }
    try {
      StringBuilder sb = new StringBuilder();
      java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(logFile));
      String line;
      while ((line = reader.readLine()) != null) {
        sb.append(line).append("\n");
      }
      reader.close();
      promise.resolve(sb.toString());
    } catch (Exception e) {
      promise.reject("READ_LOG_ERROR", e.getMessage());
    }
  }

  private static synchronized void ensureInit() {
    if (initialized) return;
    initialized = true;
    try {
      File baseDir = appContext != null
          ? appContext.getExternalFilesDir(null)
          : null;
      // 日志写到公共目录(Android/data 受保护读不到)
      File pubDir = new File("/storage/emulated/0/MT2/mcp/LXMUSIC-test/");
      File dir = new File(pubDir.exists() ? pubDir.getAbsolutePath() : (baseDir != null ? baseDir.getAbsolutePath() : "/data/data/lxnetease/tmp"), "LXMusic_Logs");
      if (!dir.exists()) dir.mkdirs();
      // 若公共目录不可写则降级到 app 私有目录
      if (!dir.canWrite()) dir = new File(baseDir != null ? baseDir.getAbsolutePath() : "/data/data/lxnetease/tmp", "LXMusic_Logs");
      if (!dir.exists()) dir.mkdirs();
      String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
      logFile = new File(dir, "log_" + dateStr + ".log");
      // 写一条启动标记
      String timeStr = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(new Date());
      String line = "[" + timeStr + "][NativeLogger] Native logger auto-initialized\n";
      FileOutputStream fos = new FileOutputStream(logFile, true);
      fos.write(line.getBytes("UTF-8"));
      fos.close();
      Log.d(TAG, "Auto-init: " + logFile.getAbsolutePath());
    } catch (Exception e) {
      Log.e(TAG, "Auto-init failed", e);
    }
  }

  // 供其他原生模块调用的静态方法
  public static void write(String tag, String level, String message) {
    ensureInit();
    if (logFile == null) return;
    try {
      if (logFile.exists() && logFile.length() > MAX_LOG_SIZE) {
        String ts = String.valueOf(System.currentTimeMillis());
        File renamed = new File(logFile.getParent(), logFile.getName() + "." + ts + ".bak");
        logFile.renameTo(renamed);
        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        logFile = new File(logFile.getParent(), "log_" + dateStr + ".log");
      }
      String timeStr = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(new Date());
      String line = "[" + timeStr + "][" + tag + "][" + level + "] " + message + "\n";
      FileOutputStream fos = new FileOutputStream(logFile, true);
      fos.write(line.getBytes("UTF-8"));
      fos.close();
    } catch (Exception e) {
      Log.e(TAG, "Write failed", e);
    }
  }
}
