# 半日闲（Banrixian）

一座以**苏州园林美学与山野休闲**为主题的浏览器 3D 漫游原型。访客无需注册，即可在园林、茶室、竹林步道和望湖台之间漫步、停留。无宗教仪式、任务、积分或强制社交。

## 版本状态（2026-11-11）

- **生产环境：M0.8**，Cloudflare Pages 部署成功：https://banrixian.pages.dev
- **开发环境：M0.9**，仅在 `develop` 分支，尚未发布；包括可折叠手机 HUD、分层植物、建筑细节、石板路及水面装饰。
- **验收：** M0.8 自动化测试 32 项通过；用户反馈 iPhone Chrome 上 M0.8 场景可加载且运行流畅（截图约 60 FPS）。这不代表全部操作或其他设备已验收。
- **尚未完成：** 正式角色模型、坡地/拱桥高度、真实 NavMesh、动态天气/季节、音景、最终场景美术和中国大陆公开运营合规评估。

## 当前已实现

- Three.js / TypeScript / Vite 的 3D 场景与第三人称镜头。
- 键盘 WASD / 方向键移动，触屏轻点地面 A* 寻路，拖动旋转、滚轮和双指缩放。
- 茶室与望湖台附近坐下/起身；回到入口、停止自动行走及 Esc 停止。
- 游客本地存档：位置、视角与有效坐姿；离开页面和进入后台时保存。
- 三档画质（省电、均衡、精细），本地保存选择；FPS、最近 180 帧 P95、Draw Calls 与三角形计数。
- 桥面、护栏、竹林使用实例化渲染；场景仍属逐步完善的低多边形原型。

## 本地运行

需要 Node.js 22（CI 使用 Node 22）。

```bash
npm install --no-package-lock
npm test
npm run build
npm run dev
```

## 开发与发布原则：代码和文档同步

**每次涉及功能、行为、架构、界面、部署或验收状态的代码变更，必须在同一 PR / 同一开发批次更新相关文档。文档未同步，不视为开发完成。**

1. 日常开发提交到 `develop`，更新代码、测试及相关文档；不直接向 `main` 推送功能。
2. 每个里程碑通过 GitHub Actions 的 `npm test`、`npm run build`，并核对文档。
3. 里程碑集中合并到 `main`，触发一次 Cloudflare Pages 生产构建；发布后记录部署结果与实测范围。
4. Cloudflare Pages 预览构建保持关闭，避免消耗免费构建额度。
5. 实测、自动化测试、部署成功分别记录，不能相互替代。

详见 [文档同步规范](docs/DOCUMENTATION-POLICY.md)、[架构与里程碑](docs/ARCHITECTURE.md)、[版本记录](docs/CHANGELOG.md)、[视觉规范](docs/VISUAL.md)。

## 部署

- GitHub：`gamehack/yunshang-xiaosi`；生产分支：`main`；开发分支：`develop`。
- Cloudflare Pages 项目：`banrixian`。
- 构建：`npm test && npm run build`；产物目录：`dist`。
- GitHub Actions：PR 验证；Cloudflare Pages：生产构建和托管。
- 仓库开发期公开，不得提交密钥、个人数据或未授权素材。

## 文档说明

- [研究与产品决策历史](docs/RESEARCH-COURTYARD.md)：含早期探索假设；与现行实现冲突时，以最新已确认决策及当前版本文档为准。
- [旧版 PRD](docs/PRD.md) 与 [旧版合规文档](docs/COMPLIANCE.md)：历史资料，尚未完成新版审核，不作为当前开发依据。
- 中国大陆公开运营前仍需独立完成监管分类、备案、版权与隐私合规评估。
