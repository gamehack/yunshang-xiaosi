# 半日闲（Banrixian）

一座以**苏州园林美学与山野休闲**为主题的浏览器 3D 漫游原型。访客无需注册，即可在园林、茶室、竹林步道和望湖台之间漫步、停留。无宗教仪式、任务、积分或强制社交。

## 版本状态（2026-11-11）

- **生产环境：M1.3**，Cloudflare Pages 部署成功：https://banrixian.pages.dev
- **开发环境：M2.0 RC.1**（`2.0.0-rc.1`），位于 `develop` / PR #27，尚未合并或发布。88项自动测试、构建与云端Chromium交互/截图已通过，最终证据见文末检查点。
- **验收：** M1.3 已发布，iPhone Chrome 截图确认 M1.3 标识；近景竹叶遮挡仍存在，镜头动态行为与跨设备性能尚未完成验收。M0.8 的约 60 FPS 截图仅是历史设备观测。
- **尚未完成：** 最终角色美术与动作打磨、坡地/拱桥高度、真实PC硬件性能与最终审美验收、动态天气/季节（未列入 M2.0 必需项）、最终场景美术和中国大陆公开运营合规评估。程序化音景已在 develop 实现但未发布。

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

Blender 5.2 LTS 可在 Windows 本地生成和校验 GLB。测试资产通过独立开发页加载。操作见 [Blender 资产管线](docs/BLENDER-PIPELINE.md)。

## 开发与发布原则：代码和文档同步

**每次涉及功能、行为、架构、界面、部署或验收状态的代码变更，必须在同一 PR / 同一开发批次更新相关文档。文档未同步，不视为开发完成。**

1. 日常开发提交到 `develop`，更新代码、测试及相关文档；不直接向 `main` 推送功能。
2. 每个里程碑通过 GitHub Actions 的 `npm test`、`npm run build`，并核对文档。
3. 里程碑集中合并到 `main`，触发一次 Cloudflare Pages 生产构建；发布后记录部署结果与实测范围。
4. Cloudflare Pages 预览构建保持关闭，避免消耗免费构建额度。
5. 实测、自动化测试、部署成功分别记录，不能相互替代。

云端 Codex 持续开发请先阅读 [M2.0 开发交接单](docs/CODEX-HANDOFF.md)，并按其中的安全边界执行。

详见 [文档同步规范](docs/DOCUMENTATION-POLICY.md)、[架构与里程碑](docs/ARCHITECTURE.md)、[版本记录](docs/CHANGELOG.md)、[视觉规范](docs/VISUAL.md)。

## 部署

- GitHub：`gamehack/yunshang-xiaosi`；生产分支：`main`；开发分支：`develop`。
- Cloudflare Pages 项目：`banrixian`。
- 构建：`npm test && npm run build`；产物目录：`dist`。
- GitHub Actions：PR 验证；Cloudflare Pages：生产构建和托管。
- 仓库开发期公开，不得提交密钥、个人数据或未授权素材。

## 文档说明

- [研究与产品决策历史](docs/RESEARCH-COURTYARD.md)：含早期探索假设；与现行实现冲突时，以最新已确认决策及当前版本文档为准。
- [现行产品需求](docs/PRD.md)、[全量开发计划](docs/ROADMAP.md)、[验收矩阵](docs/ACCEPTANCE.md)。
- [旧版合规文档](docs/COMPLIANCE.md) 属历史资料，尚未完成新版审核，不作为当前开发依据。
- 中国大陆公开运营前仍需独立完成监管分类、备案、版权与隐私合规评估。

## M2.0 RC 开发检查点（2026-11-11）

`develop` 正在形成 `2.0.0-rc.1`，未合并 main、未发布生产。当前生产状态与上文历史版本分开记录。

本轮修复连续桥头与导航安全、真实座面/地台高度、髋膝坐姿、平滑转向、精确坐姿续游、屋脊方向、PC HUD、资源释放及页面/WebGL 生命周期。当前模块与证据见 [G0 审计](docs/M2-AUDIT.md)、[导航报告](docs/G1-REPORT.md)、[人物报告](docs/G2-REPORT.md)、[执行状态](docs/EXECUTION-STATUS.md)。

浏览器回归使用 Chromium（环境中已有的 `/usr/bin/chromium`，或 `npx playwright-core install --with-deps chromium` 安装；也可设 `CHROMIUM_PATH`）：

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# 在另一终端执行
TEST_URL=http://127.0.0.1:4173 npm run test:browser
TEST_URL=http://127.0.0.1:4173 npm run test:soak
```

截图与 JSON 默认保存到 `artifacts/browser` / `artifacts/soak`（不入 Git）；CI 上传浏览器证据。固定视角截图使用显式本地存档夹具，不表示从入口连续走到该地点。`test:soak` 实际运行至少 10 分钟，前 5 分钟向北、后 5 分钟折返，检查到达湖台与返回庭院；软件 GPU 指标不代表真实 PC 性能。

浏览器同步回归：`npm run test:browser:sync` 包含2项独立Chromium测试，验证自定义超时和延迟音频按钮；`npm run test:browser` 会先执行这两项，再运行完整游戏交互。完整游戏测试对真实AudioContext切换注入150ms延迟，以捕获过早读取状态的竞态。

完整交付见[M2.0 RC验收报告](docs/M2-RC-REPORT.md)：最终应用f843894的GitHub Actions全部成功；原12张截图复核并补2张侧视，共14张带哈希证据。未合并或生产发布。
