/**
 * Created by qianxin on 17/6/1.
 * 屏幕工具类
 * ui设计基准,iphone 6
 * width:375
 * height:667
 */
import { PixelRatio } from 'react-native'
import { windowSizeTools } from './windowSizeTools'

// 高保真的宽度和高度
const designWidth = 375.0
const designHeight = 667.0

// 获取屏幕的dp
const size = windowSizeTools.getSize()
// console.log('size', size)
let screenW = size.width
let screenH = size.height
if (screenW > screenH) {
  const temp = screenW
  screenW = screenH
  screenH = temp
}
let fontScale = PixelRatio.getFontScale()
let pixelRatio = PixelRatio.get()
// 屏幕缩放比例: 直接用 dp 比例(修复低密度大屏如车机 scaleSize 失真)
// 旧算法: screenPx(物理像素)/designWidth, 再在 scaleSizeH/W 里除 pixelRatio
// —— screenW 已是 dp, 重复换算导致车机(density~1.2)放大 4.9 倍
// 新算法: dp 直接比例, 手机车机统一合理
const scaleW = screenW / designWidth
const scaleH = screenH / designHeight
const scale = Math.min(scaleW, scaleH, 2.8)
// console.log(scale)

/**
 * 设置text
 * @param size  px
 * @returns dp
 */
export function getTextSize(size: number) {
  // console.log('screenW======' + screenW)
  // console.log('screenPxW======' + screenPxW)
  let scaleWidth = screenW / designWidth
  let scaleHeight = screenH / designHeight
  // console.log(scaleWidth, scaleHeight)
  let scale = Math.min(scaleWidth, scaleHeight, 1.3)
  size = Math.floor((size * scale) / fontScale)
  // console.log(size)
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
  let scaleHeight = size * scale
  size = Math.floor(scaleHeight)
  return size * global.lx.fontSize
}

/**
 * 设置宽度
 * @param size  px
 * @returns dp
 */
export function scaleSizeW(size: number) {
  let scaleWidth = size * scale
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
  let scaleHeight = size * scale
  return size * 2 - Math.floor(scaleHeight)
}
