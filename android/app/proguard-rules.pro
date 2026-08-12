# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-keep class com.reactnativenavigation.views.element.animators.** { *; }
# -keepclassmembers class com.reactnativenavigation.views.element.animators.** { *; }


-keep class org.jaudiotagger.tag.** { *; }


-keep public class com.dylanvann.fastimage.* {*;}
-keep public class com.dylanvann.fastimage.** {*;}
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# ====== 讯飞 MSC SDK (完整保护 JNI + 反射 + ReactPackage) ======
-keepattributes Signature,InnerClasses,EnclosingMethod,*Annotation*
-keep class com.iflytek.** { *; }
-keep class com.iflytek.cloud.** { *; }
-keep class com.iflytek.msc.** { *; }
-keep class com.iflytek.speech.** { *; }
-dontwarn com.iflytek.**
# ASR 模块 (ReactPackage 必须保护, 否则反射创建失败)
-keep class com.lxnetease.music.mobile.asr.AsrModule { *; }
-keep class com.lxnetease.music.mobile.asr.AsrPackage { *; }
-keep class com.lxnetease.music.mobile.asr.** { *; }
-keep class com.lxnetease.music.mobile.voice.SpeechModule { *; }
-keep class com.lxnetease.music.mobile.voice.SpeechPackage { *; }
-keep class com.lxnetease.music.mobile.voice.** { *; }
# JSON 解析
-keep class org.json.** { *; }
# JNI 回调类
-keepclasseswithmembernames class * {
    native <methods>;
}
# React Native 回调 (包名级别保护)
-keepclassmembers class com.lxnetease.** {
    @com.facebook.react.bridge.ReactMethod *;
}
# 防止 R8 移除讯飞资源文件
-keep class com.iflytek.**.R { *; }
-keep class com.iflytek.**.R$* { *; }
