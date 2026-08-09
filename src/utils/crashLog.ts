/**
 * crashLog — 崩溃/关键事件日志
 *
 * 将 JS 异常、原生异常与关键生命周期事件写入共享存储日志文件,
 * 便于在 App 无法启动/闪退时从 MT2 等文件管理器读取排查。
 *
 * 日志路径: /storage/emulated/0/MT2/mcp/LXMUSIC-test/crash.log
 * 兜底路径: App 私有 DocumentDir/crash.log
 *
 * 写入串行化(队列),保证多次启动/并发打点不乱序、不互相覆盖。
 */

import { appendFile, writeFile, mkdir, existsFile, externalStorageDirectoryPath, privateStorageDirectoryPath } from '@/utils/fs'

const LOG_REL = 'MT2/mcp/LXMUSIC-test/crash.log'
const FALLBACK_NAME = 'crash.log'

let inited = false

const pad = (n: number) => String(n).padStart(2, '0')

export const nowStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 串行写入队列:保证顺序,防止并发 writeFile/appendFile 互相覆盖
let queue: Promise<void> = Promise.resolve()

const doWrite = async (content: string) => {
  // 外部共享存储优先(MT2 可读)
  try {
    const ext = `${externalStorageDirectoryPath}/${LOG_REL}`
    const parent = ext.slice(0, ext.lastIndexOf('/'))
    try { await mkdir(parent) } catch { /* 已存在 */ }
    if (await existsFile(ext)) {
      await appendFile(ext, content)
    } else {
      await writeFile(ext, content)
    }
    return
  } catch {
    // 外部写失败,兜底私有目录(无需权限)
  }
  try {
    const priv = `${privateStorageDirectoryPath}/${FALLBACK_NAME}`
    if (await existsFile(priv)) {
      await appendFile(priv, content)
    } else {
      await writeFile(priv, content)
    }
  } catch {
    // 双失败则静默
  }
}

/**
 * 写入一条日志(带时间戳)。fire-and-forget,串行执行,不阻塞业务。
 */
export const crashLog = (msg: string) => {
  if (!inited) return
  const line = `[${nowStr()}] ${msg}\n`
  // 同步输出到 console/logcat,进程被杀时仍有痕迹
  console.log(`[crashLog] ${line.trim()}`)
  queue = queue.then(() => doWrite(line)).catch(() => {})
}

/**
 * 记录一次启动
 */
export const initCrashLog = () => {
  inited = true
  crashLog(`===== APP START ${nowStr()} =====`)
  crashLog(`platform=android dev=${__DEV__}`)
}
