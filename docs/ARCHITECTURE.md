# 半日闲工程架构（M0.1）

> 本文替代早期 2.5D Phaser、宗教寺院和多人房间架构。当前不建设联机、聊天或服务端房间。

## 当前技术栈

- TypeScript + Vite + Three.js / WebGL。
- M0.1 已提交静态 3D 场景占位、渲染循环、窗口自适应和基础 FPS / draw calls 读数。
- React、NavMesh、IndexedDB、天气接口属于后续候选模块，**当前尚未安装或实现**。

## 目标模块边界

- engine：渲染器、生命周期、资源管理
- world：园林、竹林、望湖台场景与分区加载
- character：第三人称角色与输入
- navigation：可通行网格、点击寻路、避障
- camera：跟随、碰撞与坐姿镜头
- interaction：座椅、茶室等
- persistence：游客本地续游，后续可选云同步
- performance：画质分档、P95 帧时间、内存与加载指标
- ui：设置与提示

## M0 实施顺序

1. M0.1 工程骨架/静态场景/基础监控（代码已提交，**构建未验证**）
2. M0.2 角色漫步、点击寻路、镜头与碰撞
3. M0.3 园林双环白模
4. M0.4 竹林、望湖台、跨区资源加载
5. M0.5 座椅交互、游客本地存档
6. M0.6 多档画质、性能回归、验收

## 验收与约束

M0.1：npm install / npm run build、浏览器首帧、窗口调整、FPS 与 draw calls 读数。需要真实运行验证。
M0 完成：园门至望湖台可达并折返；桥面/路径导航连续；不穿墙落水；可坐下起身；游客刷新续游；画质分档不改变路径。

真实苏州时间、天气、季节与音效在后续阶段实现；不能把 M0.1 占位场景视为最终美术。公开运营前另行开展合规审查。

## M0.2 进行中（代码已提交，尚未构建验收）

- `src/navigation/walk-controller.ts`：WASD/方向键输入、地面点击 Raycast、临时二维网格 A*、基础禁行区域、第三人称跟随镜头。
- `src/main.ts`：将移动控制器接入渲染循环，并在退出页面时释放事件监听。
- **限制**：当前仅为平地占位场景；A* 禁行区域为硬编码矩形，尚未使用 NavMesh；未实现桥梁高差、相机遮挡/碰撞、真实模型碰撞、动作动画及移动设备控制。
- **验证待办**：npm install/npm run build、Chrome 首帧、键盘移动、点击可行走地面、点击池塘拒绝寻路、自动行走中键盘中断、窗口 resize、帧率/内存。GitHub Actions 结果需独立检查。

## M0 验证加固（本轮）

- 新增 Vitest 与 `tests/navigation.test.ts`，覆盖临时网格 A* 的障碍物、非法目标、绕行和同点路径。
- GitHub Actions 现在执行 `npm test` 后再 `npm run build`，并在 `tests/**` 变更时触发。
- **状态说明**：测试和工作流已提交；本轮未取得 GitHub Actions job 运行结果，尚不能声明测试或构建成功。GitHub combined commit statuses 返回空列表，这不代表 CI 通过。
- **后续工程门槛**：先取得 CI 成功日志和浏览器烟测，再引入真正 NavMesh、坡地和桥面高度；当前硬编码平面网格不应进入完整园林白模的正式导航实现。

## M0.3 园林空间白模第一版（代码已提交）

- 新建 `src/world/garden.ts`，以约 42×36 米的**缩尺验证场地**表示入口、三段院落轴线、外围回廊路径、池塘双水湾、北侧茶室、西侧假山、东侧亭台、竹林占位。它不等同于产品概念中约 70×55 米的最终园林。
- `src/main.ts` 接入园林白模；`src/navigation/walk-controller.ts` 的临时禁行区域与池塘、茶室外形对齐。
- **尚未完成**：苏式建筑细部、完整连通的双环 NavMesh、桥面、茶室可进入交互、白墙碰撞、植物资产优化、手机触控镜头、竹林外路与望湖台。当前白墙仅为视觉几何，不应视为物理阻挡。
- 后续先验证 Cloudflare Pages 自动构建、浏览器首帧与导航路径，再补充完整碰撞和园林尺度；性能数据必须在真实设备复测。

## M0.2/M0.3 移动与镜头体验修复批次（待 Cloudflare 验证）

- `WalkController` 增加指针拖动旋转镜头、镜头俯仰限幅、滚轮缩放、手机轻点地面自动行走、拖动阈值区分点击与旋转、失焦时清除输入、销毁事件监听。
- 角色键盘移动改为相对镜头朝向；主场景 HUD 根据手机/PC 展示不同操作提示；移动端 DPR 限制 1.5 作为初步性能保护。
- 临时二维网格增加外墙、入口柱碰撞；增加单元测试。**这不是最终 NavMesh**，茶室仍为不可进入区域，桥面、坡地、镜头遮挡、双指缩放、真实第三人称人物模型、手机浏览器手势兼容尚待实现。
- 当前阶段的正确验收：Cloudflare Pages `npm test && npm run build` 通过；手机轻点移动、拖动旋转且不误触移动；电脑 WASD、拖动、滚轮正常；池塘与墙不可穿越。需要浏览器实测才能标记通过。

## 2026-11-11 M0.4/M0.5 实施记录

- Cloudflare Pages 确认 `caa1c3b` 构建及生产部署成功，上一轮 Vitest 测试文件转义换行语法错误已修复。
- `src/world/exterior.ts`：北门外竹林长路、InstancedMesh 竹子、湖面和望湖台石椅的第一版白模。
- `src/navigation/walk-controller.ts`：将平面网格可行走范围延伸至望湖台，添加从园门到观景台路径测试；实现坐下状态下停止移动、镜头状态读写。
- `src/persistence/guest-save.ts`：本地游客存档（位置、镜头、坐姿标志、时间），读取时校验数值和通行位置；存储不可用时不阻止游客使用。
- `src/main.ts`：每 5 秒及离开页面时保存、刷新恢复位置与镜头、茶室和观景台附近的坐下/起身按钮。**坐姿目前仅为角色缩放占位，不是正式座椅锚点动画；刷新不恢复动作中间态。**
- **待验收**：最新 M0.5 提交的 Cloudflare 测试和构建、浏览器交互；茶室真实可进入、座椅定位、桥梁及坡地 NavMesh、园林双环精确碰撞、场景资源分区、远景性能仍未完成。

## M0.5 续游稳定性修复（2026-11-11）

- Cloudflare 已确认 `8f138f2` 测试、构建和生产部署成功；M0.5 初版代码具备部署基线。
- 游客续游新增页面进入后台时保存（`visibilitychange`），减少手机浏览器被系统挂起时的进度丢失。
- 读取存档时，只有靠近茶室或望湖台的已知座椅才能恢复坐姿；恢复位置、镜头和稳定坐姿状态，不恢复中途移动指令。
- 新增 `tests/guest-save.test.ts`：有效存档往返、损坏 JSON、不可行走位置、无效相机数值、座椅恢复位置及禁用 localStorage 的降级行为。
- 本轮新提交仍需 Cloudflare CI 结果验证，未完成真实手机/PC 浏览器交互验收。

## Cloudflare 免费构建额度保护：批量开发流程（2026-11-11 生效）

- `main` 是唯一生产发布分支，连接 Cloudflare Pages `banrixian`；生产构建命令 `npm test && npm run build`，输出 `dist`。
- `develop` 是日常开发集成分支。Cloudflare Pages 当前 `preview_deployment_setting=none`，因此 `develop` 的普通提交不应触发 Pages 预览构建；保持此设置，不要启用所有分支的预览部署。
- 一个里程碑中允许多个文件修改、多次 `develop` 提交；先在本地或独立 CI 验证 `npm ci && npm test && npm run build`，再合并到 `main`。仅在批次验收时合并，目标每批次一次生产部署。
- 文档、测试和代码在同一批次合并；避免直接修改 `main`。生产构建失败先在 `develop` 修复并完整验证，再合并一次。
- 对于紧急线上修复，允许单独 hotfix 合并到 `main`；上线后同步回 `develop`，避免分支分叉。
- Cloudflare Pages 的预览部署设置必须保持禁用；如未来更改配置，先检查预览分支筛选策略，避免开发分支消耗构建额度。

## M0.6 批量开发（develop 分支，未发布）
- 茶室开放东侧入口：移除临时封闭式茶室碰撞，保留后墙和立柱碰撞，新增从庭院进入茶室的 A* 测试。
- 触屏双指缩放：跟踪两个 PointerEvent 指针的距离调整第三人称镜头距离；保留单指拖动和轻点行走。
- “回到入口”按钮：显式清除坐姿与当前路线、恢复入口坐标和初始镜头，立即写入游客存档。
- 新增不可通行起点的寻路保护与测试。
- 本批次只在 develop 提交，未合并 main；后续需先运行 npm test && npm run build 验证，完成 PC/iPhone 交互验收后再集中发布。

## M0.6 木桥批次补充
- 池塘 z≈2 增加 x=1.5..17.5 的木桥铺板及两侧护栏白模；碰撞层仅允许桥面 x=1.1..17.9、z=1.1..2.9 跨越主池塘，其余池水保持不可走。
- 增加跨桥 A* 回归测试，确认路径经过桥面且邻近水面不可走。
- 目前桥面为近地面白模，未实现真实拱桥坡度、人物高度适配、坡地 NavMesh；后续以统一可通行几何数据替代手写坐标。
- 所有改动仅在 develop，Cloudflare 预览构建保持禁用，待完整测试后合并 main。

## M0.6 release / M0.7 development (2026-11-11)
- M0.6 merged into main via PR #9 (squash commit `c1d536c`), GitHub Actions 18/18 tests and Vite build passed; Cloudflare Pages production deployment succeeded. Browser-based PC/iPhone interaction acceptance is still pending.
- After squash release, main was merged back into develop via PR #10 to keep the development branch synchronized.
- M0.7 starts with three runtime rendering quality choices: 省电 (DPR cap 1), 均衡 (1.5), 精细 (2). This changes canvas render resolution only, not the A* navigation geometry. Real-device frame rate and battery impact must be measured before selecting mobile defaults.
- Public repository uses standard GitHub-hosted Actions for pre-merge CI; do not commit secrets or proprietary assets. Cloudflare preview deployments remain disabled; merge to main only in validated batches.

## M0.7 性能回归基线（开发中）
- 三档渲染分辨率支持本地保存，单独的 quality 工具函数可测试；省电/均衡/精细的 DPR 上限分别为 1/1.5/2。
- 木桥铺板、栏杆立柱、园林竹竿和竹冠使用 InstancedMesh，降低重复物体的绘制调用；实际性能仍以真实设备为准。
- 新增最近 180 帧的帧时间统计，HUD 展示 P95 帧时间、FPS、Draw Calls 与三角形数量。P95 为最近帧时间的 nearest-rank 统计，不代表长时间运行的 P95。
- 当前未完成 PC/iPhone Safari 真机验收，也未实现自动动态画质或 WebGL context lost 恢复。M0.7 不应仅凭 CI 通过宣称已完成性能验收。


---

## 当前状态快照（2026-11-11，覆盖本文早期阶段性状态）

**文档阅读原则：** 本文前面的 M0.1–M0.7 “未实现”“未发布”“待 CI”属于当时的历史记录，不能作为当前状态。当前状态以 README、CHANGELOG 及本节为准。代码与文档必须在同一开发批次同步更新，详见 DOCUMENTATION-POLICY.md。

### 当前架构

- 渲染：Three.js WebGLRenderer、单场景、PerspectiveCamera、requestAnimationFrame；画质三档控制 DPR 上限。
- 场景：`src/world/garden.ts` 约 42×36m 缩尺园林；`src/world/exterior.ts` 北侧竹林长路与望湖台。程序化几何和 InstancedMesh；未实现真实场景分区流式加载。
- 导航：`src/navigation/walk-controller.ts` 使用硬编码可通行范围与二维 A*；支持键盘移动、触屏点击行走、镜头拖动和缩放、Esc/按钮取消路线；**不是 NavMesh**，没有坡地与拱桥高差。
- 交互：茶室和望湖台附近的坐下/起身为角色缩放占位；没有真实坐姿动画和座椅锚定。
- 存档：`src/persistence/guest-save.ts` 保存位置、镜头、坐姿；定时、页面隐藏和离开时写入 localStorage。
- 性能：`src/performance/quality.ts` 三档画质持久化；`frame-stats.ts` 最近 180 帧 P95；HUD 显示 FPS、Draw Calls、三角形数量。
- UI：`src/main.ts` 生成 HUD；M0.9 手机端默认折叠，支持展开收起；暂无独立 UI 框架。
- CI/CD：GitHub Actions PR 验证（npm test + npm run build），Cloudflare Pages main 生产部署；develop 预览部署关闭以节约免费构建额度。

### 版本状态与验收

- M0.6：PR #9，18 项测试通过，生产部署成功。
- M0.7：PR #11，29 项测试通过，生产部署成功。
- M0.8：PR #13，32 项测试通过，生产部署成功；用户反馈 iPhone Chrome 运行正常并提供性能截图。该反馈不等于所有交互和浏览器已全面验收。
- M0.9：PR #15（develop，未发布）；手机折叠 HUD、植物层次、建筑格栅/檐口、石板铺装、水纹与岸线已提交；最新 CI 需再次核验。

### 技术债与后续方向

1. 当前碰撞边界与场景几何分别维护，需统一空间数据以避免视觉与可通行范围偏离。
2. 坡地、桥梁高差、正式人物模型及动作动画未实现。
3. WebGL 上下文丢失恢复、真实设备性能基线和自动化浏览器烟测未完成。
4. 场景视觉仍为低多边形过渡版本，苏式建筑与植物尚需系统化资产设计。
5. 生产部署成功、CI 通过与真实浏览器验收必须分别记录，详见 CHANGELOG.md。

## M1.0 视觉模块演进（开发中）

- 新增 `src/world/bamboo.ts`，以 InstancedMesh 统一构造竹竿、竹节和披针形叶片；园内外通过位置数组共享同一生成逻辑。
- `garden.ts` 添加茶室双坡屋顶、错缝铺装和实例化岸石；均为视觉几何，不改动 `walk-controller.ts` 的二维导航边界。
- 此批次仍需验证移动端 GPU 性能与视觉遮挡。建筑屋顶、岸线与导航的空间一致性尚未完成系统化验证。

## M1.1 视觉性能权衡（开发中）

- 竹叶实例数由每株 18 增至 72，园内外统一生成；实例化 draw group 数不变，但顶点处理及透明度之外的片元开销可能增加，必须以手机 P95 和帧率验证。
- 茶室屋顶几何重构为两块坡面，移除重叠水平大屋顶；新增少量实例化庭院灌木。
- 不修改二维寻路、桥面或碰撞边界。真实设备及视觉验收尚未完成。
