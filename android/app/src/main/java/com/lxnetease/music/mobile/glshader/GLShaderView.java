package com.lxnetease.music.mobile.glshader;

import android.content.Context;
import android.opengl.GLSurfaceView;
import android.os.Environment;
import android.view.MotionEvent;

import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * GLShaderView - GLES20 全屏 shader 渲染 View (Mineradio 同架构)
 * 原生 GLSurfaceView + renderer, 触摸在原生内部处理
 */
public class GLShaderView extends GLSurfaceView {

  private final GLShaderRenderer renderer;
  private boolean interactive = false;

  private static File logFile = null;

  /** 写入共享目录日志 (安卓16无logcat权限) */
  public static void fileLog(String msg) {
    try {
      if (logFile == null) {
        File dir = new File(Environment.getExternalStorageDirectory(), "MT2/mcp/LXMUSIC-test");
        if (!dir.exists()) dir.mkdirs();
        logFile = new File(dir, "glshader_touch.log");
      }
      FileWriter fw = new FileWriter(logFile, true);
      fw.write(new SimpleDateFormat("MM-dd HH:mm:ss.SSS", Locale.getDefault()).format(new Date()) + " " + msg + "\n");
      fw.close();
    } catch (Throwable t) {
      // ignore
    }
  }

  public GLShaderView(Context context) {
    super(context);
    setEGLContextClientVersion(2);
    setPreserveEGLContextOnPause(true);
    // 支持 alpha 通道(半透明背景)
    setEGLConfigChooser(8, 8, 8, 8, 16, 0);
    renderer = new GLShaderRenderer();
    setRenderer(renderer);
    setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
    // 确保能接收触摸事件
    setClickable(true);
    setFocusable(true);
  }

  public GLShaderRenderer getRenderer() {
    return renderer;
  }

  public void setInteractive(boolean interactive) {
    this.interactive = interactive;
  }

  public void setShaderSource(String source) {
    renderer.setShaderSource(source);
  }

  public void setBands(float[] bands) {
    renderer.setBands(bands);
  }

  public void setVolume(float volume) {
    renderer.setVolume(volume);
  }

  public void setBaseColor(float r, float g, float b) {
    renderer.setBaseColor(r, g, b);
  }

  public void setParams(float amplitude, float frequencyX, float frequencyY) {
    renderer.setParams(amplitude, frequencyX, frequencyY);
  }

  @Override
  public boolean onTouchEvent(MotionEvent event) {
    if (!interactive) return super.onTouchEvent(event);
    // 用屏幕绝对坐标(视图可能被 zIndex/偏移), 除以屏幕尺寸归一化
    float x = event.getRawX();
    float y = event.getRawY();
    float w = getResources().getDisplayMetrics().widthPixels;
    float h = getResources().getDisplayMetrics().heightPixels;
    if (w > 0 && h > 0) {
      renderer.setMouse(x / w, y / h);
    }
    return true;
  }


  @Override
  public void onPause() {
    super.onPause();
  }

  @Override
  public void onResume() {
    super.onResume();
  }
}
