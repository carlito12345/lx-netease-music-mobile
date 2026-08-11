import { useCallback } from 'react'
import { toast } from '@/utils/tools'

export interface VoiceCommandResult {
  type: 'search' | 'navigate' | 'none'
  text: string
  navId?: string
}

// 页面关键词 → nav ID(更多同义词 + 容错)
const NAV_RULES: [RegExp, string][] = [
  [/搜[索歌]?(?:页)?$/,'nav_search'],
  [/排行(?:榜)?|leaderboard|top/i,'nav_top'],
  [/歌单|playlist|我.*列表|列表/i,'nav_my_playlist'],
  [/收藏|喜欢|love|favorite/i,'nav_love'],
  [/每[日天].*推|daily/i,'nav_daily_rec'],
  [/关注|歌手|artist/i,'nav_followed_artists'],
  [/专辑|album/i,'nav_subscribed_albums'],
  [/歌[曲目]|song/i,'nav_songlist'],
  [/本地|local/i,'nav_local'],
  [/设[置定]|setting|偏好/i,'nav_setting'],
  [/首页|主页|home/i,'nav_search'],
]

const PLAY_CMDS: [RegExp, string][] = [
  [/^(?:播放|开始|继续|play)$/i,'play'],
  [/^(?:暂停|停止|停|pause|stop)$/i,'pause'],
  [/^(?:下一首|下一曲|下一个|切歌|跳过|next)$/i,'next'],
  [/^(?:上一首|上一曲|上一个|prev)$/i,'prev'],
]

export default function useVoiceCommands() {
  const parseCommand = useCallback((text: string): VoiceCommandResult => {
    const raw = text.trim()
    if (!raw) return { type: 'none', text: '' }

    // 1) 播放控制(最高优先级)
    for (const [re, action] of PLAY_CMDS) {
      if (re.test(raw)) {
        execPlayer(action)
        return { type: 'none', text: '' }
      }
    }

    // 2) 「搜XXX」/「搜索XXX」/「找XXX」/「放XXX」→ 提取搜索词
    const searchMatch = raw.match(/^(?:搜(?:索)?|找|放|听)\s*(.+)/)
    if (searchMatch) {
      const keyword = searchMatch[1].trim()
      if (keyword) return { type: 'search', text: keyword }
      // 「搜索」后面没有内容 → 打开搜索页
      return { type: 'navigate', text: raw, navId: 'nav_search' }
    }

    // 3) 「打开XXX」/「去XXX」/「进入XXX」 → 页面跳转 或 搜索
    const navMatch = raw.match(/^(?:打开|去|进入|跳转|导航到|切换到)\s*(.+)/)
    if (navMatch) {
      const target = navMatch[1].trim()
      // 先尝试匹配页面名
      for (const [re, navId] of NAV_RULES) {
        if (re.test(target)) {
          // 如果是搜索页且带有搜索词, 提取出来
          if (navId === 'nav_search' && target.length > 2) {
            const leftover = target.replace(re, '').trim()
            if (leftover) return { type: 'search', text: leftover }
          }
          return { type: 'navigate', text: target, navId }
        }
      }
      // 没有匹配到页面名 → 当做搜索关键词
      return { type: 'search', text: target }
    }

    // 4) 直接说页面名(3字以上, 精确匹配)
    if (raw.length >= 2) {
      for (const [re, navId] of NAV_RULES) {
        if (re.test(raw)) return { type: 'navigate', text: raw, navId }
      }
    }

    // 5) 默认搜索
    return { type: 'search', text: raw }
  }, [])

  return { parseCommand }
}

function execPlayer(action: string) {
  const map: Record<string,[string,string]> = {play:['play','播放'],pause:['pause','暂停'],next:['playNext','下一首'],prev:['playPrev','上一首']}
  const [fn,label] = map[action] || []
  if (!fn) return
  try { const m = require('@/core/player/player'); m[fn]?.(); toast('🎤 '+label) } catch(_) {}
}
