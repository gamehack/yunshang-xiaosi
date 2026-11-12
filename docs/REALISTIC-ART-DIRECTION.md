# 半日闲 M2.2｜苏州园林美术规范

以苏州私家园林的空间组织为依据，营造可从第三人称镜头漫游的自然主义半写实庭院。园林面积与建筑位置沿用 [M2.2 计划](M2-2-REALISTIC-SUZHOU-GARDEN.md) 的分批验证方式。历史背景与园林范围见 [UNESCO 苏州古典园林](https://whc.unesco.org/en/list/813)。

## 空间、光色与材质

- **移步换景。** 茶室以可通行的柱间和檐下阴影框住池面。近景留石岸、浮叶或斜出的竹枝，中景给木柱、坐凳与廊下留出层次，远景由围墙与树冠收束。入口、主路和座椅前保留明确的可行走空间。
- **建筑。** 用人物、座椅和 1 米单位标定尺度。黛瓦表现瓦垄、滴水边和压脊，瓦色在暖灰与青灰间轻微变化。柱础明确承托柱身，檐下以梁枋和阴影显示结构。灰泥墙控制亮度，保留勒脚和格窗层次。
- **地表与植物。** 通行石板有稳定步幅、轻微色差与接缝。岸边石材按疏密组合，太湖石下一轮重点检查瘦、皱、漏、透和侧视轮廓。竹秆、枝叶及地被按层分布，避免同高度排列；镜头附近沿用已有局部渐隐。
- **光与水。** 以自然斜光和偏暖的环境补光为起点，保留灰瓦、木构、石面之间的粗糙度差异。池面用低幅法线和岸边倒影表现深浅，避免强镜面高光。切片先验证低成本法线和静态阴影，池面反射与低画质策略留在 R3 验收。
- **人物与交互。** 使用现有访客作为尺度尺，沿用寻路、镜头、坐下、起身、存档和音景。正式替换资产前，核对可见边界与碰撞、台阶高度、座面和入口锚点。

## 视觉参考

以下为公开图页链接，用于分析空间与构件。图片和纹理未纳入仓库或浏览器包。若后续拟使用原图或衍生素材，逐文件核对作者、许可版本、署名及再分发条件。原创资产记录生成脚本、作者/来源、修改记录和文件体积。规范见 [Blender 资产管线](BLENDER-PIPELINE.md)。

| 图页 | 观察点 |
| --- | --- |
| [拙政园竹丛](https://commons.wikimedia.org/wiki/File:Bamboo_in_Zhuozhengyuan_Garden.JPG) | 竹秆的疏密、地表过渡与远近层次 |
| [拙政园梁枋](https://commons.wikimedia.org/wiki/File:Beams_%286399131967%29.jpg) | 木构尺度、构件层叠和檐下光线 |
| [拙政园廊桥](https://commons.wikimedia.org/wiki/File:Covered_bridge_in_Humble_Administrator%27s_Garden.JPG) | 从室内阴影过渡到开敞水面 |
| [拙政园待霜亭与荷](https://commons.wikimedia.org/wiki/File:Daishuangting_and_Lotus_of_Zhuozhengyuan_Garden.JPG) | 水生植物群落与岸边开口 |
| [拙政园倒影楼](https://commons.wikimedia.org/wiki/File:Daoyinglou_of_Zhuozhengyuan_Garden_2.JPG) | 临水建筑与倒影在构图中的比重 |
| [拙政园建筑细节](https://commons.wikimedia.org/wiki/File:Details_of_architecture_in_Humble_Administrator%27s_Garden.JPG) | 瓦、墙与木构的尺度和色差 |
| [拙政园龙墙](https://commons.wikimedia.org/wiki/File:Dragon_wall_of_humble_administrators_garden.jpg) | 墙顶起伏和借景高度 |
| [拙政园芙蓉榭与荷](https://commons.wikimedia.org/wiki/File:Furongxie_and_lotus_of_Zhuozhengyuan_Garden.JPG) | 水榭、岸石与浮叶之间的疏密 |
| [苏州园林松针与山石](https://commons.wikimedia.org/wiki/File:Gusu_impressions_-_Pine_needles_releasing_a_%27rock_mountains%27.jpg) | 枝叶前景与石峰轮廓重叠 |
| [网师园临水建筑](https://commons.wikimedia.org/wiki/File:Master_of_the_Nets_Garden.jpg) | 小尺度院落中的水面和建筑关系 |
| [网师园殿堂](https://commons.wikimedia.org/wiki/File:Net_garden_hall_of_dewy_grace.jpg) | 柱间开口和室内外明暗过渡 |
| [退思园月亭](https://commons.wikimedia.org/wiki/File:Retreat_garden_moon_pavilion.jpg) | 亭檐与水面留白 |
| [留园八角窗](https://commons.wikimedia.org/wiki/File:Through_the_octagonal_window_%286508372507%29.jpg) | 借窗框住树石，在走动中改变画面 |
| [留园冠云峰](https://commons.wikimedia.org/wiki/File:%E8%8B%8F%E5%B7%9E%E7%95%99%E5%9B%AD%E5%86%A0%E4%BA%91%E5%B3%B02019.jpg) | 瘦高轮廓、孔洞、凸缘和风化纹理 |

## R0 机位与暂定预算

- **主机位。** 从池边看西北侧茶室，人物在池岸步道一侧，机位参数由 `scripts/blender/teahouse-review.mjs` 固定。1366×768 与 1920×1080 均保留同机位前后截图。后续补充檐下看池、茶凳侧视及沿岸转入竹林的移动证据。
- **几何和下载。** 当前切片先控制为 GLB ≤ 2 MiB，主机位 ≤ 180 draw calls、≤ 9 万三角面。预算仅适用于这一机位的开发切片，扩展前须在全园代表机位重测。
- **真实 PC。** 1920×1080、DPR 1、均衡画质下，暂以接近 60 FPS、P95 ≤ 25 ms 为打磨目标。另记录首帧、资产下载体积和显存压力。Windows Chrome SwiftShader 只用于对照和回归，真实硬件预算待验证。

复现、资产登记与结果见 [R0 茶室切片报告](R0-TEAHOUSE-REPORT.md)。
