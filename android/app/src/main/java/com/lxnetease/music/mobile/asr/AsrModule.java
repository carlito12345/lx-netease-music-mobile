package com.lxnetease.music.mobile.asr;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.iflytek.cloud.ErrorCode;
import com.iflytek.cloud.RecognizerListener;
import com.iflytek.cloud.RecognizerResult;
import com.iflytek.cloud.SpeechConstant;
import com.iflytek.cloud.SpeechError;
import com.iflytek.cloud.SpeechRecognizer;
import com.iflytek.cloud.SpeechUtility;
import com.iflytek.cloud.util.ResourceUtil;
import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AsrModule extends ReactContextBaseJavaModule {
    public static final String NAME = "AsrModule";
    private static final String TAG = "AsrModule";
    private static final String APPID = "472cc4da";
    private static volatile boolean sdkInit = false;
    private final ReactApplicationContext ctx;
    private volatile SpeechRecognizer recognizer;
    private volatile String lastResult = "";
    private volatile boolean listening = false;
    private volatile boolean hasResult = false;
    private volatile boolean wakeupRunning = false;
    private volatile String wakeupWord = "";
    private static File logFile = null;

    public AsrModule(ReactApplicationContext ctx) { super(ctx); this.ctx = ctx; initSdk(); }

    @Override public String getName() { return NAME; }

    private synchronized void logToFile(String msg) {
        try {
            if (logFile == null) {
                logFile = new File("/storage/emulated/0/MT2/mcp/LXMUSIC-test/asr_module.log");
                logFile.getParentFile().mkdirs();
            }
            FileWriter fw = new FileWriter(logFile, true);
            fw.write(new SimpleDateFormat("MM-dd HH:mm:ss.SSS", Locale.getDefault()).format(new Date()) + " " + msg + "\n");
            fw.close();
        } catch (Throwable ignored) {}
    }

    @ReactMethod public void writeOpLog(String line, Promise p) { logToFile(line); p.resolve(true); }

    private synchronized void initSdk() {
        if (sdkInit) return;
        try {
            String param = "appid=" + APPID + "," + SpeechConstant.ENGINE_MODE + "=" + SpeechConstant.MODE_MSC;
            SpeechUtility.createUtility(ctx.getApplicationContext(), param);
            sdkInit = true;
            Log.i(TAG, "SDK init OK");
        } catch (Throwable e) { Log.e(TAG, "SDK init fail", e); }
    }

    @ReactMethod public void getStatus(Promise p) {
        WritableMap m = Arguments.createMap();
        m.putBoolean("modelReady", sdkInit);
        m.putString("loadStatus", sdkInit ? "就绪" : "失败");
        m.putInt("loadProgress", 100);
        p.resolve(m);
    }

    @ReactMethod public void loadModel(Promise p) { p.resolve(sdkInit); }

    @ReactMethod
    public void startListening(Promise p) {
        if (!sdkInit) { p.reject("ERR", "SDK未初始化"); return; }
        new Thread(() -> {
            try {
                if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); recognizer = null; }
                recognizer = SpeechRecognizer.createRecognizer(ctx, null);
                if (recognizer == null) { p.reject("ERR", "创建失败"); return; }
                // 在线云端识别 (Release 兼容: 显式 TYPE_CLOUD)
                recognizer.setParameter(SpeechConstant.ENGINE_TYPE, SpeechConstant.TYPE_CLOUD);
                recognizer.setParameter(SpeechConstant.RESULT_TYPE, "json");
                recognizer.setParameter(SpeechConstant.LANGUAGE, "zh_cn");
                recognizer.setParameter(SpeechConstant.ACCENT, "mandarin");
                recognizer.setParameter(SpeechConstant.ASR_PTT, "1");
                recognizer.setParameter(SpeechConstant.VAD_BOS, "5000");
                recognizer.setParameter(SpeechConstant.VAD_EOS, "1500");
                lastResult = ""; hasResult = false; listening = true;
                int ret = recognizer.startListening(new RecognizerListener() {
                    @Override public void onBeginOfSpeech() {}
                    @Override public void onEndOfSpeech() {}
                    @Override public void onVolumeChanged(int v, byte[] d) {}
                    @Override public void onResult(RecognizerResult r, boolean isLast) {
                        try { String t = parseIatResult(r.getResultString()); if (t.length() > 0) { lastResult += t; hasResult = true; } if (isLast) listening = false; } catch (Throwable ignored) {}
                    }
                    @Override public void onError(SpeechError e) { listening = false; }
                    @Override public void onEvent(int t, int a1, int a2, android.os.Bundle o) {}
                });
                if (ret != ErrorCode.SUCCESS) { listening = false; p.reject("ERR", "error:" + ret); }
                else p.resolve(true);
            } catch (Throwable e) { listening = false; p.reject("ERR", e.getMessage()); }
        }, "asr-start").start();
    }

    @ReactMethod
    public void stopListening(Promise p) {
        listening = false;
        if (recognizer != null) { recognizer.stopListening(); try { Thread.sleep(300); } catch (InterruptedException ignored) {} }
        String text = lastResult.replaceAll("[\\p{P}\\p{S}]", "").trim();
        WritableMap m = Arguments.createMap();
        m.putString("text", text);
        m.putBoolean("done", true);
        if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); recognizer = null; }
        p.resolve(m);
    }

    @ReactMethod
    public void getPartialResult(Promise p) {
        WritableMap m = Arguments.createMap();
        boolean done = !listening;
        m.putBoolean("done", done);
        m.putString("text", done ? lastResult.replaceAll("[\\p{P}\\p{S}]", "").trim() : "");
        p.resolve(m);
    }

    // ====== 唤醒 V2 ======
    @ReactMethod
    public void startWakeup(String keyword, Promise p) {
        if (!sdkInit) { p.reject("ERR", "SDK未初始化"); return; }
        wakeupWord = keyword != null ? keyword : "";
        if (wakeupRunning) {
            wakeupRunning = false;
            if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); recognizer = null; }
            try { Thread.sleep(200); } catch (InterruptedException ignored) {}
        }
        wakeupRunning = true;
        logToFile("wakeup start [" + wakeupWord + "]");
        new Thread(() -> {
            while (wakeupRunning) {
                SpeechRecognizer rec = null;
                try {
                    rec = SpeechRecognizer.createRecognizer(ctx, null);
                    if (rec == null) { Thread.sleep(500); continue; }
                    rec.setParameter(SpeechConstant.RESULT_TYPE, "json");
                    rec.setParameter(SpeechConstant.LANGUAGE, "zh_cn");
                    rec.setParameter(SpeechConstant.ACCENT, "mandarin");
                    rec.setParameter(SpeechConstant.VAD_BOS, "3000");
                    rec.setParameter(SpeechConstant.VAD_EOS, "800");

                    final java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
                    final StringBuilder sb = new StringBuilder();

                    rec.startListening(new RecognizerListener() {
                        @Override public void onBeginOfSpeech() { logToFile("wakeup: voice"); }
                        @Override public void onEndOfSpeech() {}
                        @Override public void onVolumeChanged(int v, byte[] d) {}
                        @Override public void onEvent(int t, int a1, int a2, android.os.Bundle o) {}
                        @Override
                        public void onResult(RecognizerResult result, boolean isLast) {
                            try {
                                String text = parseIatResult(result.getResultString());
                                if (text.length() > 0) sb.append(text);
                                if (isLast) latch.countDown();
                            } catch (Throwable ignored) { if (isLast) latch.countDown(); }
                        }
                        @Override public void onError(SpeechError e) {
                            logToFile("wakeup: err " + e.getErrorCode());
                            latch.countDown();
                        }
                    });

                    latch.await(8, java.util.concurrent.TimeUnit.SECONDS);
                    if (!wakeupRunning) { if (rec != null) { rec.cancel(); rec.destroy(); } break; }

                    String text = sb.toString();
                    String kw = wakeupWord;
                    logToFile("wakeup: [" + text + "] vs [" + kw + "]");

                    if (text.length() > 0 && kw.length() >= 2 && text.contains(kw)) {
                        logToFile("wakeup: MATCHED!");
                        wakeupRunning = false;
                        final String msg = text;
                        ctx.runOnUiQueueThread(() -> {
                            try {
                                com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter emitter =
                                    ctx.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class);
                                if (emitter != null) {
                                    WritableMap eventData = Arguments.createMap();
                                    eventData.putString("text", msg);
                                    emitter.emit("onAsrWakeup", eventData);
                                }
                            } catch (Exception ignored) {}
                        });
                        if (rec != null) { rec.cancel(); rec.destroy(); }
                        break;
                    }
                    if (rec != null) { rec.cancel(); rec.destroy(); rec = null; }
                    if (wakeupRunning) Thread.sleep(300);
                } catch (Throwable e) {
                    logToFile("wakeup: loop " + e.getMessage());
                    if (rec != null) { rec.cancel(); rec.destroy(); }
                    try { Thread.sleep(1000); } catch (InterruptedException ignored) { break; }
                }
            }
            wakeupRunning = false;
            logToFile("wakeup: end");
        }, "asr-wakeup").start();
        p.resolve(true);
    }

    @ReactMethod
    public void stopWakeup(Promise p) {
        logToFile("wakeup: stop");
        wakeupRunning = false;
        if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); recognizer = null; }
        p.resolve(true);
    }

    private String parseIatResult(String json) {
        StringBuilder sb = new StringBuilder();
        try {
            org.json.JSONArray ws = new org.json.JSONObject(json).optJSONArray("ws");
            if (ws != null) {
                for (int i = 0; i < ws.length(); i++) {
                    org.json.JSONArray cw = ws.getJSONObject(i).optJSONArray("cw");
                    if (cw != null && cw.length() > 0) {
                        String w = cw.getJSONObject(0).optString("w", "");
                        w = w.replaceAll("[\\p{P}\\p{S}]", "");
                        if (!w.trim().isEmpty()) sb.append(w);
                    }
                }
            }
        } catch (Throwable ignored) {}
        return sb.toString();
    }
}
