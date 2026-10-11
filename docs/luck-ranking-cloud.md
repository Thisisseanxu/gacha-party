# 欧非排行榜云端更新（eodev）

排行榜由 EdgeOne Node.js Cloud Functions 计算、Blob 保存，通过原有 JSON 地址读取。玩家上传和原始 KV 保持现有流程。

## 部署配置

`edgeone.json` 配置最长 120 秒的 Node.js 函数，以及每天上海时间 03:15、03:20、03:25 的三个定时任务。正常只执行第一轮；后两轮在已完成时直接返回。接近单次时限或前一轮失败时，后续任务读取私有进度继续。三个计划任务各自每天触发一次，符合当前免费版调度间隔限制。

入口不再按小时或分钟拒绝请求。2026-10-11 的云端日志显示任务实际在 03:14、03:19、03:24 到达；原有一分钟窗口使这些请求返回 403，尚未执行到 Blob 创建或写入。这是入口时间检查的问题，不能据此判断 Blob 权限是否正常。

在 **eodev 对应的 EdgeOne 环境**配置：

| 环境变量                     | 用途                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LUCK_RANKING_SOURCE_URL`    | 完整读取接口地址，例如 `https://你的测试域名/api/internal/luck-ranking-source`。必须是本项目 Edge Function 的实际 HTTPS 地址，不从传入请求的 Host 推断。 |
| `LUCK_RANKING_SOURCE_SECRET` | 至少 32 字符的独立随机密钥。Edge Function 和 Cloud Function 必须使用相同值，只用于签名读取请求。                                                         |
| `LUCK_RANKING_ENABLED`       | 精确设为 `true` 才开启自动更新；未配置时自动入口关闭，页面仍能读取打包的初始榜单。管理员手动发布不受此开关限制。                                         |
| `LUCK_RANKING_STORE_NAME`    | 测试环境建议设为 `luck-ranking-eodev`，隔离试验榜单和任务状态。未配置时使用 `luck-ranking`；同一项目的不同分支不要假定 Blob 自动隔离。                   |
| `ADMIN_SECRET`               | 沿用现有管理员认证，用于手动预览及手动发布接口。                                                                                                         |

Edge Function 仍需绑定现有 `gacha_data` KV。Cloud Function 不直接访问 KV，而是通过带时间戳的 HMAC-SHA-256 请求调用读取接口。读取接口只接受 `record_` 加七位数字的键，排除上传频率元数据和其他 KV 内容。不要把真实密钥写入仓库、调度 payload 或浏览器。

Blob SDK 在运行环境内使用项目身份访问 `luck-ranking` Store，不需要给浏览器配置 Blob Token。Store 内的进度包含原始玩家 ID，只允许服务端访问；公开榜单在写入前已脱敏。

## 验证与启用

1. 安装依赖后运行 `npm run ranking:test` 和 `npm run build`。使用 `edgeone makers build` 检查函数产物。
2. 先配置读取地址、密钥和 KV 绑定，暂不设置 `LUCK_RANKING_ENABLED=true`。
3. 用现有管理员 Bearer Token 调用 `POST /api/internal/luck-ranking-update?preview=1`。它返回耗时和脱敏榜单，不写 Blob，也不改变正在展示的版本。预览是一次全量计算，超过预算会返回失败；正式调度支持续跑。
4. 比较预览结果与 Python 同一份原始记录计算出的结果，检查测试域名的读取接口是否被站点防护拦截；确认后开启定时更新。
5. 查看函数日志中的 `luck-ranking-update`：`published` 表示已发布，`pending` 表示进度已保存，`already-complete` / `duplicate` 表示本轮无须再次执行。失败事件不输出原始记录、玩家 ID 或凭证。若当日仍未完成，下一天继续未完成的任务。

## 手动发布

`POST /api/internal/luck-ranking-run` 使用管理员 Bearer Token，可随时读取原始记录、计算并写入 Blob，然后切换公开榜单。它不要求 `LUCK_RANKING_ENABLED=true`。无 Token 或 Token 无效时返回 401，不能用请求参数绕过认证。旧的 `?preview=1` 接口继续只预览，不写入 Blob。

在 PowerShell 中先登录（Token 有效期为 24 小时）：

```powershell
$rankingBase = 'https://eodev.mhpd.fans'
$rankingPassword = Read-Host '管理员登录密码（不是密码哈希）' -AsSecureString
$rankingActivationKey = Read-Host '管理员激活码'
$rankingLoginBody = @{
    password = ([System.Net.NetworkCredential]::new('', $rankingPassword)).Password
    activationKey = $rankingActivationKey
} | ConvertTo-Json -Compress
$rankingLogin = Invoke-RestMethod `
    -Uri "$rankingBase/admin/auth" `
    -Method Post `
    -ContentType 'application/json' `
    -Body $rankingLoginBody
```

然后调用手动发布接口：

```powershell
$rankingResult = Invoke-RestMethod `
    -Uri "$rankingBase/api/internal/luck-ranking-run" `
    -Method Post `
    -Headers @{ Authorization = "Bearer $($rankingLogin.token)" } `
    -TimeoutSec 130
$rankingResult | ConvertTo-Json -Depth 10
```

- `200 / published`：Blob 已保存榜单并切换发布指针。可查看 `/data/luck-ranking.json` 的 `generatedAt` 是否对应本次结果。
- `202 / pending`：进度已保存，再次执行同一条发布命令即可续跑，不重复扫描已完成的批次。
- `409 / busy`：有另一轮更新持有互斥保护。按响应中的 `Retry-After` 或 `retryAfterSeconds` 等待后再调用；请求不会在后台排队。
- `200 / already-complete`：恢复了上次在发布指针切换后中断的收尾操作。如需再获取最新数据，可再次调用。
- `503`：本轮读取或存储失败，保留旧榜。日志的 `stage` 区分配置、存储初始化和任务处理阶段。

手动入口优先继续未完成的任务；没有未完成任务时，即使当天已经更新成功，也会创建新一轮计算。手动发布成功后，当天的后续自动触发直接跳过。

本地现有快照可执行：

```powershell
npm run ranking:verify -- '..\抽卡数据统计\records_origin'
```

该检查只读取原始压缩文件，与仓库现有总榜及每个卡池详情逐项比较，不修改文件。第二个参数可以指定另一个预先生成的 `public/data` 目录。仅在原始快照与预期榜单对应时使用。

## 发布与兼容

- `GET /data/luck-ranking.json` 返回当前已完成的索引；`GET /data/luck-ranking-pools/{poolId}.json` 返回当前详情。URL 和 `schemaVersion: 2` 保持兼容。
- 索引使用精确 rewrite 到 `/api/luck-ranking-index`，避免当前 CLI 将文件名中的 `.json` 去掉，也避免 `/data/[file]` 动态路由拦截本地开发的其他数据文件。
- 新网站请求详情增加 `?v=<索引 generatedAt>`，保证索引与详情属于同一版本。省略 `v` 的旧网站和微信客户端继续读取当前详情。
- 网页端成功读取总榜索引后缓存一小时，期间刷新网页、重新进入或切回页面都复用缓存。卡池详情首次选择时按需请求，同一版本复用本地缓存；这不改变云端每天生成榜单的调度频率。
- 所有详情和索引先写入不可变版本目录，最后替换 `current.json` 指针；中途失败不切换指针。进度保存每批 64 份记录的累计统计及固定键列表，不保存解压后的原始记录。
- 一轮执行最多并发四个读取请求，每次最多 16 个键。读取接口响应过大时自动拆分；任何缺失、损坏或无法解压的记录都会阻止本轮发布，避免悄悄漏算。
- 为保持 Python 口径，保留跨池保底继承、SSR 常驻池规则、高级常驻异常轮次过滤、排序、严格阈值和 Python 浮点舍入。累计值保存总花费和出货数，避免保留全部出货数组。
- 卡池、角色及保底配置作为函数构建的一部分，随项目部署更新；中途配置改变会开始新任务，不沿用旧配置的进度。
- 每次构建打包当前仓库榜单为私有初始回退数据，并从 `dist` 移除同路径静态 JSON，避免 EdgeOne 静态路由覆盖函数。源文件保留作为初始数据和验证基准，云端更新后不再自动 Git 提交。
- 已完成任务清理超过 7 天的任务和调度记录、超过 30 天的旧版本；每轮最多删除 200 个对象，并始终保留当前发布版本。

自动入口不依赖未经文档确认的调度专用请求头，也不检查请求是否处于某个时间窗口。按上海日期检查每日完成标记，同一五分钟批次使用 Blob 条件写去重；不能通过请求参数指定日期、源地址、卡池或发布内容。

自动和手动发布共用 Blob 互斥保护。通过 `onlyIfNew` 预留覆盖本轮最长运行期的连续分钟键，任意重叠的执行必然争用同一个键；正常结束时释放自己获得的预留。平台硬超时无法清理时，旧键在对应分钟过去后自动不再阻挡新任务，最长约 210 秒，不需要删除并抢占别人的锁。过期键随超过 7 天的任务记录一起清理。管理员预览独立且不发布。

普通 `vite` 开发仍读取 `public` 静态初始数据。查看云端读取接口和更新流程请使用 `npm run edgeone:dev`；`vite preview` 不运行 Cloud Functions，构建后不会提供排行榜 JSON。

当前 CLI 本地开发不执行 `edgeone.json` 的 CDN rewrite，因此本地验证动态索引请直接访问 `/api/luck-ranking-index`；`/data/luck-ranking.json` 在本地仍是静态初始数据。部署后的兼容地址由精确 rewrite 提供，需在 eodev 域名验证。

## 限制

- eodev 已成功完成云端预览读取和计算。取消时间检查、手动发布、Blob 写入及互斥保护已经过本地测试和构建验证，重新部署后仍需验证实际发布及下一轮定时调度。
- 原始 KV 是最终一致存储，扫描期间玩家仍可能上传。固定键列表保证单轮范围稳定，但它不是所有玩家同一时刻的事务快照，与原下载脚本的逐份读取性质一致。
- 单份压缩文本限制为 1 MiB，解压限制为 32 MiB；超过上限会停止发布。私有进度解压限制为 128 MiB，压缩对象限制为 24 MiB。数据增长达到这些限制时应调整分片存储，而不是继续增大内存。
- 当原始数据持续损坏、配置缺失或超过处理能力时，保留旧榜并在日志中报告失败／待续跑，不承诺每天一定能发布新版本。

参考：[Cloud Functions](https://pages.edgeone.ai/document/cloud-functions)、[调度配置](https://pages.edgeone.ai/document/edgeone-json)、[Pages KV](https://pages.edgeone.ai/document/kv-storage)、[Blob](https://pages.edgeone.ai/document/blob-storage)、[Node.js 路由](https://pages.edgeone.ai/document/node-functions)。
