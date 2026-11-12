# M2.2 R0｜临水茶室切片

2026-11-12。临水茶室开发预览加入灰泥墙面、墙顶瓦帽、分层树冠，以及带原创木纹的檐下椽子和檩条。Windows 本机 Radeon 已在桌面 Chrome 完成双分辨率加载和从池岸进入茶室的实走验证。60 FPS 目标及高保真观感仍待验收。

## 基线审计

- 远端 `develop` 实查为 `4b2cd93`，其 Milestone validation 成功。现有 M2.1 机位和坐姿侧视证据见 `docs/evidence/m21/`。本次以 Blender 接入提交 `347134a` 为工作基线。 [GitHub Actions 基线](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43017117824)
- 保留 `layout.ts` 的茶室柱位、后墙、地台和池塘通行范围，保留 `walk-controller.ts`、`seats.ts`、`visitor.ts`、存档和音景。默认游戏继续走原场景。茶室旧模型仅在开发预览隐藏，已有镜头遮挡代理继续参与射线计算。
- 首轮替换茶室白模和西侧假山，补草簇、浮叶、地表色差和水面法线。第二轮重做主路和茶室支路的石板，在双水湾外沿添加岸石与草簇并留出桥面通道，给近景竹叶补细枝和高低变化。外围墙、远景树冠、支路和人物仍可见白模痕迹。

## 本地预览

从仓库根目录导出开发 GLB，启动 Vite 后访问 `http://127.0.0.1:5173/?art=teahouse`。从入口往西北侧茶室走。参数仅在 Vite 开发模式生效。GLB 缺失时继续显示原场景。

```powershell
node scripts/blender/export.mjs art/blender/architecture/teahouse.blend dev/art-preview/generated/teahouse.glb
npm.cmd run dev -- --host 127.0.0.1
```

在另一个 PowerShell 里运行同机位前后截图、加载检查和交互回归。

```powershell
$env:CHROMIUM_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:TEST_URL = 'http://127.0.0.1:5173'
node scripts/blender/teahouse-review.mjs
```

脚本默认使用 SwiftShader。设定 `$env:REVIEW_RENDERER = 'hardware'` 可测本机 GPU，再加上 `$env:REVIEW_HEADED = '1'` 可用桌面 Chrome 窗口运行。脚本记录实际 WebGL 渲染器，硬件模式识别到软件渲染器时会失败。运行时会点击池岸前方的茶室地台，等待导航到达，再拖动并缩放镜头望向池面。

## 资产记录

| 文件 | 来源及作者记录 | 尺寸与用途 |
| --- | --- | --- |
| `art/blender/architecture/teahouse.blend` | 本项目原创程序化资产，Codex 协助制作。源生成器为 `scripts/blender/create_teahouse.py`。檐底木纹由脚本生成并打包进源文件，无外部网格或贴图。正式发布前随项目确认资产权利记录。 | 408,025 字节。Blender 5.2.4 LTS 源文件。 |
| `dev/art-preview/generated/teahouse.glb` | 由上述源文件导出。 | 1,076,024 字节，14 个网格、22 种材质、1 张内嵌贴图。仅本地生成，生产构建不包含此资产。 |
| 开发预览地表与水法线 | `src/dev/teahouse-preview.ts` 本地程序生成。 | 无外部请求。地表色差和水面法线仅用于本次切片。 |
| 开发预览铺地、池岸和竹林 | `src/dev/courtyard-details.ts` 与 `src/world/bamboo.ts` 本地程序生成。 | 石板、岸石、草簇与竹枝使用实例化。 |
| 开发预览墙面与树冠 | `src/dev/courtyard-backdrop.ts` 本地程序生成。 | 沿用墙体位置及遮挡代理。墙帽、勒脚、枝干及树冠使用实例化，墙面与叶团色差来自运行时生成的贴图。 |

参考图页、材质方向、机位与预算见 [苏州园林美术规范](REALISTIC-ART-DIRECTION.md)。参考照片均以链接记录。

## 本轮验证结果

Blender 后台重建源文件、导出和 GLB 校验通过。檐底与椽子共用 128×128 木纹贴图，原有建筑占地、座椅、导航和镜头规则沿用。斜阳缩小阴影覆盖范围并给墙、梁柱和柱础接收阴影。池面提高粗糙度，降低水纹法线强度。

桌面 Chrome 157.0.8103.78 使用 AMD Radeon / D3D11。1366×768 与 1920×1080 两种分辨率下，默认与新版均约 30 FPS，5 秒样本 P95 均为 33.5 ms。同一桌面 Chrome 的可见空白页在 5 秒内也只收到 148 次动画帧回调（29.6 次/秒），本机结果无法判断场景在 60 Hz 环境的余量。新版主机位 154 draw calls、78,236 个三角面，仍在 180 次和 90,000 面预算内。原始记录见 [桌面 Chrome 验证](evidence/m22/r0-framing/after/report.json)。

两种渲染器下的预览请求均为 HTTP 200，检查无页面、控制台或请求错误。1920×1080 下 SwiftShader 主机位从默认游戏的 8.9 FPS / P95 116.8 ms 降为新版 4.2 FPS / P95 250 ms。前一轮同机位样本为 5.9 FPS / P95 199.9 ms。软件渲染开销随本轮几何和材质增加。

路线从池岸 `(0, -4.6)` 点击茶室地台 `(-6.1, -8.6)`，确认自动寻路启动和到达，再用鼠标拖动与滚轮转身望池。1920×1080 新版机位分别为 166 次绘制、81,544 面和 138 次绘制、56,182 面。截图分别来自上一轮提交 `55db11c` 的无头 Chrome 和本轮桌面 Chrome，机位与路线相同。

| 机位 | 上一轮 | 本轮 |
| --- | --- | --- |
| 池岸朝向茶室 | [截图](evidence/m22/r0-framing/before/pondside-approach.jpg) | [截图](evidence/m22/r0-framing/after/pondside-approach.jpg) |
| 檐下转身望池 | [截图](evidence/m22/r0-framing/before/under-eaves-facing-pond.jpg) | [截图](evidence/m22/r0-framing/after/under-eaves-facing-pond.jpg) |

本轮 99 项单测、类型检查、构建、原有浏览器交互和独立 Blender 测试页均通过。生产包中未发现茶室预览模块或模型路径。

人物、远亭和外部竹林仍有白模痕迹。树冠现在提供墙后层次，正式资产仍需细化叶簇轮廓。60 Hz PC 上的帧时间、云端 Chromium、首帧与显存表现、正式美术验收和本地提交的 GitHub CI 尚待验证。

## 上一轮验证记录

Blender 后台保存和导出通过，GLB 体积从首轮的 1,606,476 字节降到 977,988 字节，减少约 39%。上一轮主机位为 152 draw calls、57,340 个三角面，首轮为 149 draw calls、62,158 个三角面，默认游戏为 151 draw calls、31,290 个三角面。新增铺地与植物使用实例化，茶室的实时投影集中在瓦顶、梁柱和假山。

Windows Chrome 157.0.8103.78 以 Playwright 无头模式、DPR 1 运行。每次在场景就绪后用 `requestAnimationFrame` 采样约 5 秒。表中 P95 为这段样本的帧间隔，截图 HUD 使用独立的统计窗口。

| 渲染器 | 分辨率 | 默认游戏 FPS / P95 | 新版预览 FPS / P95 |
| --- | --- | --- | --- |
| AMD Radeon / D3D11 | 1366×768 | 30.0 / 33.6 ms | 30.0 / 33.7 ms |
| AMD Radeon / D3D11 | 1920×1080 | 30.0 / 33.9 ms | 30.0 / 33.8 ms |
| SwiftShader | 1366×768 | 13.4 / 83.4 ms | 8.4 / 133.3 ms |
| SwiftShader | 1920×1080 | 10.0 / 116.7 ms | 5.9 / 199.9 ms |

两种渲染器的双分辨率预览均收到 GLB HTTP 200，截图前无页面、控制台或请求错误。预览模式通过坐下、刷新续游、起身、键盘移动、回入口和 GLB 请求失败回退检查。保留 [1366×768 默认](evidence/m22/r0-refinement/before-1366x768.jpg)、[1366×768 预览](evidence/m22/r0-refinement/after-1366x768.jpg)、[1920×1080 默认](evidence/m22/r0-refinement/before-1920x1080.jpg)、[1920×1080 预览](evidence/m22/r0-refinement/after-1920x1080.jpg) 和 [Radeon 原始记录](evidence/m22/r0-refinement/hardware.json)。首轮证据见 [历史截图](evidence/m22/r0/)。

`npm test` 99 项、`npm run build`（含类型检查）和原有 `npm run test:browser` 通过。生产包中未发现茶室预览模块或模型路径。Vite 仍报告主 JS chunk 大于 500 kB。
