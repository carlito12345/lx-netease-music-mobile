# lx-N ASR 引擎插件协议 (v1)

ASR(语音识别)引擎完全独立于 lx-N。lx-N 通过 ContentProvider 跨进程调用引擎 APK。
**没有安装任何引擎时,lx-N 不显示语音入口。**

## 1. 引擎 APK 声明

引擎 APK 的 AndroidManifest.xml 必须声明:

```xml
<activity>
  <intent-filter>
    <action android:name="com.lxnetease.asr.ENGINE" />
  </intent-filter>
</activity>
<!-- 或 service 声明, 二选一, 用于 lx-N 发现引擎 -->
<provider
  android:name=".AsrProvider"
  android:authorities="<引擎包名>.asr"
  android:exported="true" />
```

- `intent-filter` action = `com.lxnetease.asr.ENGINE`:lx-N 通过 PackageManager 扫描此 action 发现引擎
- ContentProvider authorities = `<包名>.asr`:lx-N 调用引擎的通道

## 2. ContentProvider 接口

URI 基础: `content://<引擎包名>.asr/`

### 2.1 isAvailable
```
GET content://<包名>.asr/isAvailable
返回: {"available": true, "name": "Vosk 离线识别", "version": "1.0.0"}
```

### 2.2 start (开始识别)
```
GET content://<包名>.asr/start
返回: {"started": true}
```

### 2.3 result (识别结果, 轮询)
```
GET content://<包名>.asr/result
返回: {"text": "刘德华忘情水", "confidence": 0.98, "done": true}
done=false 表示还在识别中
```

### 2.4 stop
```
GET content://<包名>.asr/stop
返回: {"stopped": true}
```

### 2.5 destroy (释放资源)
```
GET content://<包名>.asr/destroy
返回: {"destroyed": true}
```

## 3. 数据格式

- 所有响应均为 JSON 字符串 (ContentProvider 的 String 列)
- text: 识别出的文本(UTF-8)
- confidence: 0~1 置信度

## 4. 引擎要求

- 引擎 APK 自持 `RECORD_AUDIO` 权限, 自申请
- 录音和识别在引擎 APK 自己的进程
- lx-N 只传指令, 不收音频流

## 5. lx-N 行为

- 启动/进入搜索页时扫描引擎
- 无引擎: 不显示麦克风按钮, 设置页提示"未安装语音识别引擎"
- 多引擎: 设置页选择默认引擎
- 调用失败(引擎被卸载): 自动降级, 隐藏入口
