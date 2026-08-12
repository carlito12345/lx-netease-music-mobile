package com.lxnetease.music.mobile.asr;

import android.util.Log;
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
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import java.io.*;
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
    private File logFile;

    public AsrModule(ReactApplicationContext ctx) { super(ctx); this.ctx = ctx; Log.e(TAG,"=== CONSTRUCTOR ==="); initSdk(); }

    @Override public String getName() { Log.e(TAG,"getName"); return NAME; }

    private void log(String msg) {
        Log.e(TAG, msg);
        try {
            if (logFile == null) logFile = new File(ctx.getFilesDir(), "asr.log");
            FileWriter fw = new FileWriter(logFile, true);
            fw.write(new SimpleDateFormat("MM-dd HH:mm:ss.SSS", Locale.getDefault()).format(new Date()) + " " + msg + "\n");
            fw.close();
        } catch (Throwable t) { Log.e(TAG, "log write err: " + t.getMessage()); }
    }

    @ReactMethod public void writeOpLog(String line, Promise p) { log("JS " + line); p.resolve(true); }

    @ReactMethod
    public void readLog(Promise p) {
        try {
            if (logFile == null || !logFile.exists()) { p.resolve("(empty)"); return; }
            BufferedReader br = new BufferedReader(new FileReader(logFile));
            StringBuilder sb = new StringBuilder();
            String line; while ((line = br.readLine()) != null) sb.append(line).append('\n');
            br.close();
            if (sb.length() > 8000) sb.setLength(8000);
            p.resolve(sb.toString());
        } catch (Throwable e) { p.reject("ERR", e.getMessage()); }
    }

    private synchronized void initSdk() {
        if (sdkInit) return;
        try {
            String param = "appid=" + APPID + "," + SpeechConstant.ENGINE_MODE + "=" + SpeechConstant.MODE_MSC;
            SpeechUtility.createUtility(ctx.getApplicationContext(), param);
            sdkInit = true;
            log("init OK");
        } catch (Throwable e) { log("init FAIL " + e.getMessage()); }
    }

    @ReactMethod
    public void hasRecordAudioPermission(Promise p) {
        try {
            boolean granted = ctx.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
            log("hasRecordAudioPermission: " + granted);
            p.resolve(granted);
        } catch (Throwable e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void openRecordAudioSettings() {
        log("openRecordAudioSettings: requesting permission");
        try {
            Intent intent = new Intent("android.intent.action.MANAGE_APP_PERMISSIONS");
            intent.putExtra(Intent.EXTRA_PACKAGE_NAME, ctx.getPackageName());
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Throwable e) {
            log("openSettings fallback: " + e.getMessage());
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + ctx.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
            } catch (Throwable e2) { log("openSettings err: " + e2.getMessage()); }
        }
    }

    @ReactMethod public void getStatus(Promise p) {
        WritableMap m = Arguments.createMap();
        m.putBoolean("modelReady", sdkInit);
        m.putString("loadStatus", sdkInit ? "ready" : "fail");
        m.putInt("loadProgress", 100);
        p.resolve(m);
    }
    @ReactMethod public void loadModel(Promise p) { p.resolve(sdkInit); }

    @ReactMethod
    public void startListening(Promise p) {
        log("startListening: sdkInit=" + sdkInit);
        if (!sdkInit) { log("startListening: SDK NOT INIT"); p.reject("ERR", "SDK not init"); return; }
        lastResult = ""; hasResult = false; listening = true;
        log("startListening: listening=true, spawning thread");
        // 同步 resolve, 后台线程自行管理生命周期
        p.resolve(true);
        new Thread(() -> {
            SpeechRecognizer rec = null;
            try {
                if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); }
                rec = SpeechRecognizer.createRecognizer(ctx, null);
                if (rec == null) { log("createRecognizer NULL"); listening = false; return; }
                recognizer = rec;
                log("createRecognizer OK");
                rec.setParameter(SpeechConstant.ENGINE_TYPE, SpeechConstant.TYPE_CLOUD);
                rec.setParameter(SpeechConstant.RESULT_TYPE, "json");
                rec.setParameter(SpeechConstant.LANGUAGE, "zh_cn");
                rec.setParameter(SpeechConstant.ACCENT, "mandarin");
                rec.setParameter(SpeechConstant.ASR_PTT, "1");
                rec.setParameter(SpeechConstant.VAD_BOS, "5000");
                rec.setParameter(SpeechConstant.VAD_EOS, "1500");
                log("params set, calling startListening");
                int ret = rec.startListening(new RecognizerListener() {
                    @Override public void onBeginOfSpeech() { log("onBegin"); }
                    @Override public void onEndOfSpeech() { log("onEnd"); }
                    @Override public void onVolumeChanged(int v, byte[] d) {}
                    @Override public void onResult(RecognizerResult r, boolean isLast) {
                        try { String t = parseIatResult(r.getResultString()); if (t.length() > 0) { lastResult += t; hasResult = true; } log("onResult: [" + t + "] isLast=" + isLast); if (isLast) listening = false; } catch (Throwable e) { log("onResult err: " + e.getMessage()); }
                    }
                    @Override public void onError(SpeechError e) {
                        log("onError: " + e.getErrorCode() + " " + (e.getMessage() != null ? e.getMessage() : ""));
                        listening = false;
                    }
                    @Override public void onEvent(int t, int a1, int a2, android.os.Bundle o) {}
                });
                if (ret != ErrorCode.SUCCESS) { listening = false; log("startListening failed: " + ret); }
                else { log("startListening OK, waiting for result..."); }
            } catch (Throwable e) { listening = false; log("startListening exception: " + e.getMessage()); }
        }, "asr-start").start();
    }

    @ReactMethod
    public void stopListening(Promise p) {
        log("stopListening");
        listening = false;
        if (recognizer != null) { recognizer.stopListening(); try { Thread.sleep(300); } catch (InterruptedException e) {} }
        String text = lastResult.replaceAll("[\\p{P}\\p{S}]", "").trim();
        log("stopListening result: [" + text + "]");
        WritableMap m = Arguments.createMap();
        m.putString("text", text);
        m.putBoolean("done", true);
        if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); recognizer = null; }
        p.resolve(m);
    }

    @ReactMethod
    public void getPartialResult(Promise p) {
        boolean done = !listening;
        String text = done ? lastResult.replaceAll("[\\p{P}\\p{S}]", "").trim() : "";
        WritableMap m = Arguments.createMap();
        m.putBoolean("done", done);
        m.putString("text", text);
        // Don't log every poll to avoid spam
        p.resolve(m);
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
