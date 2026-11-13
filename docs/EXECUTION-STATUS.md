# 半日闲 M2.0 · 云端 Codex 执行状态

## 2026-11-12 · M2.2 R0 茶室切片

- 基于 `347134a`，在 `codex/blender-integration` 完成参考、规范和可漫游切片。远端 `develop` 基线仍为 `4b2cd93`，其里程碑验证通过。
- Windows 本地完成 Blender 导出与 GLB 校验、两种桌面分辨率前后对照、开发预览交互与失败回退、原有浏览器回归、单测及构建。见 [切片报告](R0-TEAHOUSE-REPORT.md)。
- 已补近景植物、岸线和铺地，并完成白墙、树冠、椽檩与檐下光照。桌面 Radeon Chrome 实走进入茶室并转身望池，主机位约 30 FPS。后续继续细化人物、远亭和植被，复测 60 FPS 目标及云端 Chromium。未进行推送或部署。

## 2026-11-12 · M2.2 R0 Blender 管线检查点

- Windows 本地功能分支 `codex/blender-integration`，基线为本地 `origin/develop` 引用 `4b2cd93`。正式构建逐字节匹配基线。
- Blender 5.2.4 LTS 重复导出、GLB 校验和 Chrome 1366×768、1920×1080 渲染通过。`npm test` 99 项、`npm run build`、`npm run test:browser`、10 分钟 `npm run test:soak` 均有本地证据。
- [操作及验收记录](BLENDER-PIPELINE.md)。下一步为高保真茶室或临水庭院切片，继续按 [M2.2 写实园林计划](M2-2-REALISTIC-SUZHOU-GARDEN.md) 执行。

更新：2026-11-11。此文件由云端 Codex 按每个开发批次持续更新。**本轮已执行开发与自动回归，证据以文末检查点为准；不代表用户最终验收或生产发布。**

## 当前检查点
- 任务：G6 — M2.0 RC 验证完成，报告归档
- 工作分支：develop
- 权威任务：docs/ROADMAP.md
- 验收矩阵：docs/ACCEPTANCE.md
- 发布：禁止自动合并 main 或触发 Cloudflare Pages 生产部署
- 最近已核验应用CI：`f843894` / [43003243599](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43003243599) 全部成功。
- 已完成云端Chromium交互与11张截图；真实PC硬件FPS/P95、Edge/iPhone、听感/最终审美与合规仍待验收
- 阻塞：无已知P0代码阻断；10分钟最终构建持续运行已完成；仅真实设备及人工发布闸门保留

## 每批次记录模板
### YYYY-MM-DD / Gx.y / 任务标题
- 状态：待做 / 进行中 / 已实现待验收 / 已验证 / 阻塞
- 开始 HEAD / 完成 SHA：
- 修改文件与实现摘要：
- 测试命令、数量、结果：
- GitHub Actions run URL / conclusion：
- 验收矩阵对应项与证据：
- 未验证项、风险、阻塞：
- 下一项任务：

## 最终 RC 报告模板
- develop HEAD / PR #27：
- G0–G6 逐项完成度：
- A01–A20 证据和未验收项：
- CI、测试、构建：
- 关键视觉截图/性能数据（若真实取得）：
- 合规与素材清单：
- 是否具备用户一次性集中验收条件：
- 明确声明：未获用户授权，不合并 main，不发布生产。

## 2026-11-11 / 云端 M2.0 RC.1 执行检查点

- 起始 HEAD：693da7b90f75943bbd076d10a53a644a55617005；工作分支 develop，用户授权提交与推送。
- G0 基线：43项通过、build通过、基线Actions成功，详见 M2-AUDIT。
- G1：37项导航与控制器回归，完整路线连续采样、桥面直达、非法目标/输入冲突修复；G1-REPORT。
- G2：13项人物回归，真实座高与通行面、膝关节、平滑转向与30/60帧一致性；G2-REPORT。
- 全量当前：84项通过，TypeScript与Vite构建通过（主包545kB提示仍保留）。
- Chromium中间版本：12类交互/故障检查完成，页面异常与请求失败均0；最终构建回归和10分钟全程折返仍在运行，完成后补充准确报告。
- 文档：README、ARCHITECTURE、VISUAL、CHANGELOG、G0/G1/G2报告、素材隐私清单已同步。
- Ruling：沿用现有二维A*，不引入NavMesh；共享空间/高度数据修复实际问题。风险：装饰景石/植被不等于全场景精细物理碰撞。
- Ruling：固定位置截图使用显式存档夹具，连续移动证据来自真实按键的持续运行记录，二者不混用。
- 阻塞/限制：GitHub API 403，已用GitHub网页核验基线；最新CI待推送后检查。真实PC硬件、Edge/手机和法规确认独立保留。
- 下一步：完成最终浏览器和持续运行 → 检查截图/修复 → 更新验收矩阵 → 提交推送develop → 核验对应CI。
- 禁止：不合并main、不合并PR #27、不生产发布。

### 首批提交后检查
- 提交 `32293d6` 已推送 develop；87项测试与构建通过。
- 浏览器脚本最后一次固定视角编辑出现括号语法错误（被 node 实际执行发现），已修正并通过 `node --check`，重跑完整浏览器回归中；此提交的浏览器CI不得预先认定通过。
- 独立审查的望湖台边界/家具碰撞新增2项先红后绿回归已纳入87项；座位朝向另1项先红后绿。

### 最终构建浏览器回归与审查修复
- 代码提交 `32293d6`，脚本语法修复 `39aaa60`，均已推送develop；PR #27保持打开。
- 最终浏览器14类交互+1类独立无WebGL初始化故障检查通过；页面异常0/失败请求0；包含庭院真实点击走至茶室、两处坐姿刷新和存储拒绝回退。
- 11张截图和两个JSON已保存到 docs/evidence/rc1，索引见 BROWSER-REPORT。
- 新增真实Three.js射线的镜头墙体缩短与平滑恢复回归通过；全量测试本次将增加到88项。
- 独立review Important：圆台边界已修复，两项导航用例先失败后通过；Minor：站姿穿凳已同步修复，坐姿存档特殊校验保留。保留轻微步道地面高度差和近景叶片批次边界说明。
- 10分钟测试已因圆台/家具修复重新针对最终构建计时，完成后再保存结果，未完成前不记通过。

### 验证结果
- 本地最终：14个测试文件、88项全部通过，构建和带main基准的文档门禁通过；`git diff --check`通过。
- `39aaa60` 对应 [Actions 42997050159](https://github.com/gamehack/yunshang-xiaosi/actions/runs/42997050159) GitHub页面明确显示 Success；该次含87项单测与新增浏览器CI。
- 本次只新增相机回归和证据/文档，未改变已浏览器验证的应用运行代码；推送后核验新提交。

### 最终加严浏览器回归
- 17类交互 + 1类独立无WebGL初始化检查通过，pageerror=0、requestfailed=0；证据已更新到 docs/evidence/rc1。
- 追加验证：ArrowUp、停止按钮、真实音频上下文的可见性暂停、context恢复清除按住W的位置断言。

## 最终 RC 交付检查点

- 应用代码由 `32293d6` 引入，脚本修复 `39aaa60`、88项/截图证据 `e918bac`，加严浏览器检查 `b1e713a`。后续提交只归档最终记录；精确当前SHA可用 `git rev-parse HEAD`，避免文档自引用SHA。
- 全量88项通过（14文件），构建、文档门禁、diff检查通过。17类浏览器交互+1类无WebGL故障检查通过，pageerror/requestfailed=0。
- 最终持续运行602.456秒通过：z=8 → -96.091（湖台，家具阻挡）→16.515（入口边界），20采样，JS堆7.207–8.523MB，无页面异常。PERFORMANCE及原始JSON已归档。
- 截图12张（11关键/异常视角+1持续运行结束）；全部在docs/evidence/rc1。
- 最新已核验CI见后续CI核验记录；[e918bac / 42997507466](https://github.com/gamehack/yunshang-xiaosi/actions/runs/42997507466) 已成功。当前若在恢复任务中，先查此后文档归档提交的Actions，再决定是否有工作，不要重做已完成开发。
- 结论：可进行集中PC产品体验验收；真实PC GPU 60FPS/P95目标、Edge P1、手机P2、最终听感/审美与运营法规独立保留，不声称全设备/合规通过。
- 剩余工程限制：程序化低多边形美术；9m竹叶批次渐隐边缘；装饰景石未做完整物理碰撞；外部铺路2.5cm高度差；主包545kB提示。均未掩盖。
- 继续任务仅在用户体验反馈或实际失败证据出现后修复对应项；不自动扩展产品方向，不合并main/PR #27，不生产发布。

### 最终CI偶发失败调查
- 0fd1dbf / Actions 42998672940 的浏览器步骤失败；之前b1e713a / 42998364725成功。此为相同脚本和应用代码，仅文档归档不同，不能将失败忽略。
- GitHub网页仅公开“exit code1”，步骤日志UI地址返回404（API仍403）。已在浏览器脚本加入失败时JSON、截图、最近通过检查清单和公开GitHub错误注释，下一次运行用于定位具体断言，不修改测试标准或应用逻辑。

## 恢复执行：浏览器同步缺陷修复（2026-11-11）

- 起始本地/远端HEAD均为 `a50e250bba48acf33bc1e483c4d4df8275a85b92`，工作区干净；不重复G0–G5既有开发。
- [a50e250 / Actions 42999202714](https://github.com/gamehack/yunshang-xiaosi/actions/runs/42999202714) 已成功；0fd1dbf的旧失败仍保留，不把偶发成功当作同步问题不存在。
- 确定性复现：页面默认超时50ms、场景200ms后初始化，旧`waitForFunction(fn,{timeout})`在50ms错误超时；音频按钮异步200ms后更新，旧即时读取得到false而期待true。两个新增Chromium回归均先失败，修复后2/2通过。
- 修复：公共browser-sync等待器把options放第三参数；播放/静音等待目标aria状态且按钮重新可用；茶室路线10s/120s超时正确生效；停止按钮和WebGL丢失提示以条件同步替代固定睡眠。
- 完整真实WebAudio回归额外延迟resume/suspend各150ms，检验异步完成；不修改应用音频代码或降低断言。
- Node原生浏览器回归文件使用`.check.mjs`，独立于Vitest发现路径；最初`.test.mjs`被两种runner同时收集的失败已诊断并修正，未禁用测试。
- 当前本地：Vitest 14文件88项通过；独立Chromium同步2项通过；构建/文档门禁通过；Chromium17类交互+独立WebGL回退通过，pageerror/requestfailed均0。
- 应用运行代码及构建主包hash `main-Ddl0WhWj.js`保持不变，保留已有602.456秒持续运行记录，不为测试脚本改动重复同一长时验收。
- 下一步：推送同步修复 → 核验对应CI → 逐张复核12张截图/补验收记录 → 保存最终RC检查点。

### 同步修复CI与视觉补证
- [06e6521 / Actions 43001773127](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43001773127) 已核验Success，包含88项Vitest、2项独立Chromium同步回归、完整游戏浏览器回归。
- 独立代码审查未发现阻塞问题：正确第三参数超时、音频目标aria+enabled条件、真实AudioContext原生方法仍执行，原断言和失败产物保留。
- 12张原图已实际复核。补充两处侧视时发现湖台石凳与平台同色造成悬坐错觉；读取真实场景几何确认骨盆底0.875m与座面0.875m一致，改为深色石材提高顶面可读性。应用仅此材质变化；无座位或导航重做。
- 新build主包 `main-BFOHP6CT.js`；88项单测与构建再次通过。原602.456秒持续运行证据保留为材质调整前的行为/稳定性记录，不宣称此次重复长时测试。
- 侧视捕获通过Three.js已有观察事件读取真实对象；不写入生产测试接口，等待骨盆贴实际座面后断言并拍图，纳入完整浏览器CI入口。

### 恢复执行本地最终验证
- 材质修正后88项Vitest、2项Chromium同步、17类完整交互、无WebGL初始化回退及2处真实座面/骨盆几何检查全部通过；浏览器无页面异常/失败请求。
- 新侧视实测茶座骨盆底0.590172m/座面0.590000m，湖座0.875189m/座面0.875000m，均小于2mm断言；侧视已实际打开确认石凳支撑面可辨。
- 独立review再次核查测试未改姿态或几何、未绕过断言；新增材质纳入现有资源释放路径，无重要发现。
- 14张截图（原12+2侧视）、逐图复核、SHA-256清单及真实场景JSON已归档。

## 恢复任务最终检查点

- 应用验收HEAD：`f8438947291c8b8d72518ce25b99c145466dfea2`，已推送develop；[Actions 43003243599](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43003243599) 明确Success。此前同步修复06e6521的独立CI也成功。
- 当前应用对应本地及CI：88项Vitest、2项Chromium同步回归、TypeScript/Vite、完整17类交互、独立无WebGL回退、2处真实座面几何/侧视检查均通过；无浏览器页面异常/失败请求。
- [完整RC报告](M2-RC-REPORT.md)、[验收矩阵](ACCEPTANCE.md)、[逐图复核](VISUAL-REVIEW.md)、14图及场景几何JSON均已归档；manifest的14张PNG与运行源码SHA-256校验一致。
- 原602.456秒持续运行保留为材质调整前已执行的记录；没有冒充本轮重跑。真实PC硬件、Edge/手机、最终听感/审美和合规保留独立验收。
- 后续报告归档提交不改变应用、测试或验收断言；其CI按当前develop的Actions核验。
- main远端仍为 `b668659afbaa907c214fa69e6351686450697c3d`；未合并PR #27、未触发生产发布。没有需要逐项用户决策的代码阻塞。
- 恢复后不要重复G0–G6；先核验远端HEAD/当前报告归档CI，再仅处理明确失败或集中体验反馈。

## M2.1 视觉专项检查点
- 唯一任务：M2-1-VISUAL-REMEDIATION，按V0→V4执行，不重做G0–G6。
- V0基线：14b5ba6；工作区初始干净，develop远端相同；[Actions 43013275888](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43013275888)成功。
- V0真实Chromium基线完成：1920×1080、1366×768各14图，共28图；均衡、DPR1，含6主要场景、竹林近景、角色正侧背/行走/两坐姿；无pageerror/requestfailed。
- before报告及相机/Draw Calls/三角形/实时读数存docs/evidence/m21/before，不用旧手机截图替代。
- V1红测试已复现：前景竹竿不淡出、近镜头几何不清除、双臂与躯干分离、缺少前臂/手链。下一步实现仅局部遮挡处理与可见关节。
- 禁止：不合并main、不发布生产、不改其他仓库。

### M2.1 V1 完成
- V0提交b59c247的[Actions 43014784924](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43014784924)成功。
- V1：竹竿/竹节/竹叶全部采用相机–人物有限通道的逐片元稳定抖动剔除，深度写入保持开启；不切换透明模式，不整片竹林渐隐。邻近及人物后方植被保持不透明。
- 人物补齐肩/肘/前臂/手、髋/膝/踝连接，动画状态和锚点不变；4项红测试复现后转绿。
- 全量93项、构建通过；完整2项Chromium同步+17交互+WebGL回退+两处座椅几何通过。
- 两分辨率V1共16张专项截图，pageerror/console.error/requestfailed/WebGL error均0。新增console监听抓到原favicon.ico 404，已定位并补原创favicon.svg；修复后全量V1截图重跑通过，未忽略错误。
- 下一步：V2构图/建筑/铺装/植被层次，保持现有导航与存档。

## M2.2 R1–R4 进度（2026-11-12）

- R0 茶室切片：已在 `codex/blender-integration` 提交 `5205125`，含 Blender 茶室/亭台源文件、导出脚本、开发预览及 courtyard 细化。未推送 develop。
- R1 建筑与园林空间重建：`src/world/garden.ts`、`src/world/exterior.ts` 重建为更真实的苏式园林比例：白墙带勒脚与瓦帽、双坡黛瓦屋顶带屋脊封头与檐下木梁、后墙真实椭圆漏窗、茶桌与茶凳、木桥带护栏与铺板、池亭四柱攒尖顶、园门与围墙按共享导航足迹构建。可见几何与 `layout.ts` 导航数据保持一致，不穿墙、不浮空。
- R2 植物、太湖石与地表：`src/world/bamboo.ts` natural 模式用于花园与外部竹林，带节间、分枝、下垂叶片；太湖石改为擦伤多面体体现瘦皱漏透；苔藓/土地/岸石分层材质；`src/world/landscape.ts` 树冠比例更自然。
- R3 水、材质与自然光照：`src/main.ts` 开启 PCFSoftShadowMap 与方向光阴影，HemisphereLight 调为偏暖自然光；建筑与地面开启 cast/receive Shadow；水面粗糙度与法线保留；三档画质 DPR 上限不变，禁止高成本 SSR。
- R4 人物与沉浸一致性：现有 `src/avatar/visitor.ts` 髋膝分节、肩肘手连续、坐起/转向按 dt 过渡、脚底贴地与座面贴合单测已通过；无需额外改动。
- R5 全流程 PC 浏览器验收与交付：待真实 Chromium/Playwright 环境执行，无法在此环境完成。

## 2026-11-13｜M2.2 R5 复核与 M2.3 启动基线

- 仓库：gamehack/yunshang-xiaosi。
- 工作分支：codex/blender-integration；Preview 触发 commit：61db07dba2b8989e4deec72d4fbb7ab5098c21e1。
- 分支比较：相对 develop（4b2cd936599250bbc9097894f52ea253b2dd5e42）ahead 6 / behind 0；尚未合并。
- Cloudflare Pages：项目 banrixian；Preview https://c1b36841.banrixian.pages.dev，部署 ID c1b36841-16f0-45c8-b3d0-6c1c0fbeb05d，2026-11-13 02:42 UTC deploy success；Preview branch include 为 develop 与 codex/blender-integration。
- 生产：仍为 main commit b668659afbaa907c214fa69e6351686450697c3d，没有进行生产部署。
- 当前已打开 Preview 页 HUD 文本快照：约 32 FPS、P95 33.5ms、130 Draw Calls、22,980 triangles。硬件、分辨率、DPR、画质与采样窗口未确认；只作为运行时观察。
- R0 历史 Radeon Chrome 数据：约 30 FPS / P95 33.5ms；主机位 154 Draw Calls / 78,236 triangles；GLB 1,076,024 bytes、14 meshes、22 materials、1 embedded texture。SwiftShader 1920×1080 样本约 4.2 FPS / P95 250ms。数据见 R0-TEAHOUSE-REPORT.md，不外推为全设备性能。
- 本次浏览器连接器仅能读取当前标签页文本，无法控制页面、保存截图或执行 Playwright。因此 R5 的双分辨率截图、完整路线交互、360° 遮挡巡检、错误监听与性能复测未完成；没有将其写成通过。
- 下一步：按 M2.3 ULTRA 垂直切片计划完成资产规范与范围冻结，再在本地 Kilo/Blender 工作站执行资产制作和可执行浏览器验收。
- 安全边界：未合并 develop、未合并 main、未触发生产发布。
