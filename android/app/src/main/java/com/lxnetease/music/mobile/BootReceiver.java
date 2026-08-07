package com.lxnetease.music.mobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BootReceiver - 开机自启动
 * 监听开机完成广播,自动拉起主界面(车机/桌面场景开机后自动进入应用)。
 * 部分 ROM(如小米/EMUI)需在系统设置中允许应用自启动才能生效。
 */
public class BootReceiver extends BroadcastReceiver {
  private static final String TAG = "BootReceiver";

  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null) return;
    String action = intent.getAction();
    if (action == null) return;
    // 开机完成: 标准开机 / 快速开机(部分平板/车机) / 锁屏后开机
    if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
        && !"android.intent.action.QUICKBOOT_POWERON".equals(action)
        && !"android.intent.action.LOCKED_BOOT_COMPLETED".equals(action)) {
      return;
    }
    try {
      Intent launch = new Intent(context, MainActivity.class);
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      context.startActivity(launch);
      Log.i(TAG, "boot completed, launching MainActivity");
    } catch (Exception e) {
      Log.w(TAG, "failed to launch MainActivity", e);
    }
  }
}
