<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Compass } from 'lucide-vue-next'

const router = useRouter()

function goHome(): void {
  router.push({ name: 'home' })
}

function goBack(): void {
  router.back()
}
</script>

<template>
  <div class="page-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
    <div class="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
      <Compass :size="30" :stroke-width="1.8" aria-hidden="true" />
    </div>
    <p class="num mt-6 text-5xl font-semibold tracking-tight text-ink-900">404</p>
    <h1 class="mt-3 text-lg font-semibold">页面不存在或已被移动</h1>
    <p class="mt-2 max-w-md text-sm text-ink-500">
      请检查地址是否正确。如果是从旧链接进入，可能对应模块尚未接入当前版本。
    </p>
    <div class="mt-7 flex items-center gap-3">
      <el-button type="primary" @click="goHome">返回首页</el-button>
      <el-button plain @click="goBack">
        <ArrowLeft :size="15" class="mr-1.5" aria-hidden="true" />
        返回上一页
      </el-button>
    </div>
  </div>
</template>
