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

# ====== 讯飞 MSC SDK ======
-keep class com.iflytek.** { *; }
-dontwarn com.iflytek.**
-keep class com.lxnetease.music.mobile.asr.** { *; }
# JSON 解析 (AsrModule 用)
-keep class org.json.** { *; }
# CountDownLatch (唤醒用)
-keep class java.util.concurrent.CountDownLatch { *; }
# React Native 回调接口
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}
