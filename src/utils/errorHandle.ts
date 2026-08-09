import { Alert } from 'react-native'
// import { exitApp } from '@/utils/common'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'
import { toast } from './tools'
import { crashLog } from './crashLog'

const errorHandler = (e: Error, isFatal: boolean) => {
  const excludedErrors = [
    'Failed to construct \'Response\'',
  ]
  // 写入共享日志(MT2 可读)
  crashLog(`[JS ${isFatal ? 'FATAL' : 'ERROR'}] ${e.name}: ${e.message}\n${(e.stack ?? '').slice(0, 2000)}`)
  if (isFatal) {
    if (excludedErrors.some((excludedError) => e.message.includes(excludedError))) {
      toast('应用遇到了错误,如果你有固定的重现方式,请截图并在 GitHub 反馈(并附上刚才你进行了什么操作,以及“设置-错误日志”的内容)')
    } else {
      Alert.alert(
        '💥Unexpected error occurred💥',
        `
  应用出 bug 了😭,以下是错误异常信息。请截图并在 GitHub 反馈(并附上刚才你进行了什么操作,以及附上“设置-错误日志”的内容)。现在应用可能会出现异常,若出现异常请尝试强制结束应用后重新启动!

  Error:
  ${isFatal ? 'Fatal:' : ''} ${e.name} ${e.message}
  `,
        [{
          text: '关闭 (Close)',
          onPress: () => {
            // exitApp()
          },
        }],
      )
    }
  }
  log.error(e.stack)
}

// 无论 dev/prod 都启用,便于闪退排查(dev bundle 下默认不启用导致闪退无日志)
setJSExceptionHandler(errorHandler, true)

// 注意: 第二个参数 forceApplicationToQuit 必须传 false!
// 库实现中 uncaughtException -> callbackHolder.invoke() 是异步 bridge 调用,
// 若传 true 会立即 System.exit(0),JS 回调(写 crash.log)根本没机会执行。
// 传 false 让进程存活,错误 UI 弹出期间完成日志写入,用户点 QUIT/RELAUNCH 再退出。
setNativeExceptionHandler((errorString) => {
  crashLog(`[NATIVE CRASH] ${errorString.slice(0, 6000)}`)
  log.error(errorString)
  console.log('+++++', errorString, '+++++')
}, false)
