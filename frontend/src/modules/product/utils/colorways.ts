export type ColorwayId = 'terracotta' | 'amber' | 'graphite' | 'ivory'

export interface ProductColorway {
  id: ColorwayId
  label: string
  /** 耳机外壳主色 */
  shell: string
  /** 耳垫与内圈 */
  pad: string
  /** 线缆与细节点缀 */
  accent: string
  /** 色板圆点展示色 */
  swatch: string
}

/**
 * 仅服务于无图商品的示意图配色预览。
 * 后端 ProductVO 没有颜色 / SKU 字段，这些色板不参与价格、库存或下单。
 */
export const PRODUCT_COLORWAYS: ProductColorway[] = [
  { id: 'terracotta', label: '赤陶', shell: '#C97A63', pad: '#F7E3DA', accent: '#B81B12', swatch: '#C97A63' },
  { id: 'amber', label: '琥珀', shell: '#D9A15E', pad: '#F8EBD5', accent: '#FF8A00', swatch: '#D9A15E' },
  { id: 'graphite', label: '石墨', shell: '#4A372B', pad: '#E9DED2', accent: '#E1251B', swatch: '#4A372B' },
  { id: 'ivory', label: '象牙', shell: '#E8DCC9', pad: '#FFF9F0', accent: '#B81B12', swatch: '#E8DCC9' },
]

export const DEFAULT_COLORWAY = PRODUCT_COLORWAYS[0]

export function findColorway(id: string): ProductColorway {
  return PRODUCT_COLORWAYS.find((item) => item.id === id) ?? DEFAULT_COLORWAY
}
