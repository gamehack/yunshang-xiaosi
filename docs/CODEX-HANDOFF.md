# 云端 Codex 开发交接单 — 半日闲 M2.0

日期：2026-11-11；状态：继续开发，不代表已验收或发布。

## 立即开始
1. checkout gamehack/yunshang-xiaosi 的 develop 分支，确认 working tree clean；不要在 main 开发。
2. 读取 README.md、docs/PRD.md、docs/ROADMAP.md、docs/ACCEPTANCE.md、docs/ARCHITECTURE.md、docs/VISUAL.md、docs/DOCUMENTATION-POLICY.md。
3. 运行 npm install --no-package-lock、npm test、npm run build；检查 PR #27 的 CI。若基线失败，先修复并记录。
4. 逐项审查现有实现与路线图，不要把已实现功能重复开发。以代码、测试和实际行为为准，更新验收矩阵。

## 已有实现（需回归验证）
- M1.4：A* 触屏寻路、镜头遮挡处理、竹林分区渐隐、画质与帧统计、本地存档、WebGL 恢复。
- M1.5：茶室/亭台构件、竹林与湖畔场景、池塘水纹等渐进美术。
- M1.6：程序化游客模型、行走/坐姿过渡（dt 无关）、程序化环境音、音量与后台暂停。
- 座椅：src/navigation/seats.ts 独立座位锚点与最近座位匹配；坐下停走并定位，起身回站立点；src/navigation/seats.test.ts 四项测试。
- 最近已验证 CI：提交 1f6ad69fd9587af4a8777ecd42d6c28ec8fbebb9 成功；云端执行前重新核验 develop HEAD。

## 剩余任务优先级
### A. P0 行为正确性
1. 核查两处座椅的真实模型位置、高度、朝向、站立点是否与实际世界几何匹配；必要时修正锚点、碰撞和相机，并补回归测试。
2. 检查坐下/起身、寻路中断、重新加载存档、回入口、触屏交互的状态一致性；修复跨帧动画与移动控制冲突。
3. 检查入口→茶室→竹林→望湖台→返回的全程可达性；测试碰撞/导航与桥面、池塘边界，优先修复阻断。

### B. P1 视觉与体验
4. 按 docs/VISUAL.md 完善苏州园林建筑、白墙黛瓦、屋顶檐角、漏窗、植被、太湖石、铺地、水岸、远景；遵守低成本渲染和原创素材要求。
5. 优化游客待机、行走、转向、坐下/起身过渡及镜头跟随；不引入聊天、任务、积分或多人系统。
6. 完善首次进入提示、移动端安全区与触控尺寸、音量/静音、无障碍、离线/异常提示。

### C. P0 发布候选质量
7. 消除渲染帧循环无谓分配、内存泄漏和 WebGL 丢失后状态异常；保留画质分级与性能统计。
8. 扩充 Vitest 与可自动执行的交互/逻辑测试；建立 PC Chrome/Edge、iPhone Chrome/Safari 的人工验证清单。没有真实设备数据时明确标记待验证，禁止伪造 FPS。
9. 复核外部资源授权、隐私、公开运营监管事项，未确认部分保留发布闸门。
10. 更新 docs/ACCEPTANCE.md 与 docs/ROADMAP.md 的逐项证据、README、ARCHITECTURE、VISUAL、CHANGELOG，形成 M2.0 RC 报告。

## 连续执行协议
- 依照 A→B→C 持续开发；每个逻辑批次：代码 + 测试 + 文档同步 → npm test → npm run build → git commit → git push develop → 查看 CI → 下一批。
- 普通失败自行修复重试；对无法解决的阻塞写入 docs/EXECUTION-STATUS.md，继续处理无依赖任务。不要每个批次等待用户回复 go。
- 不修改其他业务仓库、不泄露密钥、不自动开启危险权限、不增加付费服务。
- **禁止**自动 merge PR #27、直接 push main、触发 Cloudflare Pages 生产部署。最终统一验收由用户批准。
- 实际手机截图、FPS、兼容性和合规检查若无法执行，必须列为未验证，不得声称完成。
- 每次开发结束更新 docs/EXECUTION-STATUS.md，包含 commit SHA、测试/CI 结果、完成项、阻塞、下一步。

## 执行平台：云端 Codex（最终决策）
- 用户明确决定直接使用云端 Codex 开发半日闲；**不开发、不升级、不部署 codex-bridge 或 Project Runner**。
- 云端 Codex 直接通过 GitHub 工作区读取本仓库计划，在 develop 上开发、测试、提交并检查 CI；无需硅谷服务器或 Codex Bridge。
- 若云端 Codex 单次任务存在运行时长限制，按可执行批次推进，提交检查点和下一批任务，不能假设任务会在平台限制之外自动运行。
- 不得将 gamehack/codex-bridge 的开发计划视为半日闲依赖或待办。

## 最终交付
develop 上 M2.0 RC、全部可自动运行测试通过、文档与实现一致、PR #27 可审查、未验证项和风险清单完整。**不自行合并/生产发布。**
