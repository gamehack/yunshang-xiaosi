# M2.0 RC.1 PC 浏览器报告

2026-11-11，云端 Chromium + SwiftShader 软件渲染。页面真实运行于 Vite/生产预览，使用 Playwright-core 自动操作；不是 mock renderer。

## 测试环境和可复现方法

- Node 22.23.4；Chromium 156.0.8078.79，x86_64 云主机 AMD EPYC 9V74（暴露5个逻辑CPU）；软件GPU，精确指标见附带 `report.json`。
- 交互截图：1280×720、DPR=1、初始画质均衡；三档画质切换单独验证。
- 持续运行：960×600、DPR=1、均衡、20段真实30秒按键，前半向北、后半向南折返。
- `npm run test:browser` / `npm run test:soak`，见 README；CI 保留 `pc-chromium-evidence`。
- 固定视角使用本地存档夹具；不能据这些截图声称已经连续走过全路线。

## 已取得的检查

- 中间RC构建12类检查成功：初始化、主动音频/音量、W移动、刷新续游、拖动旋转、滚轮缩放、点击地面与Esc、回入口、茶室坐起/刷新、湖台坐起/刷新、三档画质、真实WebGL上下文丢失/恢复。
- 最终构建又通过存储拒绝、无WebGL初始化回退与庭院至茶室真实点击到达：共14类交互检查，加1类独立禁用WebGL故障检查；页面异常0、失败请求0。证据见 [report.json](evidence/rc1/report.json) 与 [fallback.json](evidence/rc1/fallback.json)。
- 已取得10张关键视角截图：入口、全景、茶室外部、茶室可进入区域、竹林、桥与池塘、望湖台、行走、两处坐姿。
- 视觉复核已修复茶室屋脊方向、茶凳缺失、坐姿腿穿地、座面高度、面向茶桌/湖面的方向；增加漏窗、阔叶层次与远山。
- 独立review复现望湖台矩形导航走出台面，已增加失败回归后按实际16边形台面内切边界修复；家具站姿碰撞也已加入，坐姿中心存档特殊校验保留。

## 当前限制

- 美术仍是原创程序化低多边形风格：竹叶为9m小批次渐隐，存在局部边缘可见切换；尚非逐叶遮挡。装饰景石没有完整物理碰撞网格。
- 自动截图检查基本穿模和结构，不代替最终审美判断或所有镜头角度遍历。
- 软件GPU的FPS和P95仅用于回归，不能证明60FPS/16.7ms达标。真实PC须记录CPU/GPU/驱动、Chrome版本、分辨率、DPR、画质与各场景10分钟数据。
- Edge未安装，手机Chrome/Safari未连接；P1/P2保留独立验收。
- 音景开关和节点行为自动验证，实际扬声器听感由最终集中体验确认；后台暂停后需要用户再点开启，避免意外发声。

最终命令结果、截图目录、持续运行与CI链接见 EXECUTION-STATUS 和验收矩阵。未合并main，未发布生产。

## 关键视角（最终构建）

| 场景 | 截图 |
|---|---|
| 园门入口 | [入口](evidence/rc1/01-entrance.png) |
| 园林全景 | [全景](evidence/rc1/02-overview.png) |
| 茶室外部 | [外部](evidence/rc1/03-teahouse-exterior.png) |
| 茶室可进入区域 | [内部](evidence/rc1/04-teahouse-interior.png) |
| 竹林步道 | [竹林](evidence/rc1/05-bamboo.png) |
| 木桥与池塘 | [桥水岸](evidence/rc1/06-bridge-pond.png) |
| 望湖台 | [湖台](evidence/rc1/07-lookout.png) |
| 人物行走 | [行走](evidence/rc1/08-walking.png) |
| 茶室坐姿 | [茶座](evidence/rc1/09-seated-tea.png) |
| 湖台坐姿 | [湖座](evidence/rc1/09-seated-lake.png) |
| WebGL错误回退 | [回退](evidence/rc1/10-webgl-unavailable.png) |

图中实时性能读数受云端软件渲染及并行浏览器负载影响，不作为真实PC指标。
