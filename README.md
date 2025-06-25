# 盲盒派对抽卡模拟器

一个基于 Vite(Vue3) 开发的模拟抽卡网站，旨在提供和“盲盒派对”游戏内相同的抽卡体验，包含多种保底机制、概率提升、UP 机制以及自定义 UP 角色/组选择等功能。

---

## ✨ 主要功能

* **多卡池支持**: 可配置不同主题和规则的抽卡卡池，随意切换
* **丰富的保底规则**:
  * **硬保底**: 达到指定抽数必出高稀有度角色。
  * **概率提升**: 随抽数增加，高稀有度角色概率递增。
  * **UP 机制**: 抽中特定稀有度时，有概率抽取指定 UP 卡，或在“歪”了之后下次必中 UP。
* **自定义 UP 选择**:
  * **单角色 UP 选择**: 在某些卡池中，可从多个指定 UP 角色中选择一个作为本次抽卡的 UP 对象。
  * **UP 组选择**: 在常驻卡池中，可从多组 UP 角色中选择一组作为本次抽卡的 UP 对象，抽卡时只会从该组中抽取指定稀有度的 UP 卡。
* **可视化结果展示**:
  * 沉浸式抽卡结果界面，展示本次获得的卡片。
  * 卡片立绘显示及稀有度边框高亮。
  * 实时抽卡统计（各稀有度数量、总抽数）。
* **数据可配置**: 所有卡片数据、卡池配置（包括概率和规则）均通过独立的 JS 文件管理，易于扩展和修改。

---

## 🚀 快速开始

### 环境要求

* Node.js (推荐 LTS 版本)
* npm 或 Yarn (推荐 npm)

### 安装与运行

1. **克隆仓库:**

    ```bash
    git clone https://github.com/Thisiseanxu/gacha-party.git
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

## ⚙️ 项目结构

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

## 🤝 贡献指南

我们非常欢迎社区的贡献！如果你想为这个项目添砖加瓦，请遵循以下步骤：

1. **Fork 本仓库。**

1. **克隆你的 Fork:**

    ```bash
    git clone [你的fork地址]
    cd gacha-party
    ```

1. **创建新分支:**

    ```bash
    git checkout -b feature/your-feature-name # 例如：feature/add-new-pool
    ```

1. **进行你的修改和开发。**

1. **确保代码符合项目规范，并通过测试。**

1. **提交你的修改:**

    ```bash
    git commit -m "feat: 添加一个新功能/修复一个bug"
    ```

    (请参考下面的提交信息规范)

1. **推送分支到你的 Fork:**

    ```bash
    git push origin feature/your-feature-name
    ```

1. **在 GitHub 上创建一个 Pull Request** 到本仓库的 `dev` 分支。

### 提交信息规范 (Conventional Commits)

我们鼓励使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范来编写提交信息，这有助于自动生成更新日志。常见类型有：

* `feat`: 新增功能
* `fix`: 修复 bug
* `docs`: 文档更新
* `style`: 代码风格修改 (不影响代码运行)
* `refactor`: 代码重构 (不新增功能，不修复 bug)
* `perf`: 性能优化
* `test`: 添加或修改测试
* `chore`: 构建过程或辅助工具的变动

示例：`feat: 添加新的UR卡片和限定卡池`

## ❓ 提问与反馈

如果你在使用过程中遇到问题，或者有任何建议和想法，欢迎通过以下方式提出：

* **创建 Issue**: 在[Issue页面](https://github.com/Thisiseanxu/gacha-party/issues)上创建一个新的 Issue 来报告 Bug、提出功能请求或进行讨论。请尽可能详细地描述你的问题或想法。
* **在 TapTap 发帖** 在 TapTap 的[盲盒派对模拟器发布贴](https://www.taptap.cn/moment/686712261263229792)下方留言

---

## 许可证

本项目采用 [MIT 许可证](https://github.com/Thisiseanxu/gacha-party/blob/main/LICENSE) 开源。

---

## 致谢

感谢所有为本项目提供帮助和支持的朋友们！
