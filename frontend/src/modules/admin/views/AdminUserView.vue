<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from 'lucide-vue-next'
import UserForm from '@/modules/admin/components/UserForm.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUser,
} from '@/modules/auth/api'
import { usePagedQuery } from '@/shared/composables/usePagedQuery'
import { ApiError } from '@/shared/types/common'
import type { AdminUserFormPayload, UserProfile, UserStatus } from '@/modules/auth/types'
import { userStatusLabel, userStatusTagType } from '@/shared/utils/dict'
import { formatDateTime } from '@/shared/utils/time'

const { items, total, page, pageSize, query, loading, error, search, reset, setPage, setPageSize, refresh } =
  usePagedQuery<UserProfile, { keyword: string; status: UserStatus | '' }>({
    fetcher: listAdminUsers,
    initialQuery: { keyword: '', status: '' },
    pageSize: 10,
  })

const dialogOpen = ref(false)
const editing = ref<UserProfile | null>(null)
const saving = ref(false)

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<UserProfile | null>(null)

function openCreate(): void {
  editing.value = null
  dialogOpen.value = true
}

/** el-table 的插槽 row 类型是 DefaultRow，这里统一收窄为业务类型 */
function asUser(row: unknown): UserProfile {
  return row as UserProfile
}

function openEdit(user: UserProfile): void {
  editing.value = user
  dialogOpen.value = true
}

function onSubmit(payload: AdminUserFormPayload): void {
  saving.value = true

  const request = editing.value
    ? updateAdminUser(editing.value.id, {
        displayName: payload.displayName,
        status: payload.status,
        password: payload.password,
      })
    : createAdminUser({
        accountName: payload.accountName,
        password: payload.password ?? '',
        displayName: payload.displayName,
      })

  request
    .then(() => {
      ElMessage.success(editing.value ? '用户已更新' : '用户已创建')
      dialogOpen.value = false
      refresh()
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof ApiError ? error.message : '保存失败')
    })
    .finally(() => {
      saving.value = false
    })
}

function openDetail(user: UserProfile): void {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  getAdminUser(user.id)
    .then((data) => {
      detail.value = data
    })
    .catch((error: unknown) => {
      ElMessage.error(error instanceof ApiError ? error.message : '详情加载失败')
    })
    .finally(() => {
      detailLoading.value = false
    })
}

function onDelete(user: UserProfile): void {
  ElMessageBox.confirm(
    `确认删除用户「${user.accountName}」？该操作为软删除，账号将无法登录且不可恢复。`,
    '删除用户',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => {
      return deleteAdminUser(user.id)
        .then(() => {
          ElMessage.success('用户已删除')
          if (items.value.length === 1 && page.value > 1) setPage(page.value - 1)
          else refresh()
        })
        .catch((error: unknown) => {
          ElMessage.error(error instanceof ApiError ? error.message : '删除失败')
        })
    })
    .catch(() => {
      // 用户取消
    })
}

function onReset(): void {
  void reset()
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">用户管理</h2>
        <p class="mt-1 text-sm text-ink-500">
          账号由 auth 服务权威维护；删除为软删除，禁用状态会阻止该用户继续登录。
        </p>
      </div>
      <el-button type="primary" @click="openCreate">
        <Plus :size="15" class="mr-1.5" aria-hidden="true" />
        新建用户
      </el-button>
    </header>

    <section class="surface-card mt-5 p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="search">
        <div class="w-full sm:w-64">
          <label for="admin-user-keyword" class="mb-1 block text-xs text-ink-500">账号 / 昵称</label>
          <el-input id="admin-user-keyword" v-model="query.keyword" placeholder="输入关键字查询" clearable @clear="search">
            <template #prefix>
              <Search :size="15" aria-hidden="true" />
            </template>
          </el-input>
        </div>

        <div class="w-full sm:w-40">
          <label for="admin-user-status" class="mb-1 block text-xs text-ink-500">状态</label>
          <el-select id="admin-user-status" v-model="query.status" class="w-full" @change="search">
            <el-option label="全部" value="" />
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </div>

        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <el-button @click="onReset">重置</el-button>

        <div class="ml-auto flex items-center gap-2 text-sm text-ink-500">
          <label for="admin-user-page-size">每页</label>
          <el-select
            id="admin-user-page-size"
            :model-value="pageSize"
            class="w-20"
            @update:model-value="setPageSize"
          >
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
          </el-select>
        </div>
      </form>
    </section>

    <section class="surface-card mt-5 overflow-hidden">
      <EmptyState
        v-if="error"
        title="用户加载失败"
        :description="error"
        action-text="重新加载"
        @action="refresh"
      />

      <el-table v-else v-loading="loading" :data="items" stripe class="w-full">
        <el-table-column prop="id" label="用户 ID" width="180">
          <template #default="{ row }">
            <span class="num text-xs">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="accountName" label="账号" min-width="140" />
        <el-table-column prop="displayName" label="昵称" min-width="140">
          <template #default="{ row }">{{ row.displayName || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="userStatusTagType(row.status)" size="small" effect="light">
              {{ userStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="170">
          <template #default="{ row }">
            <span class="num text-xs text-ink-500">{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDetail(asUser(row))">详情</el-button>
            <el-button text type="primary" size="small" @click="openEdit(asUser(row))">编辑</el-button>
            <el-button text type="danger" size="small" @click="onDelete(asUser(row))">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <EmptyState
            compact
            title="没有匹配的用户"
            description="调整关键字或状态筛选后再试。"
            action-text="重置筛选"
            @action="onReset"
          />
        </template>
      </el-table>
    </section>

    <div v-if="total > 0" class="mt-5 flex justify-center">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="setPage"
      />
    </div>

    <el-dialog
      v-model="dialogOpen"
      :title="editing ? '编辑用户' : '新建用户'"
      width="min(520px, 92vw)"
      destroy-on-close
    >
      <UserForm :initial="editing" :submitting="saving" @submit="onSubmit" @cancel="dialogOpen = false" />
    </el-dialog>

    <el-drawer v-model="detailOpen" title="用户详情" size="400px">
      <div v-if="detailLoading" class="space-y-3">
        <div class="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div class="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div class="h-24 animate-pulse rounded bg-muted" />
      </div>

      <dl v-else-if="detail" class="space-y-3 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-ink-500">用户 ID</dt>
          <dd class="num">{{ detail.id }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-ink-500">账号</dt>
          <dd>{{ detail.accountName }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-ink-500">昵称</dt>
          <dd>{{ detail.displayName || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-ink-500">状态</dt>
          <dd>
            <el-tag :type="userStatusTagType(detail.status)" size="small" effect="light">
              {{ userStatusLabel(detail.status) }}
            </el-tag>
          </dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-ink-500">注册时间</dt>
          <dd class="num">{{ formatDateTime(detail.createdAt) }}</dd>
        </div>
      </dl>

      <EmptyState v-else compact title="未获取到用户详情" />
    </el-drawer>
  </div>
</template>
