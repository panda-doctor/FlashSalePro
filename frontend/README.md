# 秒杀商城前端

Vue 3 + TypeScript + Vite + Vue Router + Pinia + Element Plus，对接 `FlashSale2.0` 后端网关（默认 `:8090`）。

## 快速开始

```bash
cd /home/dph/FlashSale2.0/frontend
export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"   # 本机 Node 由 nvm 管理
pnpm install
pnpm dev
```

开发地址 `http://127.0.0.1:5173`。请通过该地址访问，不要直连 8090 或 8084/8085。

## 命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 开发服务器（含 `/api`、`/uploads` 代理） |
| `pnpm build` | 类型检查 + 生产构建，输出 `dist/` |
| `pnpm preview` | 预览构建产物（同样配置代理） |
| `pnpm lint` | ESLint 9 flat config，`--max-warnings=0` |
| `pnpm type-check` | `vue-tsc --noEmit` |
| `pnpm test` | Vitest 纯逻辑单测 |
| `pnpm e2e` | Playwright E2E 冒烟（需网关与各域服务已启动） |
| `pnpm e2e:report` | 查看上一次 E2E 的 HTML 报告 |

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `VITE_APP_TITLE` | `秒杀商城` | 页面标题后缀 |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8090` | 开发代理目标（网关） |

生产环境约定由 Nginx 同源反向代理 `/api` 与 `/uploads`，因此前端 `baseURL` 留空。

## 联调前置

1. 后端已启动网关 8090 及对应域服务（auth 8082、product 8084、activity 8085、seckill 8086、order 8087、bootstrap 8081、ai 8083）。
2. 创建活动后执行“预热”，否则活动库存为空、秒杀返回未预热。
3. 订单要落库需 `FLASH_STREAM_AUTO_POLL=true`（order 服务）。
4. 管理端需在后端配置 `ADMIN_TOKEN`，然后在前端管理台输入同一令牌。

## 端到端测试

```bash
pnpm exec playwright install chromium   # 首次安装浏览器
pnpm e2e                                # 默认复用 5173 的 dev server
```

- 用例位于 `e2e/`，覆盖认证、商品、活动、秒杀、管理台、AI 客服共 11 个场景；
- 数据准备直连网关 8090（`e2e/support/api.ts`），不经过 Vite 代理；
- 若本机 Chromium 与 Playwright 版本不匹配，用 `E2E_CHROME_PATH` 指定可执行文件；
- 环境变量：`E2E_BASE_URL`（默认 `http://127.0.0.1:5173`）、`E2E_API_BASE`（默认 `http://127.0.0.1:8090`）、`E2E_ADMIN_TOKEN`（默认 `admin-secret-2026`）。

## 目录

```text
src/
├── modules/      # 按后端业务域拆分：auth / product / activity / seckill / order / analytics / ai / admin
├── shared/       # 通用 UI、布局、composables、http、types、utils
├── router/       # 路由表与守卫
├── views/        # 首页与错误页
└── main.ts
```

## 已实现页面

| 路径 | 路由名 | 说明 |
|---|---|---|
| `/` | `home` | 首页与模块导航 |
| `/products`、`/products/:id` | `products` / `product-detail` | 商品检索分页、商品详情 |
| `/activities`、`/activities/:id` | `activities` / `activity-detail` | 活动大厅、详情、抢购、Top10 |
| `/orders` | `orders` | 我的订单（排队中自动刷新） |
| `/login`、`/register`、`/profile` | `login` / `register` / `profile` | 认证与个人中心 |
| `/ai-support` | `ai-support` | AI 客服 |
| `/admin/products` | `admin-products` | 商品新建/编辑、图片上传 |
| `/admin/activities` | `admin-activities` | 活动创建、预热、重置、指标、快照、死信 |
| `/admin/users` | `admin-users` | 用户查询、新建、编辑、软删除 |

## 文档

- `FRONTEND_MODULE_MAP.md`：后端 → 前端模块/接口/路由映射与契约风险
- `FRONTEND_AGENT_PROGRESS.md`：模块进度、验证结果与假设
