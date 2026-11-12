# M2.2 R0｜临水茶室切片

2026-11-12。临水茶室开发预览已加入细竹枝、不规则石板、岸石和草簇，并简化瓦面和实时阴影。Windows 本机 Radeon 已完成双分辨率渲染验证，60 FPS 目标及高保真观感仍待验收。

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

脚本默认使用 SwiftShader。设定 `$env:REVIEW_RENDERER = 'hardware'` 后再运行可测本机 GPU。脚本记录实际 WebGL 渲染器，硬件模式识别到软件渲染器时会失败。

## 资产记录

| 文件 | 来源及作者记录 | 尺寸与用途 |
| --- | --- | --- |
| `art/blender/architecture/teahouse.blend` | 本项目原创程序化资产，Codex 协助制作。源生成器为 `scripts/blender/create_teahouse.py`。无外部网格或贴图。正式发布前随项目确认资产权利记录。 | 371,436 字节。Blender 5.2.4 LTS 源文件。 |
| `dev/art-preview/generated/teahouse.glb` | 由上述源文件导出。 | 977,988 字节，13 个网格、21 种材质。仅本地生成，生产构建不包含此资产。 |
| 开发预览地表与水法线 | `src/dev/teahouse-preview.ts` 本地程序生成。 | 无外部请求。地表色差和水面法线仅用于本次切片。 |
| 开发预览铺地、池岸和竹林 | `src/dev/courtyard-details.ts` 与 `src/world/bamboo.ts` 本地程序生成。 | 石板、岸石、草簇与竹枝使用实例化。 |

参考图页、材质方向、机位与预算见 [苏州园林美术规范](REALISTIC-ART-DIRECTION.md)。参考照片均以链接记录。

## 验证结果

Blender 后台保存和导出通过，GLB 体积从首轮的 1,606,476 字节降到 977,988 字节，减少约 39%。当前主机位为 152 draw calls、57,340 个三角面，首轮为 149 draw calls、62,158 个三角面，默认游戏为 151 draw calls、31,290 个三角面。当前结果达到切片的体积和几何预算。新增的铺地和植物使用实例化，茶室的实时投影集中在瓦顶、梁柱和假山。

Windows Chrome 157.0.8103.78 以 Playwright 无头模式、DPR 1 运行。每次在场景就绪后用 `requestAnimationFrame` 采样约 5 秒。表中 P95 为这段样本的帧间隔，截图 HUD 使用独立的统计窗口。

| 渲染器 | 分辨率 | 默认游戏 FPS / P95 | 新版预览 FPS / P95 |
| --- | --- | --- | --- |
| AMD Radeon / D3D11 | 1366×768 | 30.0 / 33.6 ms | 30.0 / 33.7 ms |
| AMD Radeon / D3D11 | 1920×1080 | 30.0 / 33.9 ms | 30.0 / 33.8 ms |
| SwiftShader | 1366×768 | 13.4 / 83.4 ms | 8.4 / 133.3 ms |
| SwiftShader | 1920×1080 | 10.0 / 116.7 ms | 5.9 / 199.9 ms |

两种渲染器的双分辨率预览均收到 GLB HTTP 200，截图前无页面、控制台或请求错误。预览模式通过坐下、刷新续游、起身、键盘移动、回入口和 GLB 请求失败回退检查。保留 [1366×768 默认](evidence/m22/r0-refinement/before-1366x768.jpg)、[1366×768 预览](evidence/m22/r0-refinement/after-1366x768.jpg)、[1920×1080 默认](evidence/m22/r0-refinement/before-1920x1080.jpg)、[1920×1080 预览](evidence/m22/r0-refinement/after-1920x1080.jpg) 和 [Radeon 原始记录](evidence/m22/r0-refinement/hardware.json)。首轮证据见 [历史截图](evidence/m22/r0/)。

`npm test` 99 项、`npm run build`（含类型检查）和原有 `npm run test:browser` 通过。生产包中未发现茶室预览模块或模型路径。Vite 仍报告主 JS chunk 大于 500 kB。

本机无头模式下默认游戏与预览均为 30 FPS，采样中未达到 60 FPS / P95 ≤ 25 ms。还需用前台硬件 Chrome 复测，并验证云端 Chromium、首帧和显存表现。下一轮补墙顶与树冠构图、檐下阴影和材质变化，再复看檐下望池与沿岸行走机位。高保真美术和最新提交的 GitHub CI 尚待验收。
