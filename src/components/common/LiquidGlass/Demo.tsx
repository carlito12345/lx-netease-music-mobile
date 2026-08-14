/**
 * LiquidGlass 演示页 - 毛玻璃效果验证
 * 结构: 左侧清晰背景图(对比), 右侧玻璃面板(同图模糊 + 色罩 + 光晕)
 */
import { View, ImageBackground } from 'react-native'
import Text from '@/components/common/Text'
import LiquidGlass from './LiquidGlass'
import { createStyle } from '@/utils/tools'

const BG = require('@/theme/themes/images/jqbg.jpg')

const styles = createStyle({
  page: {
    flex: 1,
  },
  card: {
    margin: 18,
    padding: 16,
    minHeight: 300,
  },
  item: {
    paddingVertical: 10,
  },
})

const items = ['正在播放: 晴天 - 周杰伦', '下一首: 夜曲', '收藏列表: 我的最爱', '歌单: 通勤路上']

export default () => {
  return (
    <View style={styles.page}>
      {/* 页面底层: 清晰背景图 */}
      <ImageBackground source={BG} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} resizeMode="cover">
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, position: 'absolute', left: 20, top: 16, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          下方: 清晰原图(对比用)
        </Text>
      </ImageBackground>

      {/* 毛玻璃面板: 同图模糊 */}
      <LiquidGlass
        radius={22}
        glowIntensity={0.85}
        opacity={0.3}
        blurRadius={28}
        source={BG}
        style={styles.card}
      >
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 11 }}>GLASS PLAYER</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Fascist</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12 }}>Cerpow</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14 }}>{item}</Text>
          </View>
        ))}
      </LiquidGlass>
    </View>
  )
}
