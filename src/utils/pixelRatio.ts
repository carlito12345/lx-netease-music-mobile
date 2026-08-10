/**
 * Created by qianxin on 17/6/1.
 * 屏幕工具类
 * ui设计基准,iphone 6
 * width:375
 * height:667
 */
import { PixelRatio, Dimensions } from 'react-native'
import { windowSizeTools } from './windowSizeTools'

// 高保真的宽度和高度
const designWidth = 375.0
const designHeight = 667.0

// 屏幕缩放比例: 每次调用实时读取(修复冷启动 windowSizeTools 未初始化导致 scale=0 布局倾斜)
// 旧算法: 模块加载时捕获尺寸 + screenPx 换算, 冷启动时序竞争会得到 0
// 新算法: 惰性读取, windowSizeTools 优先, Dimensions 兜底, dp 直接比例
let cachedScreenW = 0
let cachedScreenH = 0

const getScreenSize = () => {
  const size = windowSizeTools.getSize()
  let w = size.width
  let h = size.height
  if (!w || !h) {
    // windowSizeTools 未初始化时用 Dimensions 兜底
    const d = Dimensions.get('window')
    w = d.width
    h = d.height
  }
  if (w > h) {
    const temp = w
    w = h
    h = temp
  }
  return { w, h }
}

const getScale = () => {
  const { w, h } = getScreenSize()
  // 兜底: 尺寸异常(0/极小)时用标准手机基准, 避免布局崩坏
  if (w < 100 || h < 100) return 1
  const scaleW = w / designWidth
  const scaleH = h / designHeight
  return Math.min(scaleW, scaleH, 2.8)
}

let fontScale = PixelRatio.getFontScale()

/**
 * 设置text
 * @param size  px
 * @returns dp
 */
export function getTextSize(size: number) {
  const { w, h } = getScreenSize()
  let scaleWidth = w / designWidth
  let scaleHeight = h / designHeight
  let scale = Math.min(scaleWidth, scaleHeight, 1.3)
  size = Math.floor((size * scale) / fontScale)
  return size
}
export function setSpText(size: number) {
  return getTextSize(size) * global.lx.fontSize
}

/**
 * 设置高度
 * @param size  px
 * @returns dp
 */
export function scaleSizeH(size: number) {
  let scaleHeight = size * getScale()
  size = Math.floor(scaleHeight)
  return size * global.lx.fontSize
}

/**
 * 设置宽度
 * @param size  px
 * @returns dp
 */
export function scaleSizeW(size: number) {
  let scaleWidth = size * getScale()
  size = Math.floor(scaleWidth)
  return size * global.lx.fontSize
}

export const scaleSizeWR = (size: number) => {
  return size * 2 - scaleSizeW(size)
}

export const scaleSizeHR = (size: number) => {
  return size * 2 - scaleSizeH(size)
}

export const scaleSizeAbsHR = (size: number) => {
  let scaleHeight = size * getScale()
  return size * 2 - Math.floor(scaleHeight)
}
