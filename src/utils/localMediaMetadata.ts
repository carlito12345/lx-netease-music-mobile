import {temporaryDirectoryPath, readDir, unlink, extname, privateStorageDirectoryPath} from '@/utils/fs'
import { readPic as _readPic } from 'react-native-local-media-metadata'
export {
  type MusicMetadata,
  type MusicMetadataFull,
  readMetadata,
  writeMetadata,
  writePic,
  readLyric,
  writeLyric,
} from 'react-native-local-media-metadata'

let cleared = false
const picCachePath = privateStorageDirectoryPath + '/local-media-covers';

// 常见音频扩展名(ffmpeg 可解码的兜底, 部分格式 mimeType 识别不全)
const AUDIO_EXTS = new Set([
  'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus', 'ape', 'wv', 'tta',
  'dsf', 'dff', 'alac', 'mka', 'amr', 'mid', 'midi', 'aiff', 'aif', 'au',
])

export const scanAudioFiles = async (dirPath: string) => {
  const files = await readDir(dirPath)
  return files
    .filter((file) => {
      if (file.mimeType?.startsWith('audio/')) return true
      const ext = extname(file?.name ?? '').toLowerCase()
      if (AUDIO_EXTS.has(ext)) return true
      return false
    })
    .map((file) => file)
}

const clearPicCache = async () => {
  await unlink(picCachePath)
  cleared = true
}

export const readPic = async (filePath: string): Promise<string> => {
  const processedPath = filePath.includes('#')
    ? filePath.replace(/#/g, '%23')
    : filePath;
  let path = await _readPic(processedPath, picCachePath);

  if (path && !path.startsWith('file://') && path.startsWith('/')) {
    path = `file://${path}`;
  }
  return path;
}
