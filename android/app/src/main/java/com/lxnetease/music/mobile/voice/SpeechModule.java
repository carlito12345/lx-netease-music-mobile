package com.lxnetease.music.mobile.voice;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;

public class SpeechModule extends ReactContextBaseJavaModule {
    public static final String NAME = "SpeechRecognizerModule";
    private final ReactApplicationContext reactContext;
    private SpeechRecognizer recognizer;
    private Promise currentPromise;

    public SpeechModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void isAvailable(Promise promise) {
        try {
            boolean hasPermission = reactContext.checkSelfPermission("android.permission.RECORD_AUDIO") == PackageManager.PERMISSION_GRANTED;
            boolean hasRecognizer = SpeechRecognizer.isRecognitionAvailable(reactContext);
            WritableMap map = Arguments.createMap();
            map.putBoolean("hasPermission", hasPermission);
            map.putBoolean("hasRecognizer", hasRecognizer);
            promise.resolve(map);
        } catch (Exception e) {
            promise.reject("ERR", e.getMessage());
        }
    }

    @ReactMethod
    public void startListening(Promise promise) {
        if (currentPromise != null) {
            promise.reject("BUSY", "already listening");
            return;
        }
        if (recognizer != null) {
            recognizer.destroy();
        }
        currentPromise = promise;
        recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext);
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                Promise p = currentPromise;
                currentPromise = null;
                if (p != null) p.reject("ERR_" + error, getErrorText(error));
            }

            @Override
            public void onResults(Bundle results) {
                Promise p = currentPromise;
                currentPromise = null;
                if (p == null) return;
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    WritableMap map = Arguments.createMap();
                    map.putString("text", matches.get(0));
                    map.putBoolean("success", true);
                    p.resolve(map);
                } else {
                    p.reject("EMPTY", "no result");
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {}
            @Override public void onEvent(int eventType, Bundle params) {}
        });

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        try {
            recognizer.startListening(intent);
        } catch (Exception e) {
            currentPromise = null;
            promise.reject("ERR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopListening() {
        if (recognizer != null) {
            try { recognizer.stopListening(); } catch (Exception ignored) {}
        }
    }

    @ReactMethod
    public void destroy() {
        if (recognizer != null) {
            recognizer.destroy();
            recognizer = null;
        }
    }

    private String getErrorText(int errorCode) {
        switch (errorCode) {
            case SpeechRecognizer.ERROR_AUDIO: return "音频错误";
            case SpeechRecognizer.ERROR_CLIENT: return "客户端错误";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "无录音权限";
            case SpeechRecognizer.ERROR_NETWORK: return "网络错误";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "网络超时";
            case SpeechRecognizer.ERROR_NO_MATCH: return "未识别到语音";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "识别服务忙";
            case SpeechRecognizer.ERROR_SERVER: return "服务器错误";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "无语音输入";
            default: return "错误码 " + errorCode;
        }
    }
}
