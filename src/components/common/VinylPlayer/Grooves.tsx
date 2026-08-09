/**
 * VinylGrooves - 黑胶唱片纹路叠加层
 * 半透明同心圆环模拟唱片音轨纹路 + 径向光泽(唱片反光)
 * 叠加在封面图上, 与黑胶盘一起旋转
 */
import { memo, useMemo } from 'react'
import { View } from 'react-native'

interface Props {
  /** 唱片直径 */
  size: number
}

export const VinylGrooves = memo(({ size }: Props) => {
  // 同心圆环: 从内圈(中心孔外)到外圈, 等距 8 圈
  const grooves = useMemo(() => {
    const rings: Array<{ r: number; w: number }> = []
    const inner = size * 0.14   // 中心孔外
    const outer = size * 0.48   // 唱片边缘内
    const step = (outer - inner) / 8
    for (let i = 1; i <= 8; i++) {
      rings.push({ r: inner + step * i, w: i % 2 === 0 ? 0.8 : 0.5 })
    }
    return rings
  }, [size])

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
      }}
    >
      {grooves.map((g, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: size / 2 - g.r,
            top: size / 2 - g.r,
            width: g.r * 2,
            height: g.r * 2,
            borderRadius: g.r,
            borderWidth: g.w,
            borderColor: 'rgba(0,0,0,0.28)',
          }}
        />
      ))}
      {/* 径向光泽(唱片反光, 左上→右下) */}
      <View
        style={{
          position: 'absolute',
          left: '-30%',
          top: '-30%',
          width: '80%',
          height: '80%',
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.10)',
          transform: [{ rotate: '-35deg' }],
        }}
      />
    </View>
  )
})
