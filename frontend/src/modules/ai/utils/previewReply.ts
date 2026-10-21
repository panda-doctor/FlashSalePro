import type { ActivityItemVO } from '@/modules/activity/types'
import { resolveActivityState } from '@/modules/activity/utils/activityPhase'
import { isLiveState } from '@/modules/activity/utils/grouping'
import { formatPrice } from '@/shared/utils/money'
import { formatShortDateTime } from '@/shared/utils/time'

export interface PreviewReply {
  text: string
  /** true 表示文案引用了真实活动数据 */
  live: boolean
}

const FALLBACK =
  '我已接入商品与活动目录，可以帮你查上架商品、秒杀时间与价格、配置库存，以及一人一单、限流等抢购规则。个人订单与账号信息不在我的回答范围内。'

/**
 * 预览卡的示例回答：只引用真实活动字段，查不到可抢购场次时退回通用能力说明，
 * 不编造活动名、价格或库存。
 */
export function buildPreviewReply(activity: ActivityItemVO | null, now = Date.now()): PreviewReply {
  if (!activity) return { text: FALLBACK, live: false }

  const state = resolveActivityState({
    startTime: activity.startTime,
    endTime: activity.endTime,
    status: activity.status,
    stock: activity.stock,
    preheated: activity.preheated,
    now,
  })

  const stock = activity.stock ?? 0

  if (!isLiveState(state) || stock <= 0) {
    return { text: FALLBACK, live: false }
  }

  return {
    text: `当前进行中的「${activity.activityName}」秒杀价为 ${formatPrice(activity.seckillPrice)}，还剩 ${stock} 件，${formatShortDateTime(activity.endTime)} 结束。想了解抢购规则或活动时间，可以继续问我。`,
    live: true,
  }
}
