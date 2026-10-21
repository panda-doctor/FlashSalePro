import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { listActivities } from '@/modules/activity/api'
import {
  isFinishedState,
  resolveActivityState,
} from '@/modules/activity/utils/activityPhase'
import {
  SPOTLIGHT_LIMIT,
  selectSpotlightActivities,
  type SpotlightActivity,
} from '@/modules/home/utils/spotlight'

export interface HomeActivityPipeline {
  notStarted: number
  running: number
  finished: number
}

export interface HomeActivitiesState {
  activities: ComputedRef<SpotlightActivity[]>
  pipeline: ComputedRef<HomeActivityPipeline>
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

  /** 全量活动的阶段分布，供首页链路条展示真实进度 */
  const pipeline = computed<HomeActivityPipeline>(() => {
    const summary: HomeActivityPipeline = { notStarted: 0, running: 0, finished: 0 }
    for (const activity of activities.value) {
      const state = resolveActivityState({
        startTime: activity.startTime,
        endTime: activity.endTime,
        status: activity.status,
        stock: activity.stock,
        preheated: activity.preheated,
        now: now.value,
      })
      if (state === 'NOT_STARTED') summary.notStarted += 1
      else if (state === 'RUNNING') summary.running += 1
      else if (isFinishedState(state)) summary.finished += 1
    }
    return summary
  })

  return { activities: spotlight, pipeline, loading, failed }
}
