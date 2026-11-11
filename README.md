# 半日闲（内部仓库：yunshang-xiaosi）

一座位于虚构「摸鱼山」上的苏式园林与自然山居世界。用户在 PC 浏览器里自由漫步、静坐、听自然声音，不设置任务、等级、排名、奖励或强制社交；**不包含宗教场景或仪式**。

## 当前状态

- 产品决策：完整路线白模 M0（园门→园林→茶室→竹林→望湖台）。
- 工程阶段：**M0.1 已提交工程骨架和静态 3D 占位场景；尚未验证构建、尚未实现角色漫步/寻路/存档，尚未部署**。
- 公开品牌「半日闲」；仓库历史代号保留，旧寺院概念不再适用。

## 本地运行

要求 Node.js 20.19+ 或 22.12+（以 Vite 7 的运行要求为准）。

```bash
npm install
npm run dev
npm run build
```

目前仅能显示占位几何场景和基础 FPS / draw calls 读数。M0.2 才实现 WASD、点击寻路、角色控制和第三人称跟随镜头。

## 文档

- [产品研究与确认决策](docs/RESEARCH-COURTYARD.md)
- [工程架构](docs/ARCHITECTURE.md)
- [旧版 PRD](docs/PRD.md)、[旧版视觉规范](docs/VISUAL.md)、[旧版合规文档](docs/COMPLIANCE.md)：历史材料，尚未按半日闲重写，**不得作为当前实施依据**。

## 合规

正式公开运营前评估中国大陆网络游戏等适用监管要求及隐私告知；M0 阶段仅做内部原型。

## 部署：Cloudflare Pages

- 项目：`banrixian`，GitHub 源：`gamehack/yunshang-xiaosi` / `main`
- 默认域名：`https://banrixian.pages.dev`
- 构建命令：`npm test && npm run build`；输出目录：`dist`
- GitHub Actions 的旧构建工作流已移除，使用 Cloudflare Pages 原生 Git 自动构建与部署。
- 这是内部白模原型；部署成功后仍须验证浏览器控制、性能及中国大陆公开运营合规。
