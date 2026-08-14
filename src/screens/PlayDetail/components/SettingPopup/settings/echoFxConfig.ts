/**
 * echoFxConfig - 音域回响(echoplus)参数配置文件导入导出
 * 配置文件目录: Download/LXMUSIC_Config (用户可在文件管理器查看)
 */
import RNFS from 'react-native-fs'
import type { ParamState } from './EffectParamPanel'

export const FX_DIR = RNFS.DownloadDirectoryPath + '/LXMUSIC_Config'

/** 生成配置文件, 返回文件名 */
export async function exportFxConfig(params: ParamState): Promise<string> {
  await RNFS.mkdir(FX_DIR)
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const file = `${FX_DIR}/echoplus-${ts}.json`
  await RNFS.writeFile(file, JSON.stringify(params, null, 2), 'utf8')
  return file.split('/').pop() ?? file
}

/** 读取指定配置文件 */
export async function readFxConfigFile(filePath: string): Promise<ParamState> {
  const text = await RNFS.readFile(filePath, 'utf8')
  return JSON.parse(text) as ParamState
}

/** 列出目录下所有配置文件(不存在返回空) */
export async function listFxConfigs(): Promise<{ name: string; path: string }[]> {
  if (!(await RNFS.exists(FX_DIR))) return []
  const files = await RNFS.readDir(FX_DIR)
  return files
    .filter((f) => f.name.endsWith('.json'))
    .sort((a, b) => (b.name < a.name ? -1 : 1))
    .map((f) => ({ name: f.name, path: f.path }))
}
