import { NativeModules } from 'react-native'

const { SpeechRecognizerModule } = NativeModules

export interface SpeechAvailability {
  hasPermission: boolean
  hasRecognizer: boolean
}

export const speechIsAvailable = (): Promise<SpeechAvailability> =>
  SpeechRecognizerModule.isAvailable()

export const speechStart = (): Promise<{ text: string, success: boolean }> =>
  SpeechRecognizerModule.startListening()

export const speechStop = () => {
  try { SpeechRecognizerModule.stopListening() } catch {}
}

export const speechDestroy = () => {
  try { SpeechRecognizerModule.destroy() } catch {}
}
