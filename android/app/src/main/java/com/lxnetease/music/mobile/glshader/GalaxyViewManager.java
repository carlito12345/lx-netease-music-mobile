package com.lxnetease.music.mobile.glshader;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

/**
 * GalaxyViewManager - 星河星云原生组件管理器
 * props: lyric / volume / rotSpeed
 * commands: setBands / setLyric / setRot
 */
public class GalaxyViewManager extends SimpleViewManager<GalaxyView> {

  public static final int COMMAND_SET_BANDS = 1;
  public static final int COMMAND_SET_LYRIC = 2;
  public static final int COMMAND_SET_ROT = 3;
  public static final int COMMAND_ADD_ZOOM = 4;
  public static final int COMMAND_RESET_ZOOM = 5;

  @Override
  public String getName() {
    return "GalaxyView";
  }

  @Override
  protected GalaxyView createViewInstance(ThemedReactContext reactContext) {
    return new GalaxyView(reactContext);
  }

  @ReactProp(name = "volume", defaultFloat = 0.0f)
  public void setVolume(GalaxyView view, float v) {
    view.getRenderer().setVolume(v);
  }

  @ReactProp(name = "rotSpeed", defaultFloat = 0.04f)
  public void setRotSpeed(GalaxyView view, float v) {
    view.getRenderer().setRotSpeed(v);
  }

  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
        "setBands", COMMAND_SET_BANDS,
        "setLyric", COMMAND_SET_LYRIC,
        "setRot", COMMAND_SET_ROT,
        "addZoom", COMMAND_ADD_ZOOM,
        "resetZoom", COMMAND_RESET_ZOOM
    );
  }

  @Override
  public void receiveCommand(GalaxyView view, int commandType, @Nullable ReadableArray args) {
    switch (commandType) {
      case COMMAND_SET_BANDS: {
        if (args != null && args.size() >= 1 && args.getArray(0) != null) {
          ReadableArray arr = args.getArray(0);
          float[] bands = new float[arr.size()];
          for (int i = 0; i < arr.size(); i++) bands[i] = (float) arr.getDouble(i);
          view.getRenderer().setBands(bands);
        }
        break;
      }
      case COMMAND_SET_LYRIC: {
        if (args != null && args.size() >= 1) {
          view.getRenderer().setLyric(args.getString(0));
        }
        break;
      }
      case COMMAND_SET_ROT: {
        if (args != null && args.size() >= 2) {
          view.getRenderer().setRot((float) args.getDouble(0), (float) args.getDouble(1));
        }
        break;
      }
      case COMMAND_ADD_ZOOM: {
        if (args != null && args.size() >= 1) {
          view.getRenderer().addZoom((float) args.getDouble(0));
        }
        break;
      }
      case COMMAND_RESET_ZOOM: {
        view.getRenderer().resetZoom();
        break;
      }
    }
  }
}
