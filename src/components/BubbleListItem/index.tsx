/**
 * BubbleListItem — 胶囊形歌曲列表行(移植自 reactbits BubbleMenu 的 pill 视觉语言)
 *
 * 视觉特征:
 *   1. 整行为全圆角胶囊容器(高度固定),封面内嵌左侧(套上)
 *   2. 封面:圆角方形,右侧播放中/序号指示
 *   3. 中间:歌名(1行) + 歌手/专辑(1行,含品质/VIP 角标)
 *   4. 右侧:时长 + 菜单按钮
 *   5. 多选态:胶囊高亮;播放中:主题色边框
 *
 * 独立完整: 只依赖项目公共组件(Image/Text/Icon/useTheme)。
 * 主题统一: 颜色全部走主题 token。
 */

import { memo, useRef } from 'react'
import { View, TouchableOpacity, type LayoutChangeEvent } from 'react-native'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useIsWyLiked } from '@/store/user/hook'
import { handleLikeMusic } from '@/components/OnlineList/listAction'
import { ITEM_HEIGHT } from '@/components/OnlineList/ListItem'

/** 胶囊行总高度:与 OnlineList getItemLayout 保持一致(含上下间距) */
export const BUBBLE_ITEM_HEIGHT = ITEM_HEIGHT

export interface BubbleListItemProps {
  item: LX.Music.MusicInfoOnline
  index: number
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress?: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu?: (item: LX.Music.MusicInfoOnline, index: number, position: {
    x: number; y: number; w: number; h: number
  }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  playingId?: string | null
  /** 品质/VIP 角标开关 */
  showQuality?: boolean
}

const BubbleListItem = memo(({
  item,
  index,
  onPress,
  onLongPress,
  onShowMenu,
  selectedList,
  playingId,
  showQuality = true,
}: BubbleListItemProps) => {
  const theme = useTheme()
  const isPlaying = playingId === item.id
  const isSelected = selectedList.includes(item)
  const isLiked = useIsWyLiked((item.meta as LX.Music.MusicInfoMeta_online)?.songId)
  const moreButtonRef = useRef<TouchableOpacity>(null)

  const handleShowMenu = () => {
    if (!onShowMenu || !moreButtonRef.current?.measure) return
    moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
      onShowMenu(item, index, {
        x: Math.ceil(px),
        y: Math.ceil(py),
        w: Math.ceil(width),
        h: Math.ceil(height),
      })
    })
  }

  // 品质标签
  const qualitys = (item.meta as LX.Music.MusicInfoMeta_online)?._qualitys ?? {}
  const qualityText = qualitys.hires ? 'Hi-Res'
    : qualitys.flac ? '无损'
    : qualitys['320k'] ? '320K'
    : null
  const isVip = (item.meta as LX.Music.MusicInfoMeta_online)?.fee === 1

  // 歌手 + 专辑
  const singer = `${item.singer}${item.meta.albumName ? `·${item.meta.albumName}` : ''}`

  // 胶囊内部高度 = 总高 - 上下 margin(8)
  const bubbleInner = BUBBLE_ITEM_HEIGHT - 8

  // 多选/播放中/普通三种底色
  const bgColor = isSelected
    ? theme['c-primary-alpha-600']
    : isPlaying
      ? theme['c-primary-background-hover']
      : 'rgba(0,0,0,0)'
  const borderColor = isPlaying ? theme['c-primary'] : theme['c-border-background']

  return (
    <View
      style={[
        styles.row,
        {
          height: BUBBLE_ITEM_HEIGHT,
          borderRadius: bubbleInner / 2,
          backgroundColor: bgColor,
          borderColor,
        },
      ]}
    >
      {/* 点击区:封面+文字 */}
      <TouchableOpacity
        style={styles.main}
        onPress={() => onPress(item, index)}
        onLongPress={onLongPress ? () => onLongPress(item, index) : undefined}
        delayLongPress={300}
      >
        {/* 封面(内嵌,圆角) */}
        <View style={[styles.coverWrap, { width: bubbleInner, height: bubbleInner, borderRadius: bubbleInner / 2 }]}>
          {item.meta.picUrl ? (
            <Image url={item.meta.picUrl} style={[styles.cover, { borderRadius: bubbleInner / 2 }]} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder, { borderRadius: bubbleInner / 2, backgroundColor: theme['c-primary-light-900-alpha-200'] }]}>
              <Text size={16} color={theme['c-font-label']}>♪</Text>
            </View>
          )}
          {/* 播放中:左侧播放图标;非播放:序号 */}
          {isPlaying ? (
            <View style={[styles.playingBadge, { borderRadius: bubbleInner / 2, backgroundColor: theme['c-primary'] }]}>
              <Icon name="play" size={12} color={theme['c-primary-font-on-primary']} />
            </View>
          ) : (
            <Text size={11} color={theme['c-font-label']} style={styles.indexText}>
              {index + 1}
            </Text>
          )}
        </View>

        {/* 歌名 + 歌手 */}
        <View style={styles.info}>
          <Text numberOfLines={1} size={14} color={isPlaying ? theme['c-primary-font'] : theme['c-font']}>
            {item.name}
            {item.alias ? <Text size={12} color={theme['c-font-label']}> ({item.alias})</Text> : null}
          </Text>
          <View style={styles.subRow}>
            {showQuality && qualityText ? (
              <Text size={10} color={theme['c-badge-primary']} style={styles.badge}>{qualityText}</Text>
            ) : null}
            {isVip ? (
              <Text size={10} color="#d64541" style={styles.badge}>VIP</Text>
            ) : null}
            <Text size={11} color={theme['c-font-label']} numberOfLines={1} style={styles.singer}>
              {singer}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 时长 + 喜欢 + 菜单 */}
      <View style={styles.right}>
        {item.interval ? (
          <Text size={11} color={theme['c-font-label']} style={styles.interval}>
            {item.interval}
          </Text>
        ) : null}
        {item.source === 'wy' ? (
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={6}
            onPress={() => handleLikeMusic(item)}
          >
            <Icon name={isLiked ? 'love-filled' : 'love'} size={16} color={isLiked ? theme['c-liked'] : theme['c-font-label']} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity ref={moreButtonRef} style={styles.iconBtn} hitSlop={6} onPress={handleShowMenu}>
          <Icon name="dots-vertical" size={16} color={theme['c-font-label']} />
        </TouchableOpacity>
      </View>
    </View>
  )
})
BubbleListItem.displayName = 'BubbleListItem'

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BUBBLE_ITEM_HEIGHT / 2,
    borderWidth: 1,
    marginHorizontal: 10,
    marginVertical: 4,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  coverWrap: {
    marginLeft: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
  },
  playingBadge: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  badge: {
    marginRight: 6,
    fontWeight: '600',
  },
  singer: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  interval: {
    marginRight: 8,
  },
  iconBtn: {
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default BubbleListItem
