package com.lxnetease.music.mobile.glshader;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

/**
 * GLShaderViewManager - RN 视图管理器
 * props: shaderSource / interactive / baseColor / amplitude / frequencyX / frequencyY
 * 频谱: setBands 命令
 */
public class GLShaderViewManager extends SimpleViewManager<GLShaderView> {

  public static final String REACT_CLASS = "GLShaderView";
  public static final int COMMAND_SET_BANDS = 1;
  public static final int COMMAND_SET_VOLUME = 2;
  public static final int COMMAND_SET_PRESENCE = 6;
  public static final int COMMAND_SET_BRILLIANCE = 7;
  public static final int COMMAND_SET_MOUSE = 3;
  public static final int COMMAND_ADD_RIPPLE = 4;
  public static final int COMMAND_SPAWN_METEOR = 5;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected GLShaderView createViewInstance(ThemedReactContext reactContext) {
    return new GLShaderView(reactContext);
  }

  @ReactProp(name = "shaderSource")
  public void setShaderSource(GLShaderView view, @Nullable String source) {
    if (source != null) view.setShaderSource(source);
  }

  @ReactProp(name = "interactive", defaultBoolean = false)
  public void setInteractive(GLShaderView view, boolean interactive) {
    view.setInteractive(interactive);
  }

  @ReactProp(name = "baseColor")
  public void setBaseColor(GLShaderView view, @Nullable ReadableArray color) {
    if (color != null && color.size() >= 3) {
      view.setBaseColor((float) color.getDouble(0), (float) color.getDouble(1), (float) color.getDouble(2));
    }
  }

  @ReactProp(name = "amplitude", defaultFloat = 0.06f)
  public void setAmplitude(GLShaderView view, float amplitude) {
    view.setParams(amplitude, view.getRenderer().frequencyX(), view.getRenderer().frequencyY());
  }

  @ReactProp(name = "frequencyX", defaultFloat = 2.0f)
  public void setFrequencyX(GLShaderView view, float frequencyX) {
    view.setParams(view.getRenderer().amplitude(), frequencyX, view.getRenderer().frequencyY());
  }

  @ReactProp(name = "frequencyY", defaultFloat = 1.5f)
  public void setFrequencyY(GLShaderView view, float frequencyY) {
    view.setParams(view.getRenderer().amplitude(), view.getRenderer().frequencyX(), frequencyY);
  }

  @ReactProp(name = "metalness", defaultFloat = 0.8f)
  public void setMetalness(GLShaderView view, float metalness) {
    view.getRenderer().setMetalness(metalness);
  }

  @ReactProp(name = "neon", defaultFloat = 0.5f)
  public void setNeon(GLShaderView view, float neon) {
    view.getRenderer().setNeon(neon);
  }

  @ReactProp(name = "camHeight", defaultFloat = 6.5f)
  public void setCamHeight(GLShaderView view, float v) {
    view.getRenderer().setCam(v, view.getRenderer().camDist(), view.getRenderer().camSpeed(), view.getRenderer().fov());
  }
  @ReactProp(name = "camDist", defaultFloat = 12.5f)
  public void setCamDist(GLShaderView view, float v) {
    view.getRenderer().setCam(view.getRenderer().camHeight(), v, view.getRenderer().camSpeed(), view.getRenderer().fov());
  }
  @ReactProp(name = "camSpeed", defaultFloat = 0.06f)
  public void setCamSpeed(GLShaderView view, float v) {
    view.getRenderer().setCam(view.getRenderer().camHeight(), view.getRenderer().camDist(), v, view.getRenderer().fov());
  }
  @ReactProp(name = "fov", defaultFloat = 1.7f)
  public void setFov(GLShaderView view, float v) {
    view.getRenderer().setCam(view.getRenderer().camHeight(), view.getRenderer().camDist(), view.getRenderer().camSpeed(), v);
  }
  @ReactProp(name = "pillarCell", defaultFloat = 0.5f)
  public void setPillarCell(GLShaderView view, float v) {
    view.getRenderer().setPillar(v, view.getRenderer().halfW(), view.getRenderer().hScale());
  }
  @ReactProp(name = "pillarWidth", defaultFloat = 0.15f)
  public void setPillarWidth(GLShaderView view, float v) {
    view.getRenderer().setPillar(view.getRenderer().cell(), v, view.getRenderer().hScale());
  }
  @ReactProp(name = "pillarHeight", defaultFloat = 1.0f)
  public void setPillarHeight(GLShaderView view, float v) {
    view.getRenderer().setPillar(view.getRenderer().cell(), view.getRenderer().halfW(), v);
  }
  @ReactProp(name = "palette")
  public void setPalette(GLShaderView view, @Nullable ReadableArray colors) {
    if (colors != null && colors.size() >= 9) {
      view.getRenderer().setColors(
        (float) colors.getDouble(0), (float) colors.getDouble(1), (float) colors.getDouble(2),
        (float) colors.getDouble(3), (float) colors.getDouble(4), (float) colors.getDouble(5),
        (float) colors.getDouble(6), (float) colors.getDouble(7), (float) colors.getDouble(8));
    }
  }
  @ReactProp(name = "bgColor")
  public void setBgColor(GLShaderView view, @Nullable ReadableArray c) {
    if (c != null && c.size() >= 3) {
      view.getRenderer().setBg((float) c.getDouble(0), (float) c.getDouble(1), (float) c.getDouble(2));
    }
  }

  @ReactProp(name = "presence", defaultFloat = 0.0f)
  public void setPresence(GLShaderView view, float v) {
    view.getRenderer().setPresence(v);
  }

  @ReactProp(name = "brilliance", defaultFloat = 0.0f)
  public void setBrilliance(GLShaderView view, float v) {
    view.getRenderer().setBrilliance(v);
  }

  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
        "setBands", COMMAND_SET_BANDS,
        "setVolume", COMMAND_SET_VOLUME,
        "setPresence", COMMAND_SET_PRESENCE,
        "setBrilliance", COMMAND_SET_BRILLIANCE,
        "setMouse", COMMAND_SET_MOUSE,
        "addRipple", COMMAND_ADD_RIPPLE,
        "spawnMeteor", COMMAND_SPAWN_METEOR
    );
  }

  @Override
  public void receiveCommand(GLShaderView view, int commandType, @Nullable ReadableArray args) {
    switch (commandType) {
      case COMMAND_SET_BANDS: {
        if (args != null && args.size() >= 1 && args.getArray(0) != null) {
          ReadableArray arr = args.getArray(0);
          int n = Math.min(arr.size(), 16);
          float[] bands = new float[16];
          for (int i = 0; i < n; i++) bands[i] = (float) arr.getDouble(i);
          view.setBands(bands);
        }
        break;
      }
      case COMMAND_SET_VOLUME: {
        if (args != null && args.size() >= 1) {
          view.setVolume((float) args.getDouble(0));
        }
        break;
      }
      case COMMAND_SET_PRESENCE: {
        if (args != null && args.size() >= 1) {
          view.setPresence((float) args.getDouble(0));
        }
        break;
      }
      case COMMAND_SET_BRILLIANCE: {
        if (args != null && args.size() >= 1) {
          view.setBrilliance((float) args.getDouble(0));
        }
        break;
      }
      case COMMAND_SET_MOUSE: {
        if (args != null && args.size() >= 2) {
          view.getRenderer().setMouse((float) args.getDouble(0), (float) args.getDouble(1));
        }
        break;
      }
      case COMMAND_ADD_RIPPLE: {
        if (args != null && args.size() >= 3) {
          view.getRenderer().addRipple((float) args.getDouble(0), (float) args.getDouble(1), (float) args.getDouble(2));
        }
        break;
      }
      case COMMAND_SPAWN_METEOR: {
        view.getRenderer().spawnMeteor(args != null && args.size() >= 1 ? (float) args.getDouble(0) : 0.6f);
        break;
      }
    }
  }
}
