# AI生产力引擎实施计划

## 1. 实施目标

依据已批准的设计稿，交付一个可部署到GitHub Pages的单页互动数据叙事网站。第一版优先证明四件事：

1. “一次智能决策如何成为生产力”的主线能够完整讲通；
2. 决策脉冲在不同场景中保持同一视觉身份；
3. 模拟器结果稳定、可解释、可测试；
4. 所有精确数字具有可见的证据等级和来源。

第一版不以完成全部特效为目标。每个阶段必须通过自己的验证门槛后，才进入下一阶段。

## 2. 技术选择

### 2.1 基础技术

- Vite + React + TypeScript；
- Three.js + React Three Fiber + Drei；
- GSAP + ScrollTrigger；
- `d3-force`和`d3-scale`；
- 原生CSS变量与普通CSS文件；
- Vitest用于模拟器和数据校验测试；
- GitHub Actions部署到GitHub Pages。

### 2.2 有意不使用

- 不使用React Router，网站只有一个页面；
- 不使用全局状态库，章节状态使用Context和局部状态；
- 不使用Tailwind或通用组件库，避免为少量定制界面引入第二套设计语言；
- 不使用平滑滚动库；
- 不使用完整D3包，只安装需要的子包；
- 不在性能验证前加入景深、复杂Bloom或大型GLTF模型；
- 不为原型建立独立应用，使用`?proof=pulse`和`?quality=high`查询参数进入同一运行时代码。

## 3. 目录规划

```text
src/
├── app/
│   ├── App.tsx
│   ├── AppShell.tsx
│   └── story-context.tsx
├── components/
│   ├── navigation/
│   ├── sections/
│   ├── simulator/
│   ├── sources/
│   └── industry/
├── scene/
│   ├── PersistentScene.tsx
│   ├── DecisionPulse.tsx
│   ├── PulsePrototype.tsx
│   └── scene-quality.ts
├── data/
│   ├── data-ledger.json
│   ├── ledger-types.ts
│   ├── validate-ledger.ts
│   └── cases.ts
├── model/
│   ├── productivity.ts
│   └── productivity.test.ts
├── story/
│   └── chapters.ts
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── motion.css
├── dev/
│   └── PulseStoryboard.tsx
├── main.tsx
└── vite-env.d.ts
```

只有当单个文件职责明显过多时才继续拆分。

## 4. 分阶段计划

### 阶段0：建立可运行基线

目标：得到一个能构建、测试和部署的空壳，不制作正式场景。

任务：

1. 使用Vite创建React TypeScript项目；
2. 安装Three.js、R3F、Drei、GSAP、D3子包和Vitest；
3. 建立色彩、字体、间距、圆角和层级CSS变量；
4. 建立单页App Shell、固定导航和六个空章节；
5. 配置GitHub Pages基础路径；
6. 增加`npm run test`、`npm run build`和`npm run lint`；
7. 确认开发服务器、生产构建和GitHub Pages资源路径工作正常。

验证：

```powershell
npm run test
npm run lint
npm run build
```

完成条件：页面可滚动经过六个占位章节，构建无错误，控制台无报错。

### 阶段1：先做数据台账

目标：在图表和案例进入页面前，建立可执行的数据门槛。

任务：

1. 定义`LedgerEntry`类型；
2. 创建`data-ledger.json`，录入John Deere、GitHub Copilot、AlphaFold和IEA候选声明；
3. 逐条核验原始文档、年份、范围、单位与来源性质；
4. 添加`verified`、`qualified`、`pending`校验；
5. 当`qualified`缺少独立佐证时，自动生成“有限证据”和“当前仅有单一来源”文案；
6. 构建前运行数据校验，阻止`pending`条目进入正式数据导出；
7. 先确定3个满足准入条件的行业，不为星图预留空节点。

最小测试：

- `pending`条目导致正式校验失败；
- `qualified`且无独立佐证时生成正确警示；
- 缺失单位、年份或来源链接的精确数字校验失败；
- 教学假设可以没有外部数值来源，但必须明确标记为`simulation`。

完成条件：所有准备进入第一版页面的数字均为`verified`或显式受限的`qualified`。

### 阶段2：验证决策脉冲

目标：在制作六幕场景前验证核心视觉身份。

任务：

1. 制作六帧静态故事板，展示脉冲在六幕中的目标形态；
2. 实现共享的`DecisionPulse`组件，固定内核、薄环和拖尾；
3. 使用`?proof=pulse`进入动态测试场景；
4. 动态原型只实现开场判断和流程重构两个极端形态；
5. 两个形态共享相同材质、颜色、缓动和核心几何；
6. 增加减少动效模式，直接切换静态终态；
7. 在确认识别性前不加入Bloom。

完成条件：不依赖文字说明，观察者能够把故事板和两个动态形态识别为同一个对象。

### 阶段3：完成五分钟主叙事骨架

目标：先让故事完整，再增加探索深度。

任务：

1. 建立统一章节配置和滚动进度；
2. 让一个固定Canvas贯穿全页；
3. 实现开场判断、要素汇聚和流程重构；
4. 使用GSAP ScrollTrigger完成章节钉扎与横向流程；
5. 制作节约型、增效型和创造型三个案例的主线摘要；
6. 实现风险章节与替代到增强的最终控制轴；
7. 为每个章节提供减少动效和无WebGL文本版本；
8. 按五分钟时间线进行第一次完整录屏走查。

完成条件：不进入案例抽屉和行业探索层，也能完整讲完因果链。

### 阶段4：实现最小生产力模拟器

目标：交付四参数、单输出、确定性的解释型模型。

任务：

1. 在`productivity.ts`中实现纯函数；
2. 输入为`I`、`D`、`P`、`H`，范围均为0到1；
3. 实现协同基础、有效收益、转型摩擦和有效生产力指数；
4. 实现四种状态分类及边界处理；
5. 状态输出包含瓶颈参数、因果链位置和调整建议；
6. UI只显示一个指数、一段解释和四个滑块；
7. 公式抽屉明确教学权重不是经验估计；
8. 移动端参数在前、结果在后，提供固定“查看结果”按钮。

最小测试：

- 相同输入始终得到相同输出；
- 指数自然落在70-145；
- `I < 0.20`进入“尚未形成规模效应”；
- 人员训练度形成最低瓶颈时进入“自动化陷阱”；
- 数据或流程形成最低瓶颈时进入“技术孤岛”；
- 有效收益大于等于转型摩擦时进入“人机协同”；
- 边界值0、0.20和1均稳定。

完成条件：自动化测试通过，随后5名未参与开发的同学参加盲测，至少4人能在20秒内指出瓶颈并选择正确的优先调整参数。

### 阶段5：增加行业探索层

目标：增加网站丰富度，但不影响视频主线。

任务：

1. 只读取通过台账准入的3-4个行业；
2. 桌面端使用Three.js行业关系网络；
3. 节点大小和连线粗细只在统一可比数据存在时映射数值；
4. 没有统一可比指标时使用等大节点，连线仅表示能力共享；
5. 点击节点显示问题、AI介入位置、流程变化、结果和来源；
6. 手机端使用行业单选列表和能力关系图，不实现拖拽网络；
7. `qualified`数字在面板正文中直接显示证据限制。

完成条件：删除任一不满足准入条件的行业后，布局仍完整，不出现空位或占位节点。

### 阶段6：性能、可访问性与视频模式

目标：让展示效果与实际网站一致，并完成量化验收。

任务：

1. 实现自动质量等级和`?quality=high`录制模式；
2. 高画质模式仍使用同一套组件和数据，只调整粒子数、DPR和后期效果；
3. 低性能模式粒子数不超过3,000并关闭重后期；
4. App Shell显示后5秒Three.js仍未就绪时切换静态关键帧；
5. 完成键盘操作、焦点状态、文本摘要和减少动效路径；
6. 运行Lighthouse并修复性能与可访问性问题；
7. 从网站实际运行录制五分钟视频素材；
8. 验证GitHub Pages线上资源、刷新和移动端布局。

量化门槛：

- Lighthouse移动端Performance不低于70；
- Lighthouse Accessibility不低于90；
- 低性能模式连续30秒中位帧率不低于30fps；
- 键盘可以完成开场判断、流程切换、模拟器调节、风险切换和最终控制轴；
- 生产构建无错误，浏览器控制台无未处理异常。

## 5. 实施顺序与停止条件

严格按以下顺序推进：

```text
可运行基线
    ↓
数据台账
    ↓
脉冲视觉原型
    ↓
五分钟主叙事
    ↓
最小模拟器
    ↓
行业探索层
    ↓
性能、无障碍、部署和录屏
```

任一阶段未达到完成条件时，不通过添加下一阶段功能掩盖问题。

## 6. 提交策略

建议每个阶段至少保留一个可回退提交：

1. `chore: scaffold interactive story app`
2. `data: add verified evidence ledger`
3. `feat: prototype decision pulse identity`
4. `feat: build core productivity narrative`
5. `feat: add explainable productivity simulator`
6. `feat: add evidence-gated industry explorer`
7. `perf: add adaptive quality and accessibility fallbacks`
8. `ci: deploy verified build to github pages`

提交中不混入与当前阶段无关的重构。

## 7. 最终交付检查

```powershell
npm run test
npm run lint
npm run build
```

随后完成：

- 本地桌面视觉检查；
- 768px以下移动端检查；
- 减少动效检查；
- 键盘全流程检查；
- 低性能模式30秒帧率记录；
- Lighthouse移动端报告；
- GitHub Pages线上检查；
- 五分钟主线实际录屏检查。

只有网站、数据台账、自动化测试、部署结果和录屏路径全部一致时，第一版才算完成。
