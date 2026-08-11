import { NativeModules } from 'react-native'
const { AsrModule } = NativeModules

export interface AsrStatus {
  modelReady: boolean
  modelExtracted: boolean
  zipFound: boolean
  zipPath?: string
  loadStatus?: string
  loadProgress?: number
}

export const getStatus = (): Promise<AsrStatus> => AsrModule.getStatus()
export const loadModel = (): Promise<boolean> => AsrModule.loadModel()
export const startListening = (): Promise<boolean> => AsrModule.startListening()
export const stopListening = (): Promise<{ text: string; done: boolean }> => AsrModule.stopListening()
export const getPartialResult = (): Promise<{ text: string; done: boolean }> => AsrModule.getPartialResult()

export const startWakeup = (word: string): Promise<boolean> => AsrModule.startWakeup(word)
export const stopWakeup = (): Promise<boolean> => AsrModule.stopWakeup()

export const writeOpLog = (line: string) => AsrModule.writeOpLog(line)
