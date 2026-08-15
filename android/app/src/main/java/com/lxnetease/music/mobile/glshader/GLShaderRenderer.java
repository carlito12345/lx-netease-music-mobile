package com.lxnetease.music.mobile.glshader;

import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.os.SystemClock;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * GLShaderRenderer - GLES20 shader 渲染器
 * 支持: 时间 / 分辨率 / 触摸坐标 / 16频段频谱 / 音量 / 基础色 / 振幅频率参数
 */
public class GLShaderRenderer implements GLSurfaceView.Renderer {

  // 全屏三角形 (位置+UV, 2 三角形)
  private static final float[] FULLSCREEN_VERTICES = {
      -1f, -1f, 0f, 0f,
       1f, -1f, 1f, 0f,
      -1f,  1f, 0f, 1f,
       1f,  1f, 1f, 1f,
  };

  private static final int STRIDE_BYTES = 4 * 4; // 4 floats

  private static final String VERTEX_SHADER =
      "attribute vec2 aPosition;\n" +
      "attribute vec2 aUv;\n" +
      "varying vec2 vUv;\n" +
      "void main() {\n" +
      "    vUv = aUv;\n" +
      "    gl_Position = vec4(aPosition, 0.0, 1.0);\n" +
      "}\n";

  private int program = 0;
  private int positionHandle = -1;
  private int uvHandle = -1;
  private int timeHandle = -1;
  private int resolutionHandle = -1;
  private int mouseHandle = -1;
  private int baseColorHandle = -1;
  private int volumeHandle = -1;
  private int bands0Handle = -1;
  private int bands1Handle = -1;
  private int bands2Handle = -1;
  private int bands3Handle = -1;
  private int amplitudeHandle = -1;
  private int frequencyXHandle = -1;
  private int frequencyYHandle = -1;
  private int ripplesHandle = -1;
  private int meteorHandle = -1;
  private int craterHandle = -1;
  private int metalnessHandle = -1;
  private int neonHandle = -1;
  private int camHHandle = -1, camDHandle = -1, camSpeedHandle = -1, fovHandle = -1;
  private int cellHandle = -1, halfWHandle = -1, hScaleHandle = -1;
  private int warmHandle = -1, greenHandle = -1, coolHandle = -1, bgHandle = -1;
  private int presenceHandle = -1, brillianceHandle = -1, floatingHandle = -1;

  private final FloatBuffer vertexBuffer;
  private long startTimeMs = 0;
  private int surfaceWidth = 1;
  private int surfaceHeight = 1;

  private String shaderSource = null;
  private volatile float mouseX = 0.5f;
  private volatile float mouseY = 0.5f;
  private volatile float[] bands = new float[16];
  private volatile float volume = 0f;

  // 涟漪(最多8个): x, z, startTime(ms), strength
  private final float[] rippleX = new float[8];
  private final float[] rippleZ = new float[8];
  private final float[] rippleStart = new float[8];
  private final float[] rippleStrength = new float[8];
  private int rippleCount = 0;

  // 流星: 活跃/位置/起始时间
  private volatile boolean meteorActive = false;
  private volatile float meteorX = 0f;
  private volatile float meteorY = 0f;
  private volatile float meteorZ = 0f;
  private volatile float meteorStart = 0f;
  private volatile float meteorSpeed = 1f;

  // 流星炸坑: x, z, startTime, strength
  private volatile float craterX = 0f;
  private volatile float craterZ = 0f;
  private volatile float craterStart = 0f;
  private volatile float craterStrength = 0f;
  private volatile float baseColorR = 0.3f;
  private volatile float baseColorG = 0.5f;
  private volatile float baseColorB = 0.9f;
  private volatile float amplitude = 0.06f;
  private volatile float frequencyX = 2.0f;
  private volatile float frequencyY = 1.5f;
  private volatile float metalness = 0.8f;   // 金属感(默认当前效果)
  private volatile float neon = 0.5f;        // 荧光

  // 可调参数(面板)
  private volatile float camHeight = 6.5f;   // 相机高度
  private volatile float camDist = 12.5f;    // 相机距离
  private volatile float camSpeed = 0.06f;   // 相机旋转速度
  private volatile float fov = 1.7f;         // 视场宽度
  private volatile float cell = 0.5f;        // 柱间距
  private volatile float halfW = 0.15f;      // 柱半宽
  private volatile float hScale = 1.0f;      // 柱高倍率
  private volatile float warmR = 1.0f, warmG = 0.3f, warmB = 0.55f;   // 玫红
  private volatile float greenR = 0.2f, greenG = 1.0f, greenB = 0.5f; // 荧光绿
  private volatile float coolR = 0.5f, coolG = 0.45f, coolB = 1.5f;   // 紫蓝
  private volatile float bgR = 0.02f, bgG = 0.012f, bgB = 0.045f;     // 背景
  private volatile float presence = 0.0f;   // 高频存在感(顶面闪光)
  private volatile float brilliance = 0.0f; // 明亮度(边缘闪烁)
  private volatile float[] floating = new float[8 * 4]; // 漂浮方块 x,y,z,size

  public GLShaderRenderer() {
    ByteBuffer bb = ByteBuffer.allocateDirect(FULLSCREEN_VERTICES.length * 4);
    bb.order(ByteOrder.nativeOrder());
    vertexBuffer = bb.asFloatBuffer();
    vertexBuffer.put(FULLSCREEN_VERTICES);
    vertexBuffer.position(0);
  }

  public void setShaderSource(String source) {
    this.shaderSource = source;
    // 需要 GL 线程重建 program
    if (program != 0) {
      // 简单标记, onSurfaceCreated 时会重建; 这里让 renderer 重建
      // (GL 操作必须在 GL 线程, 通过 queueEvent)
    }
  }

  public void setMouse(float x, float y) {
    this.mouseX = x;
    this.mouseY = y;
  }

  public void setBands(float[] bands) {
    if (bands != null) this.bands = bands.clone();
  }

  public void setVolume(float volume) {
    this.volume = volume;
  }

  public void setBaseColor(float r, float g, float b) {
    this.baseColorR = r;
    this.baseColorG = g;
    this.baseColorB = b;
  }

  public void setParams(float amplitude, float frequencyX, float frequencyY) {
    this.amplitude = amplitude;
    this.frequencyX = frequencyX;
    this.frequencyY = frequencyY;
  }

  /** 添加涟漪(地形波动) */
  public void addRipple(float x, float z, float strength) {
    int idx = rippleCount % 8;
    rippleX[idx] = x;
    rippleZ[idx] = z;
    rippleStart[idx] = SystemClock.elapsedRealtime();
    rippleStrength[idx] = strength;
    rippleCount++;
  }

  /** 生成流星(原版: 0.55s 冷却, 速度随强度) */
  public void spawnMeteor(float strength) {
    long now = SystemClock.elapsedRealtime();
    if (now - lastMeteorAtMs < 550) return;  // 0.55s 冷却
    lastMeteorAtMs = now;
    float angle = (float) (Math.random() * Math.PI * 2.0);
    float dist = (float) (Math.random() * 25.0);
    meteorX = (float) Math.cos(angle) * dist;
    meteorZ = (float) Math.sin(angle) * dist;
    meteorY = 30.0f + (float) (Math.random() * 10.0);
    meteorStart = now;
    meteorSpeed = 1.0f + (float) (Math.random() * 0.5f) + strength * 1.5f;
    meteorActive = true;
  }

  private volatile long lastMeteorAtMs = 0;

  public void setMetalness(float v) { this.metalness = v; }
  public void setNeon(float v) { this.neon = v; }
  public void setCam(float h, float d, float speed, float fov) { this.camHeight = h; this.camDist = d; this.camSpeed = speed; this.fov = fov; }
  public void setPillar(float cell, float halfW, float hScale) { this.cell = cell; this.halfW = halfW; this.hScale = hScale; }
  public void setColors(float wr, float wg, float wb, float gr, float gg, float gb, float cr, float cg, float cb) {
    warmR = wr; warmG = wg; warmB = wb; greenR = gr; greenG = gg; greenB = gb; coolR = cr; coolG = cg; coolB = cb;
  }
  public void setBg(float r, float g, float b) { bgR = r; bgG = g; bgB = b; }
  public void setPresence(float v) { this.presence = v; }
  public void setBrilliance(float v) { this.brilliance = v; }
  public void setFloating(float[] arr) { if (arr != null && arr.length == 32) this.floating = arr; }

  public float camHeight() { return camHeight; }
  public float camDist() { return camDist; }
  public float camSpeed() { return camSpeed; }
  public float fov() { return fov; }
  public float cell() { return cell; }
  public float halfW() { return halfW; }
  public float hScale() { return hScale; }

  public float amplitude() { return amplitude; }
  public float frequencyX() { return frequencyX; }
  public float frequencyY() { return frequencyY; }

  private int compileShader(int type, String source) {
    int shader = GLES20.glCreateShader(type);
    GLES20.glShaderSource(shader, source);
    GLES20.glCompileShader(shader);
    int[] status = new int[1];
    GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0);
    if (status[0] == 0) {
      String log = GLES20.glGetShaderInfoLog(shader);
      android.util.Log.e("GLShader", "Shader compile failed: " + log);
      GLShaderView.fileLog("SHADER_COMPILE_FAILED: " + log.replace("\n", " | "));
      GLES20.glDeleteShader(shader);
      return 0;
    }
    return shader;
  }

  private int createProgram(String vertexSrc, String fragmentSrc) {
    int vs = compileShader(GLES20.GL_VERTEX_SHADER, vertexSrc);
    if (vs == 0) return 0;
    int fs = compileShader(GLES20.GL_FRAGMENT_SHADER, fragmentSrc);
    if (fs == 0) {
      GLES20.glDeleteShader(vs);
      return 0;
    }
    int prog = GLES20.glCreateProgram();
    GLES20.glAttachShader(prog, vs);
    GLES20.glAttachShader(prog, fs);
    GLES20.glLinkProgram(prog);
    int[] status = new int[1];
    GLES20.glGetProgramiv(prog, GLES20.GL_LINK_STATUS, status, 0);
    if (status[0] == 0) {
      String log = GLES20.glGetProgramInfoLog(prog);
      android.util.Log.e("GLShader", "Program link failed: " + log);
      GLShaderView.fileLog("PROGRAM_LINK_FAILED: " + log);
      GLES20.glDeleteProgram(prog);
      return 0;
    }
    GLES20.glDeleteShader(vs);
    GLES20.glDeleteShader(fs);
    return prog;
  }

  @Override
  public void onSurfaceCreated(GL10 gl, EGLConfig config) {
    GLES20.glDisable(GLES20.GL_DEPTH_TEST);
    GLES20.glDisable(GLES20.GL_CULL_FACE);
    startTimeMs = SystemClock.elapsedRealtime();
    GLShaderView.fileLog("SURFACE_CREATED shaderSource=" + (shaderSource != null));
    if (shaderSource == null) return;
    program = createProgram(VERTEX_SHADER, shaderSource);
    GLShaderView.fileLog("PROGRAM_CREATED id=" + program);
    if (program == 0) return;
    positionHandle = GLES20.glGetAttribLocation(program, "aPosition");
    uvHandle = GLES20.glGetAttribLocation(program, "aUv");
    timeHandle = GLES20.glGetUniformLocation(program, "uTime");
    resolutionHandle = GLES20.glGetUniformLocation(program, "uResolution");
    mouseHandle = GLES20.glGetUniformLocation(program, "uMouse");
    baseColorHandle = GLES20.glGetUniformLocation(program, "uBaseColor");
    volumeHandle = GLES20.glGetUniformLocation(program, "uVolume");
    bands0Handle = GLES20.glGetUniformLocation(program, "uBands0");
    bands1Handle = GLES20.glGetUniformLocation(program, "uBands1");
    bands2Handle = GLES20.glGetUniformLocation(program, "uBands2");
    bands3Handle = GLES20.glGetUniformLocation(program, "uBands3");
    amplitudeHandle = GLES20.glGetUniformLocation(program, "uAmplitude");
    frequencyXHandle = GLES20.glGetUniformLocation(program, "uFrequencyX");
    frequencyYHandle = GLES20.glGetUniformLocation(program, "uFrequencyY");
    ripplesHandle = GLES20.glGetUniformLocation(program, "uRipples");
    meteorHandle = GLES20.glGetUniformLocation(program, "uMeteor");
    craterHandle = GLES20.glGetUniformLocation(program, "uCrater");
    metalnessHandle = GLES20.glGetUniformLocation(program, "uMetalness");
    neonHandle = GLES20.glGetUniformLocation(program, "uNeon");
    camHHandle = GLES20.glGetUniformLocation(program, "uCamH");
    camDHandle = GLES20.glGetUniformLocation(program, "uCamD");
    camSpeedHandle = GLES20.glGetUniformLocation(program, "uCamSpeed");
    fovHandle = GLES20.glGetUniformLocation(program, "uFov");
    cellHandle = GLES20.glGetUniformLocation(program, "uCell");
    halfWHandle = GLES20.glGetUniformLocation(program, "uHalfW");
    hScaleHandle = GLES20.glGetUniformLocation(program, "uHScale");
    warmHandle = GLES20.glGetUniformLocation(program, "uWarmCol");
    greenHandle = GLES20.glGetUniformLocation(program, "uGreenCol");
    coolHandle = GLES20.glGetUniformLocation(program, "uCoolCol");
    bgHandle = GLES20.glGetUniformLocation(program, "uBgCol");
    presenceHandle = GLES20.glGetUniformLocation(program, "uPresence");
    brillianceHandle = GLES20.glGetUniformLocation(program, "uBrilliance");
    floatingHandle = GLES20.glGetUniformLocation(program, "uFloating");
  }

  @Override
  public void onSurfaceChanged(GL10 gl, int width, int height) {
    surfaceWidth = Math.max(width, 1);
    surfaceHeight = Math.max(height, 1);
    GLES20.glViewport(0, 0, surfaceWidth, surfaceHeight);
  }

  @Override
  public void onDrawFrame(GL10 gl) {
    // 半透明混合: 透出下层封面/特效
    GLES20.glEnable(GLES20.GL_BLEND);
    GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
    GLES20.glClearColor(0.05f, 0.05f, 0.08f, 0f);
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
    if (program == 0) {
      // 编译失败: 渲染半透明深色(不黑屏)
      GLES20.glEnableVertexAttribArray(0);
      return;
    }

    float time = (SystemClock.elapsedRealtime() - startTimeMs) / 1000f;
    GLES20.glUseProgram(program);

    // 顶点
    vertexBuffer.position(0);
    if (positionHandle >= 0) {
      GLES20.glEnableVertexAttribArray(positionHandle);
      GLES20.glVertexAttribPointer(positionHandle, 2, GLES20.GL_FLOAT, false, STRIDE_BYTES, vertexBuffer);
    }
    if (uvHandle >= 0) {
      GLES20.glEnableVertexAttribArray(uvHandle);
      vertexBuffer.position(2);
      GLES20.glVertexAttribPointer(uvHandle, 2, GLES20.GL_FLOAT, false, STRIDE_BYTES, vertexBuffer);
    }

    // uniforms (存在才设置)
    if (timeHandle >= 0) GLES20.glUniform1f(timeHandle, time);
    if (resolutionHandle >= 0) GLES20.glUniform3f(resolutionHandle, surfaceWidth, surfaceHeight, 1f);
    if (mouseHandle >= 0) GLES20.glUniform2f(mouseHandle, mouseX, mouseY);
    if (baseColorHandle >= 0) GLES20.glUniform3f(baseColorHandle, baseColorR, baseColorG, baseColorB);
    if (volumeHandle >= 0) GLES20.glUniform1f(volumeHandle, volume);
    if (bands0Handle >= 0) GLES20.glUniform4f(bands0Handle, bands[0], bands[1], bands[2], bands[3]);
    if (bands1Handle >= 0) GLES20.glUniform4f(bands1Handle, bands[4], bands[5], bands[6], bands[7]);
    if (bands2Handle >= 0) GLES20.glUniform4f(bands2Handle, bands[8], bands[9], bands[10], bands[11]);
    if (bands3Handle >= 0) GLES20.glUniform4f(bands3Handle, bands[12], bands[13], bands[14], bands[15]);
    if (amplitudeHandle >= 0) GLES20.glUniform1f(amplitudeHandle, amplitude);
    if (frequencyXHandle >= 0) GLES20.glUniform1f(frequencyXHandle, frequencyX);
    if (frequencyYHandle >= 0) GLES20.glUniform1f(frequencyYHandle, frequencyY);
    if (metalnessHandle >= 0) GLES20.glUniform1f(metalnessHandle, metalness);
    if (neonHandle >= 0) GLES20.glUniform1f(neonHandle, neon);
    if (camHHandle >= 0) GLES20.glUniform1f(camHHandle, camHeight);
    if (camDHandle >= 0) GLES20.glUniform1f(camDHandle, camDist);
    if (camSpeedHandle >= 0) GLES20.glUniform1f(camSpeedHandle, camSpeed);
    if (fovHandle >= 0) GLES20.glUniform1f(fovHandle, fov);
    if (cellHandle >= 0) GLES20.glUniform1f(cellHandle, cell);
    if (halfWHandle >= 0) GLES20.glUniform1f(halfWHandle, halfW);
    if (hScaleHandle >= 0) GLES20.glUniform1f(hScaleHandle, hScale);
    if (warmHandle >= 0) GLES20.glUniform3f(warmHandle, warmR, warmG, warmB);
    if (greenHandle >= 0) GLES20.glUniform3f(greenHandle, greenR, greenG, greenB);
    if (coolHandle >= 0) GLES20.glUniform3f(coolHandle, coolR, coolG, coolB);
    if (bgHandle >= 0) GLES20.glUniform3f(bgHandle, bgR, bgG, bgB);
    if (presenceHandle >= 0) GLES20.glUniform1f(presenceHandle, presence);
    if (brillianceHandle >= 0) GLES20.glUniform1f(brillianceHandle, brilliance);
    if (floatingHandle >= 0) GLES20.glUniform4fv(floatingHandle, 8, floating, 0);
    if (ripplesHandle >= 0) {
      // 涟漪数组(8 x vec4: x,z,startTimeMs,strength), 非活跃为0
      float[] r = new float[32];
      long now = SystemClock.elapsedRealtime();
      for (int i = 0; i < 8; i++) {
        float ageSec = (rippleStart[i] == 0) ? 999f : (now - rippleStart[i]) / 1000f;
        boolean alive = rippleStart[i] != 0 && ageSec < 4.8f;
        r[i * 4] = alive ? rippleX[i] : 0f;
        r[i * 4 + 1] = alive ? rippleZ[i] : 0f;
        r[i * 4 + 2] = alive ? ageSec : 0f;  // 传年龄(秒), shader 用 uTime 对齐
        r[i * 4 + 3] = alive ? rippleStrength[i] : 0f;
      }
      GLES20.glUniform4fv(ripplesHandle, 8, r, 0);
    }
    if (meteorHandle >= 0) {
      float nowSec = (SystemClock.elapsedRealtime() - startTimeMs) / 1000f;
      float meteorAge = meteorActive ? (nowSec - (meteorStart - startTimeMs) / 1000f) : 99f;
      boolean alive = meteorActive && meteorAge < 2.2f;
      if (!alive && meteorActive && meteorAge >= 2.2f) {
        // 落地: 炸坑 + 强涟漪扩散
        craterX = meteorX; craterZ = meteorZ;
        craterStart = SystemClock.elapsedRealtime();
        craterStrength = 1.8f;
        addRipple(meteorX, meteorZ, -2.2f);  // 负值=白色强涟漪
        meteorActive = false;
      }
      GLES20.glUniform4f(meteorHandle,
          alive ? meteorX : 0f,
          alive ? meteorY : -100f,
          alive ? meteorZ : 0f,
          alive ? meteorAge : 0f);
    }
    if (craterHandle >= 0) {
      float craterAge = (craterStart == 0f) ? 99f : (SystemClock.elapsedRealtime() - craterStart) / 1000f;
      boolean craterAlive = craterStart != 0f && craterAge < 1.8f;
      GLES20.glUniform4f(craterHandle,
          craterAlive ? craterX : 0f,
          craterAlive ? craterZ : 0f,
          craterAlive ? craterAge : 0f,
          craterAlive ? craterStrength : 0f);
    }

    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);

    if (positionHandle >= 0) GLES20.glDisableVertexAttribArray(positionHandle);
    if (uvHandle >= 0) GLES20.glDisableVertexAttribArray(uvHandle);
  }
}
