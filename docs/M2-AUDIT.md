# M2.0 G0 基线与差距审计

2026-11-11，起始 develop `693da7b90f75943bbd076d10a53a644a55617005`。工作区起始干净，按现有计划执行，不修改生产 main。

## 基线证据
- Node 22.23.4；`npm install --no-package-lock`；43/43 测试、TypeScript/Vite 构建通过。
- PR #27 head 与 develop 同为 693da7b；Git read 验证。
- [基线 Actions 42994130806](https://github.com/gamehack/yunshang-xiaosi/actions/runs/42994130806)：GitHub 页面明确显示提交 693da7b / Success。API 被网络策略 403 拒绝，改用受支持的 GitHub 网页读取，未绕过权限。
- `GITHUB_BASE_REF=main node scripts/check-docs.mjs` 通过，已先 fetch origin/main；无 base 的跳过输出不当成验证。

## 功能映射与实际缺口
| 范围 | 已有模块 | 基线差距 | 本轮处理/证据 |
|---|---|---|---|
| G1 | navigation/walk-controller.ts | 网格取整误接受池水目标；细柱漏检；桥头连续性；停止后指针误寻路 | layout.ts 共享空间数据；G1-REPORT.md；路径与控制器回归 |
| G2 | avatar/visitor.ts、navigation/seats.ts、persistence/guest-save.ts | 茶座在茶桌内部；精确座位存档两处都失效；坐姿高度/关节穿模 | seats-geometry.test.ts；G2-REPORT.md |
| G3 | WalkController + main HUD | 镜头首次 raycast 矩阵未更新；大块纵向 PC HUD；音量滑块继承不可点 | 构造前 updateMatrixWorld；PC 网格 HUD；pointer-events 修复；browser-test.mjs |
| G4 | world/garden、bamboo、exterior | 屋脊横跨坡面；茶凳缺失；后墙“格栅”背后无开孔；硬远景分界 | 屋脊几何回归；真实椭圆漏窗；共享座位；landscape 与雾效；截图复核 |
| G5 | audio/ambient.ts、main tick | 共享几何/材质未释放；后台仍持续请求帧；BFCache pagehide 销毁后不能恢复；context 恢复积累按键与统计 | disposeScene；页面/上下文生命周期；bootstrap 错误回退；浏览器故障注入与持续运行 |
| G6 | Vitest、Actions、docs 门禁 | 无浏览器回归脚本、无完整截图/当前验收记录 | test:browser、browser-soak、BROWSER-REPORT、ACCEPTANCE、EXECUTION-STATUS |

本项目仍为程序化低多边形园林，不引入 NavMesh、付费模型、联网账户、多人、任务或商业化。

## 验证边界
- 自动连续路径检查不冒充浏览器从入口走完全程；固定位置截图明确使用 localStorage 观察点夹具。
- 软件渲染 FPS/P95 不作为真实 PC 性能达标证据。
- Edge、手机、真实 PC GPU 与法规结论需分别确认；不得以 CI 通过代替。
