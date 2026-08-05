/**
 * Scanner - 本地音乐递归扫描工具(完整组件)
 * 支持指定文件夹 / 全量扫描, 递归遍历子文件夹
 */
import { readDir, extname } from '@/utils/fs'

export interface ScannedFile {
  name: string
  path: string
  /** 文件大小(字节) */
  size?: number
  /** 封面路径 */
  pic?: string
  /** 码率 */
  bitrate?: string
  /** 时长(秒) */
  interval?: number
  /** 歌手 */
  singer?: string
  /** 专辑 */
  album?: string
}

const AUDIO_EXTS = ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'ape', 'wma', 'opus', 'aiff']

// 持久化缓存文件
import RNFS from 'react-native-fs'
import { readMetadata, readPic } from '@/utils/localMediaMetadata'

const CACHE_FILE = `${RNFS.DocumentDirectoryPath}/lx_local_music_cache.json`

export const saveScanCache = async (files: ScannedFile[]): Promise<void> => {
  try {
    await RNFS.writeFile(CACHE_FILE, JSON.stringify(files), 'utf8')
  } catch {}
}

export const loadScanCache = async (): Promise<ScannedFile[]> => {
  try {
    const exists = await RNFS.exists(CACHE_FILE)
    if (!exists) return []
    const data = await RNFS.readFile(CACHE_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// 读取单个文件的元数据(封面/码率/时长)
export const readFileMetadata = async (file: ScannedFile): Promise<ScannedFile> => {
  try {
    const metadata = await readMetadata(file.path)
    if (metadata) {
      file.bitrate = metadata.bitrate
      file.interval = metadata.interval
      file.singer = metadata.singer
      file.album = metadata.albumName
    }
  } catch {}
  try {
    const pic = await readPic(file.path)
    if (pic) file.pic = pic.startsWith('/') ? `file://${pic}` : pic
  } catch {}
  return file
}

const isAudioFile = (name: string, mimeType?: string): boolean => {
  if (mimeType?.startsWith('audio/')) return true
  const ext = extname(name).toLowerCase().replace('.', '')
  return AUDIO_EXTS.includes(ext)
}

/**
 * 递归扫描目录下的所有音频文件
 */
export const scanRecursive = async (
  dirPath: string,
  onProgress?: (current: number, total: number, currentFile: string) => void,
  minSizeBytes: number = 100 * 1024
): Promise<ScannedFile[]> => {
  const results: ScannedFile[] = []
  let scanned = 0

  const walk = async (dir: string) => {
    let entries: any[]
    try {
      entries = await readDir(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      scanned++
      onProgress?.(scanned, 0, entry.name)
      try {
        if (entry.isDirectory) {
          await walk(entry.path)
        } else if (isAudioFile(entry.name, entry.mimeType)) {
          // 过滤小文件(默认 100KB 以下不加入)
          if (minSizeBytes > 0 && entry.size && entry.size < minSizeBytes) continue
          results.push({ name: entry.name, path: entry.path, size: entry.size })
        }
      } catch {}
    }
  }

  await walk(dirPath)
  return results
}

/**
 * 全量扫描常见音乐目录
 */
export const FULL_SCAN_DIRS = [
  '/storage/emulated/0/Music',
  '/storage/emulated/0/Download',
  '/storage/emulated/0/Downloads',
  '/storage/emulated/0/netease',
  '/storage/emulated/0/netease/cloudmusic',
  '/storage/emulated/0/QQMusic',
  '/storage/emulated/0/kuwo',
  '/storage/emulated/0/kugou',
  '/storage/emulated/0/MIUI/Music',
  '/storage/emulated/0/miui/music',
  '/storage/emulated/0/Recordings',
  '/storage/emulated/0/Documents',
  '/storage/emulated/0/Movies',
  '/storage/emulated/0/DCIM',
]

export const scanFull = async (
  onProgress?: (current: number, total: number, currentFile: string) => void,
  minSizeBytes: number = 100 * 1024
): Promise<ScannedFile[]> => {
  const all: ScannedFile[] = []
  for (const dir of FULL_SCAN_DIRS) {
    const files = await scanRecursive(dir, onProgress, minSizeBytes)
    all.push(...files)
  }
  // 去重
  const seen = new Set<string>()
  return all.filter(f => {
    if (seen.has(f.path)) return false
    seen.add(f.path)
    return true
  })
}
