import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import BubbleSearch, { type BubbleSearchType } from '@/components/BubbleSearch'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
  onVoicePress?: () => void
  voiceListening?: boolean
}

export interface SearchInputType {
  setText: (text: string) => void
  // getText: () => string
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(
  ({ onChangeText, onSubmit, onBlur, onTouchStart, onVoicePress, voiceListening = false }, ref) => {
    const [text, setText] = useState('')
    const inputRef = useRef<BubbleSearchType>(null)

    useImperativeHandle(ref, () => ({
      // getText() {
      //   return text.trim()
      // },
      setText(text) {
        setText(text)
      },
      focus() {
        inputRef.current?.focus()
      },
      blur() {
        inputRef.current?.blur()
      },
    }))

    const handleChangeText = (text: string) => {
      setText(text)
      onChangeText(text.trim())
    }

    const handleClearText = useCallback(() => {
      setText('')
      onChangeText('')
      onSubmit('')
    }, [onChangeText, onSubmit])

    const handleSubmit = useCallback((text: string) => {
      onSubmit(text)
    }, [onSubmit])

    return (
      <BubbleSearch
        ref={inputRef}
        placeholder="Search for something..."
        value={text}
        onChangeText={handleChangeText}
        onBlur={onBlur}
        onSubmit={handleSubmit}
        onClearText={handleClearText}
        onTouchStart={onTouchStart}
        onVoicePress={onVoicePress}
        voiceListening={voiceListening}
        height={38}
      />
    )
  }
)
