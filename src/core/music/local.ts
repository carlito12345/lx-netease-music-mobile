import { saveLyric, saveMusicUrl } from '@/utils/data'
import { updateListMusics } from '@/core/list'
import {
  buildLyricInfo,
  getCachedLyricInfo,
  getOnlineOtherSourceLyricByLocal,
  getOnlineOtherSourceLyricInfo,
  getOnlineOtherSourceMusicUrl,
  getOnlineOtherSourceMusicUrlByLocal,
  getOnlineOtherSourcePicByLocal,
  getOnlineOtherSourcePicUrl,
  getOtherSource,
} from './utils'
import { getLocalFilePath } from '@/utils/music'
import { readLyric, readPic } from '@/utils/localMediaMetadata'
import { stat } from '@/utils/fs'

const getOtherSourceByLocal = async <T>(
  musicInfo: LX.Music.MusicInfoLocal,
  handler: (infos: LX.Music.MusicInfoOnline[]) => Promise<T>
) => {
  let result: LX.Music.MusicInfoOnline[] = []
  result = await getOtherSource(musicInfo)
  if (result.length)
    try {
      return await handler(result)
    } catch {}
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map((val) => val.trim())
    result = await getOtherSource(
      {
        ...musicInfo,
        name,
        singer,
      },
      true
    )
    if (result.length)
      try {
        return await handler(result)
      } catch {}
    result = await getOtherSource(
      {
        ...musicInfo,
        name: singer,
        singer: name,
      },
      true
    )
    if (result.length)
      try {
        return await handler(result)
      } catch {}
  }
  let fileName =
    (await stat(musicInfo.meta.filePath).catch(() => ({ name: null }))).name ??
    musicInfo.meta.filePath.split(/\/|\\/).at(-1)
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map((val) => val.trim())
        result = await getOtherSource(
          {
            ...musicInfo,
            name,
            singer,
          },
          true
        )
        if (result.length)
          try {
            return await handler(result)
          } catch {}
        result = await getOtherSource(
          {
            ...musicInfo,
            name: singer,
            singer: name,
          },
          true
        )
      } else {
        result = await getOtherSource(
          {
            ...musicInfo,
            name: fileName,
            singer: '',
          },
          true
        )
      }
      if (result.length)
        try {
          return await handler(result)
        } catch {}
    }
  }

  throw new Error('source not found')
}

export const getMusicUrl = async ({
  musicInfo,
  isRefresh,
  allowToggleSource = true,
  onToggleSource = () => {},
}: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
  allowToggleSource?: boolean
}): Promise<string> => {
  // 本地歌曲: 直接用本地文件路径播放, 不走网络
  const path = await getLocalFilePath(musicInfo)
  if (path) return path

  // 本地文件不存在: 直接失败, 不再尝试网络匹配
  throw new Error('source not found')
}

export const getPicUrl = async ({
  musicInfo,
  listId,
  isRefresh,
  skipFilePic,
  onToggleSource = () => {},
}: {
  musicInfo: LX.Music.MusicInfoLocal
  listId?: string | null
  isRefresh: boolean
  skipFilePic?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  // 本地歌曲: 优先读文件内置封面, 无则返回空(不抛错)
  if (!isRefresh && !skipFilePic) {
    let pic = await readPic(musicInfo.meta.filePath).catch(() => null)
    if (pic) {
      if (pic.startsWith('/')) pic = `file://${pic}`
      return pic
    }

    if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl
  }

  // 网络搜索无果: 返回空, 不再尝试
  return ''
}

const getMusicFileLyric = async (filePath: string) => {
  const lyric = await readLyric(filePath).catch(() => null)
  if (!lyric) return null
  return {
    lyric,
  }
}
export const getLyricInfo = async ({
  musicInfo,
  isRefresh,
  skipFileLyric,
  onToggleSource = () => {},
}: {
  musicInfo: LX.Music.MusicInfoLocal
  skipFileLyric?: boolean
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh && !skipFileLyric) {
    // const lyricInfo = await getCachedLyricInfo(musicInfo)
    // if (lyricInfo?.rawlrcInfo.lyric && lyricInfo.lyric != lyricInfo.rawlrcInfo.lyric) {
    //   // 存在已编辑歌词
    //   return buildLyricInfo(lyricInfo)
    // }

    // 尝试读取文件内歌词
    const rawlrcInfo = await getMusicFileLyric(musicInfo.meta.filePath)
    if (rawlrcInfo) return buildLyricInfo(rawlrcInfo)

    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo?.lyric) return buildLyricInfo(lyricInfo)
  }

  // 网络搜索无果: 返回空歌词, 不再尝试
  return buildLyricInfo({ lyric: '' })
}
