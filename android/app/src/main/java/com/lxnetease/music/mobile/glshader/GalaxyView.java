package com.lxnetease.music.mobile.glshader;

import android.content.Context;
import android.opengl.GLSurfaceView;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * GalaxyView - 星河星云 GLSurfaceView
 * 粒子星系 + 粒子歌词 + 透明背景
 * 交互: 单指旋转 + 双指缩放(拉近/归位)
 */
public class GalaxyView extends GLSurfaceView {

  private final GalaxyRenderer renderer;
  private float lastX = 0, lastY = 0;
  private final ScaleGestureDetector scaleDetector;

  public GalaxyView(Context context) {
    super(context);
    setEGLContextClientVersion(2);
    setPreserveEGLContextOnPause(true);
    // 透明背景
    setEGLConfigChooser(8, 8, 8, 8, 16, 0);
    renderer = new GalaxyRenderer(context);
    setRenderer(renderer);
    setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
    setClickable(true);
    setFocusable(true);

    // 双指缩放: 拉近镜头
    scaleDetector = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
      @Override
      public boolean onScale(ScaleGestureDetector detector) {
        renderer.addZoom((detector.getScaleFactor() - 1.0f) * 3.0f);
        return true;
      }
    });
  }

  public GalaxyRenderer getRenderer() { return renderer; }

  @Override
  public boolean onTouchEvent(MotionEvent event) {
    // 双指缩放优先
    scaleDetector.onTouchEvent(event);

    switch (event.getActionMasked()) {
      case MotionEvent.ACTION_DOWN:
        lastX = event.getX();
        lastY = event.getY();
        return true;
      case MotionEvent.ACTION_MOVE:
        // 仅单指时旋转
        if (event.getPointerCount() == 1) {
          float dx = (event.getX() - lastX) * 0.008f;
          float dy = (event.getY() - lastY) * 0.008f;
          renderer.setRot(dx, dy);
          lastX = event.getX();
          lastY = event.getY();
        }
        return true;
      case MotionEvent.ACTION_POINTER_UP:
      case MotionEvent.ACTION_UP:
        // 手指全部离开: 缩放平滑归位
        if (event.getPointerCount() <= 1) {
          renderer.resetZoom();
        }
        return true;
    }
    return super.onTouchEvent(event);
  }
}
