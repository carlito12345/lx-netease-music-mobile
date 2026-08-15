package com.lxnetease.music.mobile.glshader;

import android.content.Context;
import android.opengl.GLSurfaceView;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.opengl.GLES20;
import android.opengl.Matrix;
import android.os.SystemClock;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.List;

/**
 * GalaxyRenderer - 星河星云粒子渲染器
 * - 螺旋臂星系粒子(大小/亮度/颜色随机)
 * - 歌词粒子(位图采样: 文字 → 密集小粒子)
 * - 手指 360° 旋转(rotX/rotY)
 * - 透明背景
 */
public class GalaxyRenderer implements GLSurfaceView.Renderer {
  private static final int GALAXY_PARTICLES = 4000;   // 星系粒子
  private static final int LYRIC_PARTICLES_MAX = 6000; // 歌词粒子上限
  private static final int FLOATS_PER_PARTICLE = 9;    // x,y,z,size,bright,phase,r,g,b

  // 旋转(手指控制)
  private volatile float rotX = 0.12f;  // 初始俯仰(近水平, 银河带横贯)
  private volatile float rotY = 0.0f;
  private volatile float rotSpeed = 0.04f; // 自转速度
  private volatile float zoomTarget = 0f;  // 双指缩放目标(0=原位, 正值拉近)
  private float zoomOffset = 0f;           // 当前缩放(平滑逼近 target)

  private final Context context;

  // Shader
  private int program = 0;
  private int aPosition = -1;
  private int aAttr = -1;          // size, brightness
  private int aPhase = -1;         // 漂移相位
  private int aColor = -1;
  private int uMatrix = -1;
  private int uMVPMatrix = -1;
  private int uTime = -1;

  // VBO
  private int galaxyVbo = 0;
  private int lyricVbo = 0;
  private int galaxyCount = 0;
  private int lyricCount = 0;

  // 频谱(用于歌词粒子脉动)
  private volatile float[] bands = new float[16];
  private volatile float volume = 0.0f;
  private volatile int viewW = 1, viewH = 1;

  public GalaxyRenderer(Context context) {
    this.context = context;
  }

  public void setRot(float dx, float dy) {
    rotY += dx;
    rotX = Math.max(-1.2f, Math.min(1.2f, rotX + dy));
  }

  public void setRotSpeed(float s) { this.rotSpeed = s; }

  /** 双指缩放: amount>0 拉近, 释放时传 0 归位 */
  public void addZoom(float amount) {
    zoomTarget = Math.max(0f, Math.min(6f, zoomTarget + amount));
  }
  public void resetZoom() { zoomTarget = 0f; }

  public void setBands(float[] b) { if (b != null && b.length >= 16) System.arraycopy(b, 0, bands, 0, 16); }
  public void setVolume(float v) { this.volume = v; }

  // ---------- Shader ----------
  private static final String VERTEX_SHADER =
      "uniform mat4 uMatrix;\n" +
      "uniform mat4 uMVPMatrix;\n" +
      "uniform float uTime;\n" +
      "attribute vec3 aPosition;\n" +
      "attribute vec2 aAttr;\n" +       // size, brightness
      "attribute float aPhase;\n" +     // 漂移相位
      "attribute vec3 aColor;\n" +
      "varying vec3 vColor;\n" +
      "varying float vBright;\n" +
      "void main() {\n" +
      "  float t = uTime * 0.18;\n" +
      "  vec3 pos = aPosition;\n" +
      "  pos.x += sin(t + aPhase) * 0.4;\n" +
      "  pos.y += cos(t * 0.8 + aPhase * 1.3) * 0.35;\n" +
      "  pos.z += sin(t * 0.6 + aPhase * 0.7) * 0.3;\n" +
      "  vec4 wp = uMatrix * vec4(pos, 1.0);\n" +
      "  gl_Position = uMVPMatrix * wp;\n" +
      "  gl_PointSize = aAttr.x;\n" +
      "  vColor = aColor;\n" +
      "  vBright = aAttr.y;\n" +
      "}\n";

  private static final String FRAGMENT_SHADER =
      "precision mediump float;\n" +
      "varying vec3 vColor;\n" +
      "varying float vBright;\n" +
      "void main() {\n" +
      "  vec2 c = gl_PointCoord - vec2(0.5);\n" +
      "  float d = length(c);\n" +
      "  if (d > 0.5) discard;\n" +
      "  float glow = exp(-d * d * 8.0);\n" +
      "  gl_FragColor = vec4(vColor * glow * vBright, glow * vBright);\n" +
      "}\n";

  @Override
  public void onSurfaceCreated(GL10 gl, EGLConfig config) {
    int vs = compileShader(GLES20.GL_VERTEX_SHADER, VERTEX_SHADER);
    int fs = compileShader(GLES20.GL_FRAGMENT_SHADER, FRAGMENT_SHADER);
    program = GLES20.glCreateProgram();
    GLES20.glAttachShader(program, vs);
    GLES20.glAttachShader(program, fs);
    GLES20.glLinkProgram(program);
    int[] status = new int[1];
    GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, status, 0);
    if (status[0] == 0) {
      throw new RuntimeException("Galaxy shader link failed: " + GLES20.glGetProgramInfoLog(program));
    }
    aPosition = GLES20.glGetAttribLocation(program, "aPosition");
    aAttr = GLES20.glGetAttribLocation(program, "aAttr");
    aColor = GLES20.glGetAttribLocation(program, "aColor");
    uMatrix = GLES20.glGetUniformLocation(program, "uMatrix");
    uMVPMatrix = GLES20.glGetUniformLocation(program, "uMVPMatrix");
    uTime = GLES20.glGetUniformLocation(program, "uTime");
    aPhase = GLES20.glGetAttribLocation(program, "aPhase");

    // 生成星系粒子
    float[] galaxyData = generateGalaxy();
    galaxyCount = galaxyData.length / FLOATS_PER_PARTICLE;
    galaxyVbo = createVbo(galaxyData);

    GLES20.glEnable(GLES20.GL_BLEND);
    GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
    GLES20.glClearColor(0f, 0f, 0f, 0f);
  }

  /** 横向银河带粒子(中心密边缘疏, 白色, 大小景深) */
  private float[] generateGalaxy() {
    float[] data = new float[GALAXY_PARTICLES * FLOATS_PER_PARTICLE];
    int idx = 0;
    java.util.Random rnd = new java.util.Random(42);
    for (int i = 0; i < GALAXY_PARTICLES; i++) {
      // 横向分散银河带: x ∈ [-9,9] 横贯, 中心仅略密(包裹歌词), 边缘延伸
      float x;
      float rr = rnd.nextFloat();
      if (rr < 0.45f) {
        // 中心区(包裹歌词, 密度略高但分散): ±2.5
        x = (rnd.nextFloat() - 0.5f) * 5.0f;
      } else {
        // 边缘延伸带: ±2.5 → ±9, 均匀分散
        float edge = (rr - 0.45f) / 0.55f; // 0-1
        x = (edge < 0.5f ? -1 : 1) * (2.5f + edge * 6.5f);
      }
      // z 薄带(±0.8), y 扁平(±0.35), 带内均匀
      float z = (rnd.nextFloat() - 0.5f) * 1.6f;
      float y = (rnd.nextFloat() - 0.5f) * 0.7f;

      // 大小: 大多数小(针尖), 少数大(光斑景深)
      float size;
      float szr = rnd.nextFloat();
      if (szr < 0.7f) size = 2.0f + rnd.nextFloat() * 2.5f;      // 小粒子
      else if (szr < 0.92f) size = 5.0f + rnd.nextFloat() * 5.0f; // 中粒子
      else size = 12.0f + rnd.nextFloat() * 12.0f;                // 大光斑(模糊)
      float bright = 0.35f + rnd.nextFloat() * 0.65f;     // 亮度

      // 白色粒子(微冷白, 极少量微蓝紫)
      float cr, cg, cb;
      float wh = 0.85f + rnd.nextFloat() * 0.15f;
      cr = wh;
      cg = wh;
      cb = Math.min(1.0f, wh + 0.02f);
      if (rnd.nextFloat() < 0.06f) { cb = Math.min(1.0f, cb + 0.1f); } // 极少量淡蓝

      float phase = rnd.nextFloat() * 6.2831f;  // 漂移相位

      data[idx++] = x; data[idx++] = y; data[idx++] = z;
      data[idx++] = size; data[idx++] = bright;
      data[idx++] = phase;
      data[idx++] = cr; data[idx++] = cg; data[idx++] = cb;
    }
    return data;
  }

  /** 歌词 → 位图采样 → 粒子 */
  public void setLyric(String text) {
    if (text == null || text.isEmpty()) { lyricCount = 0; return; }
    try {
      Bitmap bmp = renderLyricBitmap(text);
      int w = bmp.getWidth(), h = bmp.getHeight();
      int[] pixels = new int[w * h];
      bmp.getPixels(pixels, 0, w, 0, 0, w, h);

      List<Float> pts = new ArrayList<>();
      int step = Math.max(1, (int) Math.sqrt((double) (w * h) / LYRIC_PARTICLES_MAX));
      for (int py = 0; py < h; py += step) {
        for (int px = 0; px < w; px += step) {
          int alpha = (pixels[py * w + px] >> 24) & 0xff;
          if (alpha < 64) continue;
          // 归一化到歌词面(中心附近 0.9 半径球面片段)
          float lx = (px / (float) w - 0.5f) * 2.0f * 1.1f;
          float ly = (0.5f - py / (float) h) * 1.1f;
          float lz = 0.0f;
          float size = 2.0f + (px * 31 + py * 17) % 10 * 0.2f;
          float bright = 0.55f + ((px * 7 + py * 13) % 10) / 10.0f * 0.45f;
          pts.add(lx); pts.add(ly); pts.add(lz);
          pts.add(size); pts.add(bright);
          pts.add((px * 31 + py * 17) % 100 / 100.0f * 6.2831f); // phase
          // 歌词粒子: 亮白(微冷)
          pts.add(1.0f); pts.add(1.0f); pts.add(1.0f);
        }
      }
      if (pts.size() > 0) {
        float[] arr = new float[pts.size()];
        for (int i = 0; i < pts.size(); i++) arr[i] = pts.get(i);
        lyricVbo = createVbo(arr);
        lyricCount = arr.length / FLOATS_PER_PARTICLE;
      } else {
        lyricCount = 0;
      }
      bmp.recycle();
    } catch (Exception e) {
      lyricCount = 0;
    }
  }

  private Bitmap renderLyricBitmap(String text) {
    int w = 512, h = 128;
    Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bmp);
    Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    paint.setColor(Color.WHITE);
    paint.setTextSize(72);
    paint.setTextAlign(Paint.Align.CENTER);
    // 自动缩小长句
    float textW = paint.measureText(text);
    if (textW > w * 0.92f) paint.setTextSize(72 * (w * 0.92f / textW));
    Paint.FontMetrics fm = paint.getFontMetrics();
    float baseline = (h - (fm.ascent + fm.descent)) / 2 - fm.ascent;
    canvas.drawText(text, w / 2f, baseline, paint);
    return bmp;
  }

  private int createVbo(float[] data) {
    int[] vbo = new int[1];
    GLES20.glGenBuffers(1, vbo, 0);
    GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, vbo[0]);
    FloatBuffer fb = ByteBuffer.allocateDirect(data.length * 4)
        .order(ByteOrder.nativeOrder()).asFloatBuffer();
    fb.put(data).position(0);
    GLES20.glBufferData(GLES20.GL_ARRAY_BUFFER, data.length * 4, fb, GLES20.GL_STATIC_DRAW);
    return vbo[0];
  }

  @Override
  public void onSurfaceChanged(GL10 gl, int width, int height) {
    viewW = Math.max(1, width);
    viewH = Math.max(1, height);
    GLES20.glViewport(0, 0, width, height);
  }

  @Override
  public void onDrawFrame(GL10 gl) {
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
    if (program == 0) return;

    float time = SystemClock.elapsedRealtime() / 1000f;

    // 旋转矩阵: 手指 rotX/rotY + 自转
    float[] rotMat = new float[16];
    Matrix.setIdentityM(rotMat, 0);
    Matrix.rotateM(rotMat, 0, rotY * 57.2958f, 0, 1, 0);
    Matrix.rotateM(rotMat, 0, rotX * 57.2958f, 1, 0, 0);
    Matrix.rotateM(rotMat, 0, time * rotSpeed * 10.0f, 0, 1, 0); // 自转

    // 透视投影(按屏幕宽高比)
    float[] proj = new float[16];
    float aspect = (float) viewW / viewH;
    Matrix.perspectiveM(proj, 0, 50f, aspect, 0.1f, 60f);
    // 平滑逼近缩放目标(双指拉近/释放归位)
    zoomOffset += (zoomTarget - zoomOffset) * 0.12f;
    // 相机向 -z 看, 场景置于 z=-9(银河带横贯); 缩放拉近(最小 z=-3)
    float camZ = -9f + zoomOffset * 1.0f;
    float[] view = new float[16];
    Matrix.setIdentityM(view, 0);
    Matrix.translateM(view, 0, 0f, 0f, camZ);
    float[] mvp = new float[16];
    Matrix.multiplyMM(mvp, 0, proj, 0, view, 0);
    Matrix.multiplyMM(mvp, 0, mvp, 0, rotMat, 0);

    GLES20.glUseProgram(program);
    GLES20.glUniformMatrix4fv(uMatrix, 1, false, rotMat, 0);
    GLES20.glUniformMatrix4fv(uMVPMatrix, 1, false, mvp, 0);
    if (uTime >= 0) GLES20.glUniform1f(uTime, time);

    // 绘制星系粒子
    if (galaxyVbo != 0 && galaxyCount > 0) {
      GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, galaxyVbo);
      bindAttributes();
      GLES20.glDrawArrays(GLES20.GL_POINTS, 0, galaxyCount);
    }

    // 绘制歌词粒子(脉动放大)
    if (lyricVbo != 0 && lyricCount > 0) {
      GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, lyricVbo);
      bindAttributes();
      GLES20.glDrawArrays(GLES20.GL_POINTS, 0, lyricCount);
    }

    GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, 0);
  }

  private void bindAttributes() {
    int stride = FLOATS_PER_PARTICLE * 4;
    GLES20.glEnableVertexAttribArray(aPosition);
    GLES20.glVertexAttribPointer(aPosition, 3, GLES20.GL_FLOAT, false, stride, 0);
    GLES20.glEnableVertexAttribArray(aAttr);
    GLES20.glVertexAttribPointer(aAttr, 2, GLES20.GL_FLOAT, false, stride, 3 * 4);
    GLES20.glEnableVertexAttribArray(aPhase);
    GLES20.glVertexAttribPointer(aPhase, 1, GLES20.GL_FLOAT, false, stride, 5 * 4);
    GLES20.glEnableVertexAttribArray(aColor);
    GLES20.glVertexAttribPointer(aColor, 3, GLES20.GL_FLOAT, false, stride, 6 * 4);
  }

  private int compileShader(int type, String src) {
    int shader = GLES20.glCreateShader(type);
    GLES20.glShaderSource(shader, src);
    GLES20.glCompileShader(shader);
    int[] status = new int[1];
    GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0);
    if (status[0] == 0) {
      String log = GLES20.glGetShaderInfoLog(shader);
      GLES20.glDeleteShader(shader);
      throw new RuntimeException("Galaxy shader compile failed: " + log);
    }
    return shader;
  }
}
