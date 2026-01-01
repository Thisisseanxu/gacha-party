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

- **便捷的数据导入**: 支持直接粘贴或上传由官方PC端“抽卡记录导出工具”生成的`.json`文件，快速开始分析。
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

## :gear: 项目结构

.

├── public/                 # 静态资源

│   ├── images/             # 项目中使用的图片资源

│   │   ├── cards/          # 角色立绘

│   │   ├── cardpools-icon/ # 卡池封面

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

[渺软公益CDN](https://cdn.onmicrosoft.cn/) 为本站字体提供cdn加速服务
以及所有为本项目提供帮助和支持的朋友们！