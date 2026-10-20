# FRONTEND_AGENT_PROGRESS

> 单模块式开发的唯一进度事实源。每完成一个模块：记录验证结果 → 更新本表 → 再进入下一模块。
> 后端契约见 `FRONTEND_MODULE_MAP.md`。

## 1. 运行环境

| 项 | 值 |
|---|---|
| 后端工程 | `/home/dph/FlashSale2.0/E-commerceFlashSaleSystem`（只读，未修改） |
| 前端工程 | `/home/dph/FlashSale2.0/frontend` |
| Node | v24.19.0（`~/.nvm/versions/node/v24.19.0/bin`，非交互 shell 需先 export PATH） |
| 包管理器 | pnpm 11.22.0（`pnpm-workspace.yaml` + `allowBuilds: esbuild`） |
| 开发代理 | `/api`、`/uploads` → `http://127.0.0.1:8090`（网关，同源） |
| 技术栈 | Vue 3.5 / TypeScript 5.9 / Vite 7 / Vue Router 4 / Pinia 3 / Element Plus 2.14 |

## 2. 模块清单与状态

| 模块 | 范围 | 依赖 | 状态 | 报告 |
|---|---|---|---|---|
| M0 基础设施 | 脚手架、请求层、错误码、CSRF、路由/布局、代理、文档 | — | ✅ 完成 | §5 |
| M1 认证 | 注册/登录/登出/me/守卫/会话恢复 | M0 | ✅ 完成 | §6 |
| M2 商品 | 列表（查询/重置/分页）+ 详情 + 图片占位 | M1 | ✅ 完成 | §7 |
| M3 活动 | 大厅、详情、时间窗阶段、倒计时、库存进度、Top10、抢购提交 | M2 | ✅ 完成 | §8 |
| M4 秒杀与订单 | execute 五态、订单轮询、我的订单 | M3 | ✅ 完成 | §9 |
| M5 管理端-商品 | 新建/编辑、图片上传（≤1MB） | M2 | ✅ 完成 | §10 |
| M6 管理端-活动运维 | 创建、预热、重置库存、指标、快照、死信 | M5、M3 | ✅ 完成 | §11 |
| M7 管理端-用户 | 查询/详情/新建/编辑/软删除 | M1 | ✅ 完成 | §12 |
| M8 AI + 验收 | 客服对话、补测、全量验证、交付报告 | M4、M6、M7 | ✅ 完成 | §13 |

## 3. 验证命令

```bash
export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"
cd /home/dph/FlashSale2.0/frontend
pnpm lint        # ESLint 9 flat，--max-warnings=0
pnpm type-check  # vue-tsc --noEmit
pnpm test        # Vitest（纯逻辑）
pnpm build       # vue-tsc + vite build
```

后端未启动时，以静态构建通过为准，报告中标注“未做运行时联调”。

## 4. 假设、决策与风险

### 决策
1. 前端目录为空且无 lock 文件 → Vite 全新工程 + pnpm。
2. 视觉按用户确认使用 **Element Plus 默认蓝白**，不沿用旧 React 暖色令牌；信息密度参考 Data-Dense Dashboard。
3. 浏览器只同源访问：`baseURL=''` + Vite 代理。原因是会话 Cookie `SameSite=Strict` 且 `Path=/api`，直连 8090 会丢失凭证。
4. 管理端仅有静态令牌，无角色体系 → 不做 RBAC，只做 `requiresAdmin` 令牌闸门。
5. Element Plus 采用全量引入（先保证构建与样式完整），按需引入列入优化项。
6. 图标统一使用 `lucide-vue-next`（SVG，不使用 emoji）。

### 假设
- 后端以默认端口/网关 8090 运行，且 `ADMIN_TOKEN` 已配置。
- 雪花 ID 当前小于 2^53（`IdGenerator` 已保证），前端按 number 处理；仅商品创建的 `productId` 按 string。

### 风险（继承自后端，前端只做提示不掩盖）
1. 上传真实上限 1MB（product 未配 multipart），异常文案却写 6MB。
2. 订单详情对不存在单号返回 `QUEUING`，需轮询上限与兜底文案。
3. 活动 `status` 不随时间流转，必须时间窗优先。
4. `POST /api/support/chat` 公开且无限流，前端仅做提交节流。
5. Element Plus 全量包 916KB（gzip 296KB），首屏可接受，后续可优化。

## 5. M0 模块报告（基础设施）

### 改动文件
- 工程配置：`package.json`、`pnpm-workspace.yaml`、`vite.config.ts`、`tsconfig*.json`、`eslint.config.js`、`tailwind.config.js`、`postcss.config.js`、`index.html`、`.env.development`、`.env.production`、`.npmrc`、`.gitignore`
- 请求层：`src/http/client.ts`、`src/http/csrf.ts`、`src/http/errorCode.ts`
- 类型：`src/types/common.ts`、`src/types/auth.ts`
- 状态：`src/stores/auth.ts`、`src/stores/adminToken.ts`
- 路由：`src/router/index.ts`、`routes.ts`、`guards.ts`、`nav.ts`
- 布局与页面：`src/layouts/MainLayout.vue`、`src/views/HomeView.vue`、`src/views/NotFoundView.vue`
- 样式：`src/assets/styles/index.css`
- 入口：`src/main.ts`、`src/App.vue`、`src/env.d.ts`
- 测试：`src/tests/errorCode.spec.ts`
- 文档：`FRONTEND_MODULE_MAP.md`、`FRONTEND_AGENT_PROGRESS.md`、`README.md`

### 已落地能力
- 统一请求出口 `request<T>()`：`withCredentials`、CSRF 注入、管理令牌注入、`body.code` 解包。
- 错误分层：网络/超时/400/404/413 文案；业务错误抛 `ApiError`；40100 触发全局登出（`/auth/me` 探测与管理端请求除外）；40301 自动刷新 CSRF 并重放一次。
- 路由骨架：懒加载、标题、`requiresAuth` 守卫、404；导航按 `hasRoute` 自动显隐（当前仅首页）。
- 布局：固定顶栏、搜索入口、用户菜单、移动端抽屉、页脚、跳转主内容链接。
- 质量门禁：ESLint + vue-tsc + Vitest + build 全部可执行。

### 验证结果
```
pnpm lint        exit 0（0 error / 0 warning）
pnpm type-check  exit 0
pnpm test        1 file / 6 tests passed
pnpm build       exit 0（dist 产出，最大 chunk element-plus 916.61 kB / gzip 295.55 kB）
```
未做运行时联调（后端未启动）。

### 未完成 / 下一步
- ~~M1：实现 `api/auth.ts`、登录/注册/个人中心页面、会话恢复与登出，替换布局中的临时 `reset()` 登出。~~ 已在 M1 完成。

## 6. M1 模块报告（认证）

### 改动文件
- `src/api/auth.ts`（含 M7 管理端用户 API，按控制器归属提前声明）
- `src/utils/validators.ts`、`src/utils/time.ts`、`src/utils/dict.ts`
- `src/stores/auth.ts`（login/register/restoreSession/logout）
- `src/router/guards.ts`（首次导航恢复会话、已登录访问登录页重定向首页）
- `src/router/routes.ts`（login / register / profile）
- `src/layouts/MainLayout.vue`（登出改为调用后端）
- `src/components/auth/AuthShell.vue`
- `src/views/LoginView.vue`、`RegisterView.vue`、`ProfileView.vue`
- `src/tests/validators.spec.ts`

### API 契约映射
| 调用 | 后端 | 说明 |
|---|---|---|
| 注册 | `POST /api/auth/register` | 成功即 Set-Cookie，前端直接进入已登录态 |
| 登录 | `POST /api/auth/login` | 返回 `csrfToken` 并写入内存，供写请求使用 |
| 会话恢复 | `GET /api/auth/me` | `skipAuthHandler: true`，40100 视为未登录 |
| 登出 | `POST /api/auth/logout` | 失败也清空本地态，避免前端假登录 |
| CSRF 兜底 | `GET /api/auth/csrf` | 由 `http/csrf.ts` 在 40301 时自动调用 |

### 页面与校验
- 登录/注册使用左右分栏 `AuthShell`；移动端隐藏品牌面板。
- 校验严格对齐后端：账号 `(?i)[a-z0-9._-]{3,32}`、注册密码 10-72、昵称 ≤64、两次密码一致。
- 回跳只允许站内路径（`resolveRedirect`），拒绝 `https://` 与 `//`。
- 个人中心展示 `/auth/me` 真实字段；用户端无改密接口，页面明确说明。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        2 files / 15 tests passed
pnpm build       exit 0
```
未做运行时联调（后端未启动）：登录/注册的 Set-Cookie 行为仅按代码契约实现，待联调确认。

## 7. M2 模块报告（商品）

### 改动文件
- `src/types/product.ts`、`src/api/product.ts`
- `src/composables/usePagedQuery.ts`（通用列表编排，后续订单/用户列表复用）
- `src/utils/money.ts`、`src/tests/money.spec.ts`
- `src/components/common/EmptyState.vue`
- `src/components/product/ProductImage.vue`、`ProductCard.vue`
- `src/views/ProductListView.vue`、`ProductDetailView.vue`
- `src/router/routes.ts`（products / product-detail）

### API 契约映射
| 调用 | 后端 | 关键点 |
|---|---|---|
| 商品列表 | `GET /api/products?page&pageSize&keyword` | `PageResponse<ProductVO>`，仅 ON_SHELF；pageSize ≤100 |
| 商品详情 | `GET /api/products/{productId}` | 40004 → 空态“不存在或已下架” |

### 页面与交互
- 列表：关键字查询（回车/按钮）、重置、每页 12/24/48、URL query 同步、骨架屏、错误重试、空态、分页。
- 卡片：方形图 + 名称 + 描述 + 价格 + 库存；图片懒加载；1×1 退化图片按无图处理（后端已知脏图）。
- 详情：面包屑、价格区、库存口径说明、返回；加载骨架与 404 空态分离。
- 金额统一“分 → 元”展示，计算折扣/节省以整数分为准。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        3 files / 21 tests passed
pnpm build       exit 0
```
未做运行时联调（后端未启动）。

### 下一步
- ~~M3：活动大厅/详情、时间窗阶段判定、倒计时、榜单。~~ 已在 M3 完成。

## 8. M3 模块报告（活动浏览与抢购提交）

### 改动文件
- `src/types/activity.ts`、`src/types/analytics.ts`
- `src/api/activity.ts`、`src/api/rank.ts`、`src/api/seckill.ts`
- `src/utils/activityPhase.ts`、`src/utils/time.ts`（倒计时/时间戳）、`src/composables/useNow.ts`
- `src/components/activity/{ActivityCard,CountdownText,StockProgress,RankList,SeckillPanel}.vue`
- `src/views/ActivityListView.vue`、`ActivityDetailView.vue`
- `src/router/routes.ts`（activities / activity-detail）
- `src/tests/activityPhase.spec.ts`

### API 契约映射
| 调用 | 后端 | 关键点 |
|---|---|---|
| 活动列表 | `GET /api/seckill/activities` | 裸数组，前端做客户端筛选/排序 |
| 活动详情 | `GET /api/seckill/activities/{id}` | 无 preheated；`stock=null` 视为未预热 |
| 商品信息 | `GET /api/products/{productId}` | 详情页需要商品名/图/原价 |
| 榜单 | `GET /api/rank/top10?activityId&top` | score 为毫秒时间戳 |
| 抢购 | `POST /api/seckill/execute` | 成功 QUEUED；40901/40902/42900 映射文案 |

### 关键实现
- `resolveActivityState()`：已取消 → 时间窗 → 预热/库存 → 快照兜底；时间窗优先，避免 status 不流转导致按钮永久禁用。
- 倒计时全页共用一个 `useNow` 定时器；卸载自动清理。
- 库存进度以「已抢 / 配置库存」计算，未预热不显示假进度。
- 抢购按钮五态：未预热/未开始/可抢/售罄/已结束/已取消，未登录时跳登录并带回跳地址。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        4 files / 32 tests passed
pnpm build       exit 0
```

## 9. M4 模块报告（秒杀结果与订单）

### 改动文件
- `src/types/order.ts`、`src/api/order.ts`
- `src/utils/orderStatus.ts`、`src/composables/useOrderPolling.ts`
- `src/components/order/{OrderStatusTag,OrderCard}.vue`
- `src/views/OrdersView.vue`
- `src/components/activity/SeckillPanel.vue`（接入轮询）
- `src/router/routes.ts`（orders）
- `src/tests/orderStatus.spec.ts`

### 关键实现
- 轮询为 `setTimeout` 串行自调度，终态/上限/组件卸载即停；页面不可见时暂停请求但保留轮询；异常按 2 倍间隔退避。
- 上限 40 次 × 1.5s，超时给出“稍后在订单页查看”的兜底文案，避免死等 QUEUING。
- 我的订单：状态筛选、订单号筛选、存在 QUEUING 时每 5s 自动刷新列表；详情抽屉展示落库后的完整字段。
- 未知订单状态按 QUEUING 兜底，与后端 VO 口径一致。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        5 files / 37 tests passed
pnpm build       exit 0
```

## 10. M5 模块报告（管理端-商品）

### 改动文件
- `src/components/admin/AdminTokenGate.vue`
- `src/components/admin/ImageUploader.vue`
- `src/components/product/ProductForm.vue`
- `src/views/admin/AdminProductView.vue`
- `src/layouts/AdminLayout.vue`
- `src/router/routes.ts`（/admin、admin-products）

### 关键实现
- 令牌闸门：`sessionStorage` 保存，进入管理台时用 `GET /api/admin/users?page=1&pageSize=1` 探活；失败清空令牌。
- 管理端无商品列表接口：按商品 ID 查询 + 新建/编辑；保存后用返回的字符串 `productId` 自动回填。
- 上传字段名 `file`；前端限制 PNG/JPEG/WebP 且 ≤1MB（后端 multipart 未配置，实际为 Boot 默认 1MB）。
- 管理端布局：220px 侧栏 + 移动端抽屉；令牌状态在顶栏可见。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        5 files / 37 tests passed
pnpm build       exit 0
```

## 11. M6 模块报告（管理端-活动与运维）

### 改动文件
- `src/api/analytics.ts`
- `src/components/admin/{ActivityForm,MetricsPanel,DeadLetterPanel}.vue`
- `src/views/admin/AdminActivityView.vue`
- `src/router/routes.ts`（admin-activities）

### 关键实现
- 三个 Tab：活动配置 / 运维与指标 / 死信重放，避免单页信息过载。
- 活动表单时间用 `el-date-picker` + `value-format="YYYY-MM-DD HH:mm:ss"`，不做时区换算；限购固定 1 且禁用编辑。
- 商品选择器复用公开商品列表（关键字搜索 + 分页 20），不虚构管理端商品列表接口。
- 预热/重置/快照均二次确认，执行后重新载入活动并刷新指标。
- 指标面板 5s 轮询，页面不可见暂停；`redisStock=null` 显示“活动未预热”。
- 死信支持单条与批量（按行/逗号解析），结果展示 attempted/succeeded/failed 与失败明细。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        5 files / 37 tests passed
pnpm build       exit 0
```

## 12. M7 模块报告（管理端-用户）

### 改动文件
- `src/components/admin/UserForm.vue`
- `src/views/admin/AdminUserView.vue`
- `src/types/auth.ts`（AdminUserFormPayload）
- `src/router/routes.ts`（admin-users）

### 关键实现
- 列表复用 `usePagedQuery`：关键字 + 状态筛选（全部/正常/禁用）、每页 10/20/50、分页。
- 新建（账号+初始密码 10-72）/ 编辑（账号只读，密码留空不改，可改状态与昵称）。
- 删除二次确认并说明是软删除；当前页最后一条删除后自动回退上一页。
- 详情抽屉走 `GET /api/admin/users/{userId}`。

### 验证结果
```
pnpm lint        exit 0
pnpm type-check  exit 0
pnpm test        5 files / 37 tests passed
pnpm build       exit 0
```

## 13. M8 模块报告（AI 客服 + 全量验收）

### 改动文件
- `src/api/ai.ts`
- `src/components/ai/ChatPanel.vue`
- `src/views/AiSupportView.vue`
- `src/router/routes.ts`（ai-support）
- `src/tests/time.spec.ts`

### 关键实现
- 单条 ≤500 字，历史最多 10 轮；Enter 发送 / Shift+Enter 换行；发送中禁用按钮。
- 50300 与 50301 分别给出“未配置密钥”与“调用失败”的内联提示；错误消息保留在对话流中。
- 明确告知公开接口、无个人订单查询、后端未限流。

### 全量验证（最终）
```
pnpm lint        exit 0（0 error / 0 warning）
pnpm type-check  exit 0
pnpm test        6 files / 45 tests passed
pnpm build       exit 0
pnpm dev         HTTP 200（http://127.0.0.1:5173/）
```
未做浏览器端视觉走查（环境无 Chromium），未做后端运行时联调（后端未启动）。

## 14. 最终交付摘要

- 已完成 8 个模块 / 18 个页面级视图，覆盖用户端与三个管理端场景。
- 契约层完全按 Controller/DTO 事实源实现，未调用任何 `/internal/**`。
- 公共层（`http/`、`router/`、`stores/auth.ts`）改动均记录在模块报告中，无跨模块副作用。
- 剩余建议：Element Plus 改按需引入；补齐后端运行时联调；后端 multipart 配置修正后把前端上限同步为 5MB。

## 15. 模块化重构与全方面优化（2026-10-19）

按后端 8 个业务域重排前端目录，并落实四类优化。

| 批次 | 内容 | 结果 |
|---|---|---|
| 1 | shared 基座 + Element Plus 按需引入 + 路由告警/favicon | 完成 |
| 2 | auth / product 迁移；搜索防抖、请求取消、过期响应丢弃 | 完成 |
| 3 | activity / seckill 拆分；`useSeckill` 五分支状态机 | 完成 |
| 4 | order / analytics 迁移；`useRank` 收敛榜单 | 完成 |
| 5 | ai / admin 迁移；AI 1.5s 节流 + AbortController；管理台活动 ID 记忆 | 完成 |
| 6 | SkeletonBlock 统一骨架；新增 debounce / seckill 结果单测 | 完成 |

关键指标：
```
pnpm type-check   exit 0（strict 未放宽）
pnpm lint         exit 0（0 error / 0 warning）
pnpm test         8 files / 49 tests passed
pnpm build        exit 0
```

产物体积变化（gzip）：
- 重构前：单一 `element-plus` chunk 916KB / **296KB gzip**，首屏强制全量加载。
- 重构后：取消强制合并，Element Plus 组件按路由切分；首屏仅 `index`(41KB) + `vue`(44KB)，管理台专用表格/日期选择器延迟到对应路由。

已知保留项：
- 管理端仍无活动列表接口，运维页按 ID 载入（契约限制，前端不做伪造）。
- 上传仍限 1MB（后端 multipart 未配置，属后端待办）。
