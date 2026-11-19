# 织夜工具箱

一个基于 Vite(Vue3) 开发的“盲盒派对”工具网站

## 目录

- [目录](#目录)
- [:sparkles: 主要功能](#sparkles-主要功能)
  - [:slot\_machine: 抽卡模拟器](#slot_machine-抽卡模拟器)
  - [:mag: 抽卡记录分析](#mag-抽卡记录分析)
- [:rocket: 快速开始](#rocket-快速开始)
  - [环境要求](#环境要求)
  - [安装与运行](#安装与运行)
- [:gear: 项目结构](#gear-项目结构)
- [:handshake: 贡献指南](#handshake-贡献指南)
  - [代码风格指南](#代码风格指南)
- [:question: 提问与反馈](#question-提问与反馈)
- [许可证](#许可证)
- [致谢](#致谢)

## :sparkles: 主要功能

### :slot_machine: 抽卡模拟器

- **多卡池支持**: 可配置不同主题和规则的抽卡卡池，随意切换
- **丰富的保底规则**:
  - **硬保底**: 达到指定抽数必出高稀有度角色。
  - **概率提升**: 随抽数增加，高稀有度角色概率递增。
  - **UP 机制**: 抽中特定稀有度时，有概率抽取指定 UP 卡，或在“歪”了之后下次必中 UP。
- **自定义 UP 选择**:
  - **单角色 UP 选择**: 在某些卡池中，可从多个指定 UP 角色中选择一个作为本次抽卡的 UP 对象。
  - **UP 组选择**: 在常驻卡池中，可从多组 UP 角色中选择一组作为本次抽卡的 UP 对象，抽卡时只会从该组中抽取指定稀有度的 UP 卡。
- **可视化结果展示**:
  - 沉浸式抽卡结果界面，展示本次获得的卡片。
  - 卡片立绘显示及稀有度边框高亮。
  - 实时抽卡统计（各稀有度数量、总抽数）。
- **数据可配置**: 所有卡片数据、卡池配置（包括概率和规则）均通过独立的 JS 文件管理，易于扩展和修改。

### :mag: 抽卡记录分析

- **云端记录分析**: 使用玩家ID和小程序激活码读取云端抽卡记录并分析，不再提供粘贴 JSON、上传文件和手动开始分析入口。
- **安卓取号助手下载**: 小程序码上方和右下角浮窗提供 APK 直接下载，小程序码上方另附下载二维码；使用教程视频及首次教程弹窗暂时隐藏，保留代码。
- **多维度统计分析**:
    * 自动区分 **限定池** 与 **常驻池** 数据，并分别进行统计。
    * 清晰展示总抽数、抽卡时间范围，以及当前距离上一个限定（SP）和SSR的垫抽数。
    * 精准计算获得限定（SP）和SSR的 **平均抽数**。
    * 一目了然的“最欧”和“最非”记录，展示获取限定（SP）或SSR所用的最少与最多抽数。
- **可视化抽卡历史**:
    * **出金历史轴**: 以进度条的形式直观展示每次获得限定（SP）或SSR的抽数，颜色会根据接近保底的程度（欧非程度）进行变化。
    * **完整记录查询**: 提供完整的抽卡历史列表，包含所有稀有度的角色，并支持分页浏览。
- **精细化卡池筛选**: 在限定池的分析结果中，可以根据卡池名称（如“车手盲盒机”）筛选特定卡池的数据，深入分析单个卡池的表现。
- **数据导出**: 支持将当前筛选的限定卡池或常驻卡池的完整抽卡记录导出为 `.csv` 文件，方便本地保存和进一步分析。

---

## :rocket: 快速开始

### 环境要求

- Node.js (推荐 LTS 版本)
- npm 或 Yarn (推荐 npm)

### 安装与运行

1. **克隆仓库:**

        ```bash
        git clone https://github.com/Thisisseanxu/gacha-party.git
        cd gacha-party
        ```

1. **安装依赖:**

        ```bash
        npm install
        # 或者
        yarn install
        ```

1. **启动开发服务器:**

        ```bash
        npm run dev
        # 或者
        yarn dev
        ```

        项目将在命令行中显示的地址启动。

1. **构建生产版本 (可选):**

        ```bash
        npm run build
        # 或者
        yarn build
        ```

        构建后的文件将输出到 `dist` 目录。

---

## bilibili Toy 静态资源

`edgeone.json` 与 `public/_headers` 为 `/data/cards.json`、`/data/card_pools_full.json` 和 `/images/*`（含嵌套目录）设置 `Access-Control-Allow-Origin: https://www.bilibili.com`，允许 Toy 不带凭据读取。Origin 值不带结尾 `/`；不开放其他 JSON 或 API。

两份 JSON 使用 `public, max-age=0, must-revalidate`，保留 ETag 更新校验；图片保留 90 天缓存。Toy 自行保存 15 分钟数据快照，网络失败时使用缓存或包内数据。配置需随网站部署后生效；Vite 的本地预览不会自动应用 EdgeOne 响应头规则。

部署后可用 `curl.exe -I -H "Origin: https://www.bilibili.com" https://mhpd.fans/data/cards.json` 检查响应头，并同样检查另一份 JSON 及 `/images/gacha_bg.webp`。缺失图片返回的路由 HTML 不会因为 CORS 变成图片，Toy 会继续使用本地兜底。

## 安卓助手下载

下载地址固定为 `https://mhpd.fans/downloads/gacha-record-helper.apk`。当前文件为「盲盒派对助手」1.0.4，来自 `../gacha-record-id-android/release/盲盒派对助手-1.0.4.apk`，随网站静态资源构建和部署。更新时替换 `public/downloads/gacha-record-helper.apk`，下载链接和 `public/images/record-assistant-download-qr.png` 无需改变。

`edgeone.json` 与 `public/_headers` 对该文件配置 Android APK 类型、附件下载和每次校验缓存，扫码会直接访问 APK。PWA 页面导航缓存排除 `/downloads/`，避免下载被当成网页缓存。响应头配置需随网站部署后生效。

视频教程由 `src/views/RecordPage.vue` 中的 `showVideoTutorial` 开关控制，当前为 `false`，同时隐藏正文视频、浮窗入口和首次使用弹窗；改回 `true` 即可恢复。

## 抽卡记录id验证与小程序同步

`POST /api/record-activate`（Cloud Function）接受 JSON `{ "record_id": "MHPD1.…" }`。服务端限制请求体及 GZIP 解压大小，从记录id提取 UID 和 upload_token，只向固定官方地址查询常驻池（9）的第一页。常驻池为空时尝试高级常驻池（10000）；要求返回的每条记录均包含与 UID 一致的 `player_id`，两池都为空时返回 422，不签发凭证。令牌失效返回 401，归属不匹配返回 403，官方服务异常返回 502。

验证通过后使用现有 `PRIVATE_KEY` 签发旧格式 Ed25519 激活码，返回 `player_id`、`activation_key`、`expires_at`，响应禁止缓存。新激活码有效期为10天，邮箱验证码签发也调整为10天；已签发的旧激活码仍按原到期时间有效。保留旧的 `PUBLIC_KEY` 验签，可直接访问相同 UID 的原云端存档及徽章投稿接口。自动签发禁止使用旧管理权限保留的 UID 范围（33开头的9位数），管理员凭证继续单独管理。

小程序在登录页输入记录id，主页恢复登录/账号入口，首次进入抽卡分析会跳转登录。登录成功后保存激活码，并允许复制到网站使用；过期后重新登录验证。签发失败时提示“登录失败：云端存档等功能不可用”，保留仅用于官方查询的会话，允许继续获取记录并跳过云端读写。同一 UID 只保留最新输入的记录id。云端下载、上传发送 `X-License-Key` 与 `X-Player-ID`。存储接口不再接受 `X-Upload-Token`，上传仍覆盖 `record_<UID>`，原10分钟上传冷却不变。徽章投稿使用同一激活码，保留审核、封禁与投稿频率限制。官方查询仍直接使用临时 upload_token；10天激活码不能延长官方令牌的寿命。

部署时先发布本仓库的 Cloud Functions 和 Edge Functions，沿用匹配的 `PRIVATE_KEY`/`PUBLIC_KEY` 及 `gacha_data`、`huizhang_data` 绑定，再发布小程序。不要将记录id、请求正文、`X-Token` 或激活码写入日志；为 `/api/record-activate` 配置 EdgeOne WAF 的跨实例频率限制。代码另提供实例内每分钟60次总请求、每枚令牌6次的限制，该限制不替代跨实例防刷规则。

验证命令：`node --test tests/record-activation.test.mjs tests/record-token.test.mjs`。安卓助手显示有效记录id后，可运行 `node scripts/verify-record-activation.mjs`，用真实官方响应验证 UID 归属和10天签名；该脚本仅使用临时测试密钥，不保存或输出凭证，不写入实际云端存档。

## :gear: 项目结构

.

├── public/                 # 静态资源

│   ├── images/             # 项目中使用的图片资源

│   │   ├── characters/          # 角色立绘

│   │   ├── cardpools/ # 卡池封面

│   └── favicon.ico

├── src/

│   ├── assets/             # 通用静态资源 (CSS, 字体等)

│   ├── components/         # 可复用的组件

│   ├── utils/        # Vue 组合式函数 (如 useGacha.js)

│   ├── data/               # 数据信息，如卡池配置，角色信息等

│   ├── router/             # Vue Router 配置

│   ├── views/              # 页面组件

│   ├── App.vue             # 根组件

│   └── main.js             # 应用入口文件

└── ...

## :handshake: 贡献指南

我们非常欢迎社区的贡献！如果你想为这个项目添砖加瓦，请遵循以下步骤：

1. **Fork 本仓库。**

1. **克隆你的 Fork:**

        ```bash
        git clone [你的fork地址]
        cd gacha-party
        ```

1. **创建新分支:**

        ```bash
        git checkout -b feat/your-feature-name # 例如：feat/add-new-pool
        ```

1. **进行你的修改和开发。**

1. **确保代码符合项目规范，并通过测试。**

1. **提交你的修改:**

        ```bash
        git commit -m "feat: 添加一个新功能/修复一个bug"
        ```

        (请参考下面的代码风格指南)

1. **推送分支到你的 Fork:**

        ```bash
        git push origin feature/your-feature-name
        ```

1. **在 GitHub 上创建一个 Pull Request** 到本仓库的 `main` 分支。

### 代码风格指南

本项目的npm包中包含ESLint，请在提交代码前格式化你的代码。推荐使用VSCode编辑器和ESLint扩展实现自动格式化。

我们鼓励使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范来编写提交信息，这有助于自动生成更新日志。常见类型有：

- `feat`: 新增功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码风格修改 (不影响代码运行)
- `refactor`: 代码重构 (不新增功能，不修复 bug)
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

示例：`feat: 添加新的SP卡片和限定卡池`

## :question: 提问与反馈

如果你在使用过程中遇到问题，或者有任何建议和想法，欢迎通过以下方式提出：

- **创建 Issue**: 在[Issue页面](https://github.com/Thisisseanxu/gacha-party/issues)上创建一个新的 Issue 来报告 Bug、提出功能请求或进行讨论。请尽可能详细地描述你的问题或想法。
- **在 TapTap 发帖** 在 TapTap 的[盲盒派对模拟器发布贴](https://www.taptap.cn/moment/686712261263229792)下方留言。

---

## 许可证

本项目采用 [MIT 许可证](https://github.com/Thisisseanxu/gacha-party/blob/main/LICENSE) 开源。

---

## 特别鸣谢

[渺软公益CDN](https://cdn.onmicrosoft.cn/) 为本站提供cdn加速服务
以及所有为本项目提供帮助和支持的朋友们！
