# FRONTEND_MODULE_MAP

> 事实来源：`/home/dph/FlashSale2.0/E-commerceFlashSaleSystem` 的 Controller / DTO / VO / 枚举 / 网关配置（逐字段核对）。
> Swagger 仅作辅助，与代码冲突时以代码为准。前端不持有业务规则。
> 最后更新：M0（2026-10-19）

## 1. 全局契约约定（影响所有模块）

| 项 | 事实 | 前端落地 |
|---|---|---|
| 响应信封 | `{code, message, data?, requestId?, timestamp?}`，`@JsonInclude(NON_NULL)` | `types/common.ts` 的 `ApiResult<T>`，`data` 为可选 |
| HTTP 状态 | 业务失败仍是 **HTTP 200**；仅 400/404/413 例外 | 只按 `body.code` 分支，`http/client.ts` 统一抛 `ApiError` |
| 成功判定 | `code === 0` | `RESULT_CODE.SUCCESS` |
| 分页 | `PageResponse{records,page,pageSize,total,pages}`，`page` 从 1 开始 | 列表页统一 `usePagedQuery` |
| 时间格式 | 活动域 `yyyy-MM-dd HH:mm:ss`（GMT+8）；用户/订单 `createdAt` 为 ISO-8601 | `utils/time.ts` 两套 formatter，禁止混用 |
| 枚举 | Jackson 输出枚举名（`ON_SHELF`/`RUNNING`/`QUEUED`） | 前端 union type，值严格照抄 |
| Long | 雪花 ID 当前 < 2^53，可用 number；`POST /api/admin/products` 的 `productId` 返回 **string** | 单独按 string 声明 |
| 会话 | `FLASH_SESSION` HttpOnly + `SameSite=Strict` + `Path=/api` | 必须同源，Vite 代理 `/api`、`/uploads` → `:8090` |
| CSRF | 写请求 `X-CSRF-Token` 必须等于 `FLASH_CSRF` Cookie，服务端比 sha256 | `http/csrf.ts`；40301 自动刷新并重放一次 |
| 管理端 | `X-Admin-Token`，网关与服务双校验；无角色体系 | `stores/adminToken.ts`（sessionStorage）+ 页面令牌闸门 |
| 内部接口 | `/internal/**` 需 `X-Internal-Token` | **前端禁止调用** |

## 2. 模块总表与开发顺序

| 序号 | 前端模块 | 后端模块 | Controller | 路由名 | 鉴权 | 状态 |
|---|---|---|---|---|---|---|
| M0 | 基础设施 | common / infra / gateway | — | `home` | 公开 | 已完成 |
| M1 | 认证 | auth(:8082) | `UserAuthController` | `login`/`register`/`profile` | 公开 / 会话 | 已完成 |
| M2 | 商品 | product(:8084) | `ProductController` | `products`/`product-detail` | 公开 | 已完成 |
| M3 | 活动与榜单 | seckill(:8086) / analytics(bootstrap:8081) | `SeckillActivityController`/`RankController` | `activities`/`activity-detail` | 公开 | 已完成 |
| M4 | 秒杀与订单 | seckill(:8086) / order(:8087) | `SeckillExecuteController`/`OrderController` | `activity-detail`/`orders` | 会话 + CSRF | 已完成 |
| M5 | 管理端-商品 | product(:8084) | `AdminProductController`/`AdminFileController` | `admin-products` | 管理令牌 | 已完成 |
| M6 | 管理端-活动运维 | activity(:8085)/order(:8087)/analytics | `AdminSeckillController`/`AdminMessageController`/`AdminMetricsCaptureController`/`AdminMetricsController` | `admin-activities` | 管理令牌 | 已完成 |
| M7 | 管理端-用户 | auth(:8082) | `AdminUserController` | `admin-users` | 管理令牌 | 已完成 |
| M8 | AI 客服 + 全量验收 | ai(:8083) | `AiSupportController` | `ai-support` | 公开 | 已完成 |

> 说明：`POST /api/seckill/execute` 随 M3 的活动详情一起落地（保证详情页 CTA 闭环），M4 负责订单状态轮询与订单页。

依赖关系：M1 → M2 → M3 → M4；M2 → M5 → M6（M6 还依赖 M3 的活动详情）；M1 → M7；M4/M6/M7 → M8。
`/api/health` 不在交付范围（用户未选健康检查页）。

## 3. 接口 → 前端映射

### 3.1 认证（M1）

| 方法 | 路径 | 入参 | 出参 | 前端位置 |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{accountName(3-32, (?i)[a-z0-9._-]), password(10-72), displayName?≤64}` | `{user, csrfToken}` | `api/auth.ts`、`views/LoginView.vue`（注册 tab 或 `RegisterView`） |
| POST | `/api/auth/login` | `{accountName, password≤72}` | `{user, csrfToken}` | 同上 |
| GET | `/api/auth/me` | — | `UserProfile{id,accountName,displayName,status,createdAt}` | `stores/auth.ts#restoreSession` |
| GET | `/api/auth/csrf` | — | `string` | `http/csrf.ts` 兜底 |
| POST | `/api/auth/logout` | — | 无 data | `stores/auth.ts#logout` |

失败语义：40101 账号或密码错误；连续 5 次失败返回 40100 + “登录失败次数过多，请 15 分钟后再试”。

### 3.2 商品（M2）

| 方法 | 路径 | 入参 | 出参 | 前端位置 |
|---|---|---|---|---|
| GET | `/api/products` | `page≥1`、`pageSize 1-100`、`keyword?` | `PageResponse<ProductVO>`（仅 ON_SHELF） | `api/product.ts`、`ProductListView` |
| GET | `/api/products/{productId}` | path | `ProductVO` | `ProductDetailView` |
| GET | `/api/admin/products/{productId}` | path | `ProductVO` | M5 |
| POST | `/api/admin/products` | `ProductRequest` | `{productId: string}` | M5 |
| POST | `/api/admin/files/image` | multipart 字段 `file` | `{url, storageType}` | M5 |

`ProductVO{productId, name, description, imageUrl, originalPrice(分), totalStock, availableStock, status, cacheHit}`。

### 3.3 活动与榜单（M3）

| 方法 | 路径 | 入参 | 出参 | 前端位置 |
|---|---|---|---|---|
| GET | `/api/seckill/activities` | 无 | **裸数组** `ActivityItemVO[]` | `ActivityListView` |
| GET | `/api/seckill/activities/{activityId}` | path | `SeckillActivityVO`（无 preheated） | `ActivityDetailView` |
| GET | `/api/rank/top10` | `activityId` 必填、`top` 默认 10 | `RankEntryVO[]{rank,userId,score,orderNo}` | `components/activity/RankList.vue` |

`ActivityItemVO` 额外含 `productName/productImage/originalPrice/preheated(可 null)/totalStock/limitPerUser`；`stock === null` 表示未预热（详情）。

### 3.4 秒杀与订单（M4）

| 方法 | 路径 | 入参 | 出参 | 前端位置 |
|---|---|---|---|---|
| GET | `/api/seckill/activities/{id}/check` | `userId?`（传了必须等于会话用户） | `{activityId,userId,canJoin,activityStatus,reason}` | `api/activity.ts#checkEligibility`（仅作辅助） |
| POST | `/api/seckill/execute` | `{activityId, userId?, productId?}` | `SeckillResponse{activityId,userId,result,orderNo}` | `api/seckill.ts`、`SeckillPanel.vue` |
| GET | `/api/seckill/orders/{orderNo}` | path | Map（见下） | `useOrderPolling` |
| GET | `/api/seckill/users/me/orders` | `activityId?` | `OrderListItemVO[]` | `OrdersView` |

`execute.result` 取值：`QUEUED / SOLD_OUT / DUPLICATED / RATE_LIMITED / REJECTED`（无枚举类，前端自建 union）。
订单详情 Map 键：`orderNo`、`status`、`statusDesc` 必有；落库后追加 `activityId/productId/userId/seckillPrice/orderId/createdAt`。

### 3.5 管理端（M5–M7）

| 方法 | 路径 | 入参 | 出参 |
|---|---|---|---|
| POST | `/api/admin/products` | `ProductRequest{productId?,name,description?,imageUrl?,originalPrice≥0,totalStock≥1,status}` | `{productId: string}` |
| POST | `/api/admin/files/image` | multipart `file` | `{url, storageType}` |
| POST | `/api/admin/seckill/activities` | `ActivityRequest{activityId?,productId,activityName,startTime,endTime,seckillPrice,seckillStock,limitPerUser=1}` | `{activityId,status}` |
| POST | `/api/admin/seckill/activities/{id}/preheat` | — | `{activityId,activityKey,stockKey,stock}` |
| POST | `/api/admin/seckill/activities/{id}/reset-stock` | — | `{activityId,stockKey,stock}` |
| GET | `/api/admin/seckill/activities/{id}/metrics` | — | `ActivityMetricsVO` |
| POST | `/api/admin/seckill/activities/{id}/snapshot` | — | 无 data |
| POST | `/api/admin/seckill/dead-letters/replay` | `{originalMessageId}` | `{originalMessageId,replayMessageId}` |
| POST | `/api/admin/seckill/dead-letters/replay-batch` | `{originalMessageIds: string[]}` | `{attempted,succeeded,failed,failures[]}` |
| GET | `/api/admin/users` | `page,pageSize,keyword,status(0|1)` | `PageResponse<UserProfileResponse>` |
| GET/PUT/DELETE | `/api/admin/users/{userId}` | PUT 全可选 `{displayName?,status?,password?}` | `UserProfileResponse` / 无 |
| POST | `/api/admin/users` | `{accountName,password(10-72),displayName?}` | `UserProfileResponse` |

管理端**没有**活动列表/详情接口，只能按 `activityId` 查询用户端详情。

### 3.6 AI（M8）

| 方法 | 路径 | 入参 | 出参 |
|---|---|---|---|
| POST | `/api/support/chat` | `{message≤500, history?:[{role,content}]}` | `{reply}` |

公开接口，无鉴权、无限流（记录为后端风险）。

## 4. 路由与导航名（后续模块必须复用）

| 路由名 | 路径 | 布局 | 权限 meta | 说明 |
|---|---|---|---|---|
| `home` | `/` | MainLayout | — | 首页 |
| `login` | `/login` | MainLayout | — | 登录（M1） |
| `register` | `/register` | MainLayout | — | 注册（M1） |
| `profile` | `/profile` | MainLayout | requiresAuth | 个人中心（M1） |
| `products` | `/products` | MainLayout | — | 商品列表（M2） |
| `product-detail` | `/products/:id` | MainLayout | — | 商品详情（M2） |
| `activities` | `/activities` | MainLayout | — | 活动大厅（M3） |
| `activity-detail` | `/activities/:id` | MainLayout | — | 活动详情（M3/M4） |
| `orders` | `/orders` | MainLayout | requiresAuth | 我的订单（M4） |
| `ai-support` | `/ai-support` | MainLayout | — | AI 客服（M8） |
| `admin` | `/admin` | AdminLayout | requiresAdmin | 管理台父路由（M5） |
| `admin-products` | `/admin/products` | AdminLayout | requiresAdmin | M5 |
| `admin-activities` | `/admin/activities` | AdminLayout | requiresAdmin | M6 |
| `admin-users` | `/admin/users` | AdminLayout | requiresAdmin | M7 |

导航显隐由 `router.hasRoute(name)` 自动控制，模块未接入时不会出现死链。

## 5. 枚举字典

| 枚举 | 取值 | 备注 |
|---|---|---|
| `ProductStatusEnum` | `OFF_SHELF` / `ON_SHELF` | 列表只返回 ON_SHELF |
| `ActivityStatusEnum` | `NOT_STARTED` / `RUNNING` / `ENDED` / `SOLD_OUT` / `CANCELLED` | **不随时间流转**，展示阶段以时间窗优先 |
| `OrderStatusEnum` | `QUEUING` / `CREATED` / `CREATE_FAILED` / `CANCELLED` | 无支付环节，CREATED 即终态 |
| 秒杀 result | `QUEUED` / `SOLD_OUT` / `DUPLICATED` / `RATE_LIMITED` / `REJECTED` | 入队是 QUEUED，不是 QUEUING |
| `ActivityCheckResponse.reason` | `ALLOW` / `ACTIVITY_NOT_PREHEATED` / `ACTIVITY_NOT_STARTED` / `ACTIVITY_ENDED` / `ACTIVITY_SOLD_OUT` / `ACTIVITY_CANCELLED` | 仅辅助展示 |
| 消息日志状态 | `0 待消费 / 1 成功 / 2 失败 / 3 死信` | 前端无列表接口，仅死信重放 |

## 6. 错误码与前端处置

| code | 含义 | 处置 |
|---|---|---|
| 40001 | 参数错误 | 就地提示；表单校验兜底 |
| 40004 | 资源不存在 | 空态 / 返回列表 |
| 40100 | 未授权 | 会话类：清空用户态并跳登录；管理端：提示令牌无效 |
| 40101 | 账号或密码错误 | 表单错误提示 |
| 40301 | CSRF 失效 | 自动刷新并重放一次，仍失败则提示重试 |
| 40901 | 重复秒杀 | 保持活动页，提示已参与 |
| 40902 | 库存不足 | 提示售罄并刷新库存 |
| 40903/40904 | 用户标识/账号名被占用 | 表单字段错误 |
| 42900 | 限流 | 提示稍后再试 |
| 50000 | 系统错误 | 提示 + 重试入口 |
| 50300/50301 | AI 未配置/调用失败 | 聊天面板内联提示 |

## 7. 契约差异与已知风险

1. **活动 status 不自动流转** → 所有阶段展示用 `resolveActivityPhase()`，status 仅兜底。
2. **活动列表是裸数组**，不可套用分页组件。
3. **管理端无活动列表** → 运维页按 ID 查询，创建后用返回的 activityId 自动回填。
4. **上传真实上限 1MB**（product 未配 `spring.servlet.multipart`，异常文案却写 6MB）→ 前端限 1MB，并提示限制来源。
5. **`data` 键可能缺失**（logout/snapshot）→ 相关 API 返回 `void`，不读取 `.data`。
6. **DTO 内 null 字段会显式出现**（如 `orderNo: null`）→ 类型用 `string | null`。
7. 除商品创建返回 string 外，其余 ID 为 number；当前雪花 ID < 2^53。
8. **订单详情对不存在单号返回 QUEUING** → 轮询必须设上限与兜底文案。
9. **`/api/seckill/execute` 的 result 无枚举类** → 前端自建 union 并做穷举。
10. **AI 接口公开且无限流** → 前端做提交节流，仅在页面提示。
11. ~~**Element Plus 全量引入**（916KB / gzip 296KB）~~ → **已改为按需引入**（unplugin-vue-components + unplugin-element-plus），首屏只加载当前路由用到的组件。
12. 前端不调用 `/internal/**`、`GET /api/seckill/users/{userId}/orders`（与 me 重复）。

## 8. 前端模块目录 ↔ 后端业务域（2026-10-19 重构）

| 前端模块目录 | 后端域 / 端口 | 目录内容 |
|---|---|---|
| `src/shared/` | common / infra / gateway | `api/`（client、csrf、errorCode）、`types/common.ts`、`ui/`（EmptyState、SkeletonBlock）、`composables/`（usePagedQuery、useNow）、`utils/`（money、time、dict、validators、debounce）、`layouts/MainLayout.vue` |
| `src/modules/auth/` | auth :8082 | `api.ts`（含 `/api/admin/users`）、`types.ts`、`store.ts`、`views/`（Login/Register/Profile）、`components/AuthShell.vue` |
| `src/modules/product/` | product :8084 | `api.ts`（含 admin 商品与图片上传契约）、`types.ts`、`views/`、`components/`（ProductCard、ProductImage） |
| `src/modules/activity/` | activity :8085 | `api.ts`（含创建/预热/重置契约）、`types.ts`、`views/`、`components/`（ActivityCard、CountdownText、StockProgress）、`utils/activityPhase.ts` |
| `src/modules/seckill/` | seckill :8086 | `api.ts`（execute + check）、`types.ts`、`components/SeckillPanel.vue`、`composables/useSeckill.ts`（五分支状态机） |
| `src/modules/order/` | order :8087 | `api.ts`（含死信重放）、`types.ts`、`views/OrdersView.vue`、`components/`、`composables/useOrderPolling.ts`、`utils/orderStatus.ts` |
| `src/modules/analytics/` | analytics（bootstrap :8081） | `api.ts`（`/api/rank/top10` + 管理端指标）、`types.ts`、`components/`（RankList、MetricsPanel）、`composables/useRank.ts` |
| `src/modules/ai/` | ai :8083 | `api.ts`、`views/AiSupportView.vue`、`components/ChatPanel.vue` |
| `src/modules/admin/` | 横切（管理令牌） | `store/adminToken.ts`、`layouts/AdminLayout.vue`、`views/`（商品/活动/用户）、`components/`（TokenGate、ImageUploader、ActivityForm、ProductForm、UserForm、DeadLetterPanel） |

约定：
- 管理端**接口契约归属业务域**（如 `saveAdminActivity` 在 `modules/activity/api.ts`），`modules/admin` 只放视图与令牌闸门。
- 单测与被测文件同目录（`*.spec.ts`），由 `vite.config.ts` 的 `test.include` 统一收集。
- 路由 URL 与路由名保持不变，仅 `router/routes.ts` 的 import 指向 `src/modules/**`。
