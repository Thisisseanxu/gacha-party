该目录下的内容现在由自动化脚本直接生成，禁止手动修改！
cards.json 是网站和小程序共享的角色数据源。
gacha_info.json 是小程序使用的获取数据地址，gacha_pools.json 是网站和小程序使用的分析数据卡池。

luck-ranking.json 是网站欧非排行榜的总榜与卡池索引，luck-ranking-pools 目录存放按需加载的单卡池详情；格式详见 `docs/luck-ranking-data-format.md`，示例文件应通过 `npm run ranking:sample` 生成。
