import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { listActivities } from '@/modules/activity/api'
import {
  SPOTLIGHT_LIMIT,
  selectSpotlightActivities,
  type SpotlightActivity,
} from '@/modules/home/utils/spotlight'

export interface HomeActivitiesState {
  activities: ComputedRef<SpotlightActivity[]>
  loading: Ref<boolean>
  failed: Ref<boolean>
}

/**
 * 接收页面共享时钟，筛选随倒计时自动更新；
 * 请求失败只记录日志，首页继续展示活动大厅的静态入口。
 */
export function useHomeActivities(now: Ref<number>, limit = SPOTLIGHT_LIMIT): HomeActivitiesState {
  const activities = ref<Awaited<ReturnType<typeof listActivities>>>([])
  const loading = ref(true)
  const failed = ref(false)

  listActivities()
    .then((data) => {
      activities.value = Array.isArray(data) ? data : []
    })
    .catch((error: unknown) => {
      failed.value = true
      activities.value = []
      console.error('首页活动加载失败', error)
    })
    .finally(() => {
      loading.value = false
    })

  const spotlight = computed(() => selectSpotlightActivities(activities.value, now.value, limit))

  return { activities: spotlight, loading, failed }
}
