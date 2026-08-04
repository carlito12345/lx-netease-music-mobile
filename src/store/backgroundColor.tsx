/**
 * 全局文字色模式 Context
 * 背景模式针对性文字色, 开销小(不实时计算亮度)
 * 'theme' = 跟随主题明暗 | 'white' = 白色 | 'black' = 黑色
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type TextColorMode = 'theme' | 'white' | 'black'

interface BgContextType {
  /** 当前文字色模式 */
  textColorMode: TextColorMode
  /** 更新文字色模式(播放页背景模式调用) */
  setTextColorMode: (mode: TextColorMode) => void
}

const BackgroundColorContext = createContext<BgContextType>({
  textColorMode: 'theme',
  setTextColorMode: () => {},
})

export const BackgroundColorProvider = ({ children }: { children: ReactNode }) => {
  const [textColorMode, setTextColorMode] = useState<TextColorMode>('theme')

  const value = useMemo(() => ({ textColorMode, setTextColorMode }), [textColorMode])

  return (
    <BackgroundColorContext.Provider value={value}>
      {children}
    </BackgroundColorContext.Provider>
  )
}

export const useBackgroundColor = () => useContext(BackgroundColorContext)
