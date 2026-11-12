# M2.2 R0｜临水茶室切片

2026-11-12。当前为可漫游的美术验证，建筑细节、山石地被、水面和光照已接入开发预览。全园仍沿用现有美术。茶室切片的高保真观感与 PC 硬件性能仍待完成验收。

## 基线审计

- 远端 `develop` 实查为 `4b2cd93`，其 Milestone validation 成功。现有 M2.1 机位和坐姿侧视证据见 `docs/evidence/m21/`。本次以 Blender 接入提交 `347134a` 为工作基线。 [GitHub Actions 基线](https://github.com/gamehack/yunshang-xiaosi/actions/runs/43017117824)
- 保留 `layout.ts` 的茶室柱位、后墙、地台和池塘通行范围，保留 `walk-controller.ts`、`seats.ts`、`visitor.ts`、存档和音景。默认游戏继续走原场景。茶室旧模型仅在开发预览隐藏，已有镜头遮挡代理继续参与射线计算。
- 后续替换范围包括茶室以外的平板屋顶、规则岸石、成排竹冠、重复铺地、外围墙与树冠。当前切片先替换茶室白模和西侧假山，补草簇、浮叶、地表色差、水面法线和静态阴影。周边竹林、角色和步道仍有明显白模痕迹。

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

## 资产记录

| 文件 | 来源及作者记录 | 尺寸与用途 |
| --- | --- | --- |
| `art/blender/architecture/teahouse.blend` | 本项目原创程序化资产，Codex 协助制作。源生成器为 `scripts/blender/create_teahouse.py`。无外部网格或贴图。正式发布前随项目确认资产权利记录。 | 411,658 字节。Blender 5.2.4 LTS 源文件。 |
| `dev/art-preview/generated/teahouse.glb` | 由上述源文件导出。 | 1,606,476 字节，13 个网格、21 种材质。仅本地生成，生产构建不包含此资产。 |
| 开发预览地表与水法线 | `src/dev/teahouse-preview.ts` 本地程序生成。 | 无外部请求。地表色差和水面法线仅用于本次切片。 |

参考图页、材质方向、机位与预算见 [苏州园林美术规范](REALISTIC-ART-DIRECTION.md)。参考照片均以链接记录。

## 验证结果

- Windows Chrome + Playwright + SwiftShader 实际渲染。1366×768 和 1920×1080 的同机位前后图、GLB HTTP 状态、浏览器错误与 HUD 数据见 [入库证据](evidence/m22/r0/)。预览模式实测坐下、刷新续游、起身、键盘移动、回入口与 GLB 请求失败回退。
- 主机位由 151 降至 149 draw calls，三角面由 31,290 增至 62,158。1920×1080 的软件渲染 HUD 样本由约 9 FPS / P95 300 ms 变为约 6 FPS / P95 400 ms。该结果记录本机软件渲染开销，真实 GPU 预算仍需验证。
- `npm test`、`npm run build`、原有 `npm run test:browser` 通过。生产包中未包含茶室预览模块或模型路径。
- 切片的下一轮集中在近景竹枝、岸石与通行地面衔接、白墙与树冠背景层次，以及减少阴影与几何开销。高保真美术验收、真实 PC GPU、云端浏览器及本地提交的 GitHub CI 尚未验证。
