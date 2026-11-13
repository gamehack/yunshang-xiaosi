# 摸鱼山 Blender 资产管线

Blender 在美术工作站离线处理 `.blend`，输出自包含的 GLB。导出脚本先校验候选文件，再替换目标文件。浏览器通过 Three.js `GLTFLoader` 加载导出资产，镜头、灯光和交互由游戏控制。茶室审阅模式通过 `/?art=teahouse` 显式开启，本地 Vite 与 Cloudflare Pages 生产构建均可访问；普通访问不改变默认游戏体验。审阅资产从 `public/art-preview/generated/` 提供静态文件。

## Windows 本地执行

使用 Blender **5.2 LTS**（实测 **5.2.4 LTS**），导出脚本检查 5.2 版本系列。Node.js 按项目约定使用 22，本次本地验证使用已安装的 24.15.0。导出使用 Blender 自带的 glTF 导出器，无额外插件或服务依赖。

Windows 默认 Blender 路径为 `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`。其他安装位置可在当前 PowerShell 会话设置 `$env:BLENDER_EXE = 'D:\Apps\Blender\blender.exe'`，使用可执行文件的绝对路径。

从仓库根目录运行以下命令。

```powershell
npm.cmd install --no-package-lock
node scripts/blender/export.mjs
node scripts/blender/validate-glb.mjs dev/blender-smoke/generated/pipeline-fixture.glb
npm.cmd run dev -- --host 127.0.0.1
```

在浏览器打开 `http://127.0.0.1:5173/dev/blender-smoke/`。若 Vite 使用其他端口，按终端地址调整。开发页加载 GLB 后验证模型包围盒、底面、方向标记和 PBR 参数，再绘制首帧。可拖动旋转、滚轮缩放。

### 复用导出器与运行自动化

```powershell
# 导出独立资产，以本地预览目录为例
node scripts/blender/export.mjs 'D:\Art\teahouse-wall.blend' 'artifacts/asset-review/teahouse-wall.glb'

# 保持 Vite 开发服务运行，使用本机已安装的 Chrome
$env:CHROMIUM_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:TEST_URL = 'http://127.0.0.1:5173'
node scripts/blender/browser-smoke.mjs

npm.cmd test
npm.cmd run build
```

`export.mjs` 以后台模式打开指定源文件，禁用源文件内的 Python 自动执行，调用 `export_glb.py` 导出当前场景。出口为 glTF 2.0 GLB，导出器应用网格修改器并可携带动画。Node 校验器检查容器与块长度、内嵌缓冲区和图片、默认场景可达网格、顶点位置范围和材质引用。完整 glTF 兼容性及渲染效果仍通过目标浏览器验收。导出或校验失败时命令返回非零退出码，已有目标文件继续可用。

## 文件和材质约定

| 位置 | 内容 |
| --- | --- |
| `art/blender/smoke-test/` | 入库的 `pipeline-fixture.blend`，仅供管线测试。两块几何和两种材质均由本仓库脚本生成，无第三方素材。 |
| `scripts/blender/` | 资产生成、后台导出、校验和浏览器验收脚本。 |
| `dev/blender-smoke/generated/` | 本地生成的测试 GLB，由 Git 忽略，仅在 Vite 开发页加载。 |
| `artifacts/blender-smoke/` | 本地截图与验收报告，由 Git 忽略。 |
| `art/blender/<类别>/` | 后续正式源文件的目录约定。通过美术和许可审核后，为正式 GLB 单独规划 Vite 运行时目录。 |

- 一米对应一个 Blender/Three.js 单位，Blender 源场景使用米制、单位比例 1。资产原点设为摆放锚点，落地资产底面置于 Blender `Z=0`。
- Blender 为 Z 向上，模型正面按 `−Y` 制作。导出转换后 Three.js 为 Y 向上，正面是 `+Z`。导入时保持缩放 1，复核模型落地、正面和尺寸。
- 优先使用 Principled BSDF。基础色和自发光贴图按 sRGB 导入，粗糙度、金属度、遮蔽与法线数据按非颜色数据处理。复杂节点材质先烘焙为可移植的 PBR 贴图，并在 Three.js 目标光照中复核。
- 原创纹理可打包进 `.blend`。导出后检查 GLB 内嵌图片、UV 与材质引用，再到浏览器近景确认贴图方向。茶室檐底与椽子的木纹使用此流程，见 [切片报告](R0-TEAHOUSE-REPORT.md)。
- 相机和灯光由运行时提供，导出时排除。正式资产分别定义可见网格和交互所需的碰撞、导航、座椅锚点，在现有场景接入时一起复核。
- 入库前逐资产登记源文件与导出文件、作者、来源、许可与版本、署名和再分发条件、修改记录、文件大小。原创也登记作者和来源。许可不明或不允许再分发的素材不得纳入仓库或发布构建。

如需重建测试 `.blend`，在仓库根目录执行以下命令并选择尚不存在的输出路径。确认新源文件后可用上面的显式参数导出。

```powershell
$blender = $env:BLENDER_EXE
if (-not $blender) { $blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' }
& $blender --background --factory-startup --python-exit-code 1 --python scripts/blender/create_fixture.py -- artifacts/asset-review/pipeline-fixture.blend
```

## 本地验收记录

- Blender 5.2.4 LTS 已保存 90,463 字节的测试源文件，重复导出 20,460 字节的 GLB，包含两个网格和两种材质。另从脚本重建源文件并通过含空格的路径导出，GLB 结构一致，三个 UV 分量相差约 0.00000006。空场景导出返回失败，已有 GLB 的 SHA-256 保持一致。
- Windows Chrome `157.0.8103.50` 通过 Playwright 运行，使用 SwiftShader。1366×768 和 1920×1080 均返回 GLB HTTP 200，渲染测试模型并通过 `2.00 × 1.80 × 0.80 m`、Y 向上、`+Z` 正面和两套 PBR 参数检查，最终两次均无控制台错误、页面异常或失败请求。证据由 `browser-smoke.mjs` 生成。
- `npm test` 共 99 项通过，其中 6 项为新 GLB 校验。 `npm run build` 的 TypeScript 检查和 Vite 构建通过。构建产物的 5 个文件与 `4b2cd93` 基线 SHA-256 一致。已有 Vite 大包提示仍出现。
- 原有 `npm run test:browser` 通过，包括键鼠导航、坐下起身、续游、画质、音景和 WebGL 异常回退。 `npm run test:soak` 在本地预览构建完成约 10 分钟的北行与折返，20 次采样，页面异常 0。
- 基础测试几何覆盖比例和 PBR 参数。茶室切片另验证了内嵌基础色贴图与桌面 Radeon 渲染。骨骼动画导入、60 FPS 目标、其他浏览器、正式美术与本地提交的 GitHub CI 尚待验证。

## 正式园林的下一步

按 [M2.2 写实园林计划](M2-2-REALISTIC-SUZHOU-GARDEN.md) 先做临水茶室或庭院的高保真切片。以人物与座椅校准尺度，先在现有漫游镜头里检查连廊、漏窗、水岸和太湖石形成的框景，再打磨灰泥、黛瓦、木材及植被的色彩、粗糙度和法线。用两种目标桌面分辨率记录同机位对照与动态回归，测量下载体积、首帧、draw calls 和 P95 帧时间后确定资源预算。切片通过后，再分批扩展到园门、池塘回廊、竹林和望湖台。


## Cloudflare 线上茶室审阅模式

- 审阅入口：`https://banrixian.pages.dev/?art=teahouse`。
- 静态资产目录：`public/art-preview/generated/`。
- 运行时文件名固定为 `teahouse.glb`、`pavilion.glb`；不得把 GLB 留在被 Git 忽略的本地临时目录。
- 本地导出后，先运行 `node scripts/blender/validate-glb.mjs <asset.glb>`，再复制到上述 public 目录并提交 main。
- 缺少 GLB 时，审阅模式会在控制台报告错误并回退，不影响默认游戏；不得把 fallback 误报为 Blender 资产已加载。
- 发布验收须核对网络请求状态为 200、页面 `#app[data-art="teahouse"]` 与 `#app[data-pavilion="loaded"]`，并在浏览器检查三个固定机位。
