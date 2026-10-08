# Vibe知识叙事与数据可视化升级实施计划

## 1. 交付目标

在现有React、Three.js、GSAP单页网站上完成一次定向升级，不重建项目：

1. 增加可核验的AI企业采用率数据章节；
2. 先用纯SVG完成四个稳定场景，再迁入Remotion Composition；
3. 把开场、要素、流程和风险改造成统一的知识动作；
4. 扩充案例、来源和解释文本；
5. 保持GitHub Pages纯前端部署、移动端可用和性能降级。

实施必须遵守已批准设计：滚动与Player手动时间轴不能同时拥有帧控制权，Remotion不负责全站普通交互，浏览器端不渲染MP4。

## 2. 现有基线与改动边界

保留：

- Vite、React、TypeScript和现有单页锚点结构；
- 一个持续存在的Three.js Canvas；
- GSAP ScrollTrigger章节检测；
- 四参数生产力模型和现有测试；
- 数据台账校验和GitHub Pages工作流；
- 工业暗色主题与`#F26A2E`激活色。

本轮不做：

- 路由、后端、数据库或在线MP4渲染；
- 3D齿轮、复杂外部模型或多个同时播放的Remotion Player；
- 不可比较案例的统一排名；
- 无数据依据的地图或行业节点尺寸。

## 3. 目标目录

```text
src/
├── components/
│   ├── adoption/
│   │   ├── AdoptionChapter.tsx
│   │   ├── AdoptionScenes.tsx
│   │   ├── AdoptionPlayer.tsx
│   │   └── chart-geometry.ts
│   ├── opening/OpeningLineStory.tsx
│   ├── factors/FactorMechanism.tsx
│   ├── process/ProcessCircuit.tsx
│   ├── evidence/EvidenceWall.tsx
│   └── risk/GovernanceLimiter.tsx
├── data/
│   ├── adoption-series.json
│   ├── evidence-cases.json
│   └── data-ledger.json
├── remotion/
│   └── AdoptionComposition.tsx
└── model/
    ├── adoption.ts
    └── adoption.test.ts
```

只有职责需要时才拆文件。静态SVG场景与Remotion Composition复用同一几何纯函数，不维护两套坐标算法。

## 4. 阶段任务

### 阶段1：数据台账和纯数据模型

任务：

1. 将Eurostat采用深度、企业规模、技术类型和国家差异写入`adoption-series.json`；
2. 为每组数据增加台账ID、单位、年份、地理范围和统计口径；
3. 扩展台账校验，阻止未知台账ID和`pending`条目进入构建；
4. 实现比例尺度、场景数据选择、同比变化和标签格式纯函数；
5. 增加最小测试。

验证：

- 采用深度值与Eurostat原文一致；
- 2025年企业规模差距由原始值计算，不保存重复常量；
- 缺失来源或未知台账ID时构建失败；
- 不生成2022年或年度之间的伪观测。

### 阶段2：四个静态SVG场景

任务：

1. 实现固定数量视觉单元；
2. 计算采用深度、企业规模、技术类型和国家排名带四组坐标；
3. 为每个场景实现标题、轴、单位、重点标注和来源；
4. 桌面和390px视口检查标签冲突；
5. 增加SVG`title`、`desc`与文本摘要。

完成条件：四个场景无需动画也能独立解释数据，标签不遮挡，移动端不横向溢出。

### 阶段3：React交互与时间轴主权

任务：

1. 将四场景封装为同一`AdoptionScenes`组件；
2. 实现场景切换、系列显示、数据点锁定、键盘年份切换和触摸操作；
3. 建立`scroll`与`manual`两种时间轴模式；
4. 拖动或播放后进入手动模式；
5. “回到主线”或跨章节20%阈值恢复滚动模式；
6. 编写状态转换和帧映射测试。

完成条件：任意时刻只有一个控制源能够写入目标帧。

### 阶段4：引入Remotion包装稳定场景

任务：

1. 安装版本一致的`remotion`与`@remotion/player`；
2. 创建18-22秒、30fps的`AdoptionComposition`；
3. 用`inputProps`传入数据、系列和显示模式；
4. 用`PlayerRef`连接播放、暂停、拖动与`seekTo()`；
5. Player只在章节接近视口时懒加载；
6. 离开视口暂停；
7. 验证Vite生产构建和GitHub Pages基础路径；
8. 添加15fps与静态关键帧降级。

完成条件：Remotion只包装已验证的SVG场景，不复制数据和布局算法。

### 阶段5：统一知识动作

任务：

1. 开场实现一条线的五镜头SVG叙事；
2. 要素章节实现2D齿轮、空转、堆积和错误路由；
3. 流程章节实现双轨电路板、局部旁路和信息闭环；
4. 风险章节实现治理限位环；
5. 全部动作采用2px主线、1px辅助线、3px激活线和`#F26A2E`；
6. 普通出场、重组、故障反馈分别使用已批准缓动；
7. 所有持续动画在减少动效模式下停用。

完成条件：每种动作能在不依赖说明文字时表达其对应知识变化。

### 阶段6：文本、案例与引导

任务：

1. 重写章节钩子、操作提示和操作后结论；
2. 增加工信部、NBER、WEF、IEA、NIST等来源；
3. 增加客服、制造、科研、医疗等案例；
4. 构建证据点图，区分官方、研究与企业披露；
5. 保持“采用率不等于生产率”和“预测不等于事实”的显式限制；
6. 增加主线模式和自由探索模式，不维护两套页面。

### 阶段7：性能、可访问性和部署

任务：

1. 确保同时最多一个Remotion Player和一个Three.js Canvas运行；
2. 在采用率章节降低Three.js粒子负载；
3. 检测30fps模式表现，低于24fps切15fps；
4. 15fps模式低于14fps切静态关键帧；
5. 检查键盘、触摸、减少动效和无WebGL路径；
6. 运行测试、lint和生产构建；
7. 本地检查桌面与390px视口；
8. 推送并验证GitHub Pages。

## 5. 测试清单

```powershell
npm run check:data
npm run test
npm run lint
npm run build
```

自动测试至少覆盖：

- 台账ID引用；
- 场景坐标值处于SVG边界内；
- 规模差距和同比计算；
- 滚动进度到帧数的边界；
- 手动模式进入与退出；
- 30fps、15fps总帧数保持相同时长；
- 生产力模型原有测试不回归。

人工检查至少覆盖：

- 桌面和390px移动端；
- 鼠标、触摸和键盘；
- 普通、低性能和减少动效模式；
- Player播放、拖动、回到主线和跨章节恢复；
- 图表来源、口径和证据等级；
- GitHub Pages首次加载、锚点导航和资源路径。

## 6. 提交策略

建议保留以下可回退提交：

1. `data: add enterprise ai adoption evidence`；
2. `feat: build static adoption story scenes`；
3. `feat: add adoption chart interactions`；
4. `feat: wrap adoption story in remotion player`；
5. `feat: unify knowledge motion language`；
6. `content: deepen productivity evidence narrative`；
7. `perf: add motion quality fallbacks`；
8. `ci: deploy enhanced data story`。

第一阶段先交付数据和静态场景。Remotion只能在静态场景、标签和移动端布局通过验证后加入。
