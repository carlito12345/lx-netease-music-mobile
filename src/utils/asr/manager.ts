import { NativeModules } from 'react-native'

const AsrNative = NativeModules.AsrModule

export interface AsrStatus {
  modelReady: boolean
  modelExtracted: boolean
  zipFound: boolean
  zipPath?: string
  loadStatus?: string
  loadProgress?: number
}

const safeCall = <T>(fn: string, ...args: any[]): Promise<T> => {
  if (!AsrNative) return Promise.reject(new Error('AsrModule 未加载'))
  return AsrNative[fn](...args)
}

export const getStatus = (): Promise<AsrStatus> => safeCall('getStatus')
export const loadModel = (): Promise<boolean> => safeCall('loadModel')
export const startListening = (): Promise<boolean> => safeCall('startListening')
export const stopListening = (): Promise<{ text: string; done: boolean }> => safeCall('stopListening')
export const getPartialResult = (): Promise<{ text: string; done: boolean }> => safeCall('getPartialResult')
export const startWakeup = (word: string): Promise<boolean> => safeCall('startWakeup', word)
export const stopWakeup = (): Promise<boolean> => safeCall('stopWakeup')
export const writeOpLog = (line: string) => { try { AsrNative?.writeOpLog?.(line) } catch (_) {} }
