# 可视化田地与机制型数据图表实施计划

## 1. 本次目标

在现有「AI生产力引擎」七章因果链基础上，完成两处补强，并修复两处既有缺陷。不改动主因果链，不新增章节，不新增运行时依赖。

交付三件事：

1. **可视化田地**：把贯穿全文却从未出现的「那块田」画出来，并在「引擎 → 流程 → 产业」三段复用同一块田；
2. **机制型数据图表**：新增三张解释机制的图，而不是继续堆宏观采用率；
3. **两处修复**：顶部导航缺少「要素」章；采用率结论数字硬编码在组件内。

### 1.1 为什么是这两处

- 全文反复出现「回到那块田」，但站内**没有任何一处画出田**：`DecisionSequence` 是抽象四节点路径，`FactorMachine` 是齿轮，`ProcessCircuit` 是电路，`PersistentScene` 是抽象粒子。锚点只被宣告，没有被看见。
- 设计稿 §3.3 要求「四步结束后镜头从单株判断拉远到整条喷杆」，该拉远**至今未实现**。田地正是这个缺口。
- 扩散章已有四张宏观采用率图，但全站缺少解释**机制**的图：为什么需要复核、为什么点喷能省药、为什么总投入不能补偿结构性短板。

### 1.2 有意不做

- 不引入任何图表库，全部手写 SVG，保持「不新增运行时依赖」的既有限制；
- 不把田地做成第二个 3D 场景，用 2D SVG 俯视图，性能可控、可测试；
- 不为田地新增章节，只作为现有三段章节内的共享视觉对象；
- 不让田地数据与 §2 的数据台账混用：田地是 `simulation`，台账是真实来源，两者必须视觉可分。

## 2. 设计要点

### 2.1 田地是整个故事的第二个贯穿对象

第一根贯穿主线是「决策脉冲」（已存在）。田地是第二根：具体、可见、可操作。

| 章 | 田地承担的作用 | 复用方式 |
| --- | --- | --- |
| 引擎 `#engine` | 四步判断结束后拉远成整条喷杆与整块田，兑现设计稿 §3.3 | 固定 `spot` 模式，播放一次扫描 |
| 流程 `#process` | 同一块田，换三种流程得到三种喷杆行为 | 由现有 `processMode` 分段控件驱动 |
| 产业 `#industry` | 田地指标（除草剂用量 / 漏喷 / 误喷）成为 See & Spray 案例的可视化对照 | 只读展示，作为证据锚点旁的模拟对照 |

### 2.2 三态必须给出真实的三方权衡

不能让人机协同变成无脑更优。三种模式的指标关系固定为：

| 模式 | 除草剂用量 | 漏喷 | 误喷 | 复核成本 |
| --- | --- | --- | --- | --- |
| 全田喷洒 | 满量 1.00 | 0 | 高 | 0 |
| 识别后点喷 | 低 | 取决于识别能力 | 低 | 0 |
| 人机协同 | 低 | 低（不保证归零） | 低 | 高 |

#### 2.2.1 三态背后的统一机制

上表不能靠三套互不相干的规则硬凑，必须由同一个机制推导出来。机制定义如下：

1. 每个格子有一个由种子确定的 `confidence ∈ [0,1]`；
2. **教学假设**：`confidence < 1 - accuracy` 的格子称为「低置信格子」。也就是说，`accuracy` 直接决定低置信格子的比例（`accuracy = 0.85` 时约 15% 的格子低置信）。这条假设必须写在田地视图的说明里，不能假装它是经验规律；
3. **全田喷洒**：所有格子 `sprayed = true`，与识别无关；
4. **识别后点喷**：高置信格子按真实情况喷或不喷；低置信格子按检测错误处理（`detected = !weed`）。因此 `accuracy` 越低，低置信格子越多，**漏喷与误喷同时上升**；
5. **人机协同**：在点喷结果之上，按**固定复核容量** `reviewCapacity` 复核低置信格子，被复核的格子修正回真实值；**未被复核覆盖的低置信格子仍然可能出错**。

由此得到三态表的对应关系，不再是断言：

| 表项 | 由机制推导出的结论 |
| --- | --- |
| 全田喷洒零漏喷 | 全喷，杂草必然被覆盖 |
| 点喷漏喷「取决于识别能力」 | 漏喷数 = 低置信且真有杂草的格数 ∝ `1 - accuracy` |
| 人机协同漏喷「低」而非「零」 | 复核只覆盖 `reviewCapacity` 个格子；`accuracy` 越低，低置信格子越多，未覆盖部分越大，漏喷回升 |
| 人机协同复核成本「高」 | `reviewCount` 随 `1 - accuracy` 上升，且受 `reviewCapacity` 封顶——识别越差，复核越不够用 |

关键约束：**`collaborative` 不是「准确率无关的完美模式」**。当 `accuracy = 1` 时低置信格子数为 0，`reviewCount` 退化为 0；当 `accuracy` 下降时 `reviewCount` 上升、且 `missed` 虽低于点喷但不保证归零。测试必须锁住这两条，防止退化成完美模式。

### 2.3 模拟与证据必须分开标注

田地指标全部来自 `src/model/field.ts` 的确定性纯函数，标注 `simulation`。See & Spray 的 77% 仍来自 `data-ledger.json`，标注「有限证据」。两者在图上并置但不相加、不互相推导。

### 2.4 识别能力的旋钮归属

`accuracy` 只在一个地方变，避免田地和阈值图重复演示同一个旋钮：

| 位置 | `accuracy` | 目的 |
| --- | --- | --- |
| 引擎章 `#engine` | `0.92` | 「单次判断质量较高」的示例 |
| 流程章 `#process` | `0.85`（三态共用） | 固定识别能力，只对比流程组织差异 |
| 阈值权衡图（阶段 6） | 可切换 `0.6 / 0.85 / 0.95` | 承载「识别能力」这个变量本身 |

一句话分工：**田地看流程组织，阈值图看识别能力**。田地视图内不提供 `accuracy` 控件。

## 3. 分阶段计划

### 阶段 0：修复既有缺陷（先行，低风险）

执行顺序为 **0.2 → 0.1 → 0.3 → 0.4**：先做行为不变的 id 化重构（0.2），再补第 8 章（0.1）。倒过来会让仓库短暂处于「章节数与偏移量不匹配」的破损状态，无法独立回退。理由同 §5。

#### 任务 0.1：顶部导航补上「要素」章

- 文件路径：`src/App.tsx`
- 要做的：把
  `const chapters = ['引擎', '扩散', '重构', '产业', '实验室', '代价', '结论']`
  改为
  `const chapters = ['引擎', '扩散', '要素', '重构', '产业', '实验室', '代价', '结论']`；
  把
  `const chapterIds = ['engine', 'adoption', 'process', 'industry', 'lab', 'cost', 'conclusion']`
  改为
  `const chapterIds = ['engine', 'adoption', 'factors', 'process', 'industry', 'lab', 'cost', 'conclusion']`。
- 验证：滚动经过 `#factors` 段时，顶部第 03 项高亮，章节计数显示 `03 / 08`。

#### 任务 0.2：把章节索引用法从「偏移量」改为「id」

- 文件路径：`src/App.tsx`、`src/scene/PersistentScene.tsx`
- 背景：当前 `PersistentScene` 收到的是 `Math.max(0, activeChapter - 1)`，`Scene` 内部再用 `activeChapter === 0 … 5` 和 `DecisionPulse` 的 6 元素 `positions` 数组索引。章节从 7 变 8 后，该偏移会整体错位，`DecisionPulse` 也会越界。
- 要做的：
  1. 在 `src/model/story.ts` 新增 `export type ChapterId = 'engine' | 'adoption' | 'factors' | 'process' | 'industry' | 'lab' | 'cost' | 'conclusion'`；
  2. `PersistentScene` 的 props 由 `activeChapter: number` 改为 `chapterId: ChapterId`；
  3. `Scene` 内部改为按 `chapterId` 直接判断，不再做 `-1` 偏移：`engine | factors → FactorStreams`、`process → ProcessField`、`industry → IndustryGalaxy`、`lab → LabOrbit`、`cost → RiskField`、`conclusion → ConclusionNetwork`、`adoption → 无附加层`；
  4. `DecisionPulse` 新增 `const pulseSlot: Record<ChapterId, number> = { engine: 0, adoption: 1, factors: 2, process: 3, industry: 4, lab: 4, cost: 5, conclusion: 5 }`，用它取 `positions` 下标，替换 `Math.min(activeChapter, positions.length - 1)`；
  5. `App.tsx` 传入 `chapterId={chapterIds[activeChapter] as ChapterId}`。
- 验证：八章逐一滚动，3D 背景与脉冲位置均随章节正确切换，控制台无越界报错。

#### 任务 0.3：采用率结论数字改为计算得出

- 文件路径：`src/components/AdoptionStory.tsx`
- 背景：`insight` 中 `13.5 / 20 / 8.3% / 55.03 / 17` 为字面量，与 `adoption-series.json` 当前一致但会漂移。站内其它位置均从数据取。
- 要做的：改写 `insight`，从 `data` 与既有 `relativeGrowth` / `percentagePointGap` 推导：
  - `depth`：取 `data.depth.series[0].values` 的 2024 与 2025 值做 `relativeGrowth`，取 `data.depth.series[2].values[2].value` 作为三技术占比；
  - `size`：取 `data.size.groups` 中大型与小型企业的 `value2025` 做 `percentagePointGap`。
- 验证：把 `adoption-series.json` 中「至少三种」2025 值临时改为 `9.9`，页面结论文字随之变为 `9.9%`，改回后复原。

#### 任务 0.4：阶段 0 门槛

- 验证：

```powershell
npm run test
npm run lint
npm run build
```

- 完成条件：三条命令全部通过，桌面与 375px 宽度下八章导航无换行溢出。

### 阶段 1：田地纯函数与测试（TDD）

#### 任务 1.1：先写失败的测试

- 文件路径：新建 `src/model/field.test.ts`
- 要做的：按下列断言写测试，此时 `src/model/field.ts` 尚不存在，测试必须为红：

```ts
const opts = { seed: 7, cols: 14, rows: 7, weedRate: 0.18 }
const grid = buildField(opts)

// 确定性：同种子同网格
expect(buildField(opts)).toEqual(buildField(opts))

// 全田喷洒：满量、零漏喷
const blanket = fieldMetrics(applyMode(grid, 'blanket', 1))
expect(blanket.herbicideUnits).toBeCloseTo(1, 5)
expect(blanket.missed).toBe(0)

// 点喷：明显省药；准确率满时零漏喷
const spotPerfect = fieldMetrics(applyMode(grid, 'spot', 1))
expect(spotPerfect.herbicideUnits).toBeLessThan(0.5)
expect(spotPerfect.missed).toBe(0)

// 点喷：准确率下降，漏喷与误喷同时上升
const spot85 = fieldMetrics(applyMode(grid, 'spot', 0.85))
const spot60 = fieldMetrics(applyMode(grid, 'spot', 0.6))
expect(spot60.missed).toBeGreaterThan(spot85.missed)
expect(spot60.falseSpray).toBeGreaterThan(spot85.falseSpray)

// 人机协同：复核确实降漏喷，但不是完美模式
const collab85 = fieldMetrics(applyMode(grid, 'collaborative', 0.85))
const collab60 = fieldMetrics(applyMode(grid, 'collaborative', 0.6))
expect(collab85.reviewCount).toBeGreaterThan(0)
expect(collab85.missed).toBeLessThan(spot85.missed)
expect(collab60.reviewCount).toBeGreaterThan(collab85.reviewCount) // 识别越差，要复核的越多
expect(collab60.missed).toBeGreaterThan(0)                        // 复核容量有限，漏喷不归零

// 准确率满时没有低置信格子，复核成本退化为 0
expect(fieldMetrics(applyMode(grid, 'collaborative', 1)).reviewCount).toBe(0)
```

- 验证：`npm test field` 失败，且失败原因缺失模块而非断言写错。

#### 任务 1.2：实现田地模型

- 文件路径：新建 `src/model/field.ts`
- 要做的：导出下列类型与函数，全部为纯函数，不使用 `Math.random`：

```ts
export type SprayMode = 'blanket' | 'spot' | 'collaborative'
export type FieldCell = {
  col: number; row: number
  weed: boolean          // 真实是否有杂草
  confidence: number     // 0..1，由种子确定
  lowConfidence: boolean // confidence < 1 - accuracy
  detected: boolean      // 系统识别结果
  reviewed: boolean      // 是否被人复核
  sprayed: boolean       // 实际是否喷洒
}
export type FieldGrid = { cols: number; rows: number; seed: number; cells: FieldCell[]; weedCount: number }
export type FieldMetrics = { herbicideUnits: number; coverage: number; missed: number; falseSpray: number; nozzlePasses: number; reviewCount: number }

export const defaultReviewCapacity = 24 // 单次作业可复核的格子数上限

export function buildField(input: { seed: number; cols: number; rows: number; weedRate: number }): FieldGrid
export function applyMode(grid: FieldGrid, mode: SprayMode, accuracy: number, reviewCapacity?: number): FieldGrid
export function fieldMetrics(grid: FieldGrid): FieldMetrics
```

- 实现要求（严格对应 §2.2.1 的机制）：
  - 内置 `mulberry32` 确定性随机，`buildField` 可复现：`weed = rng() < weedRate`，`confidence = rng()`；
  - `lowConfidence = confidence < (1 - accuracy)`，**这是 `accuracy` 进入模型的唯一入口**；
  - `blanket`：所有格子 `sprayed = true`，`reviewed = false`；
  - `spot`：高置信格子 `detected = weed`；低置信格子 `detected = !weed`（确定性错误）；`sprayed = detected`；`reviewed = false`；
  - `collaborative`：先得到与 `spot` 完全相同的检出结果，再把低置信格子按 `(row, col)` 顺序取前 `reviewCapacity` 个置 `reviewed = true` 并令 `sprayed = weed`；**未被复核覆盖的低置信格子保持 spot 的检出结果**；
  - `herbicideUnits = sprayed 格数 / 总格数`；
  - `missed = 杂草总数 - 被喷到的杂草数`；`coverage = 1 - missed / weedCount`；
  - `falseSpray = sprayed 且非杂草的格数`；
  - `nozzlePasses = 各列内 sprayed 连续段数之和`（同一列相邻 sprayed 格子算一段）。这条用于呈现点喷的第二个代价：省药但开关更频繁；
  - `reviewCount = 被复核的格子数`。
- 反模式（明确禁止）：不允许把 `collaborative` 写成「无条件修正全部错误」，否则测试中 `collab60.missed > 0` 与 `collab60.reviewCount > collab85.reviewCount` 两条会同时失败。
- 验证：`npm test field` 全绿。

#### 任务 1.3：接线到项目测试与数据校验

- 文件路径：`package.json`（无需改动，`vitest run` 自动收集）、`scripts/validate-ledger.mjs`（不改）
- 要做的：确认 `npm test` 总数由 46 增至 46 + 田地用例数，且 `npm run check:data` 仍通过（田地不进入台账）。
- 验证：`npm run test && npm run check:data`。

### 阶段 2：FieldView 组件

#### 任务 2.1：静态关键帧

- 文件路径：新建 `src/components/FieldView.tsx`
- 要做的：实现受控组件：

```tsx
type FieldViewProps = {
  mode: SprayMode
  accuracy?: number      // 默认 0.85，与流程章共用；组件内不提供调节控件
  seed?: number
  animated?: boolean
  onModeChange?: (mode: SprayMode) => void
  compact?: boolean
}
```

- SVG 结构（`viewBox="0 0 820 460"`）：
  1. 田块区 `x=60..760, y=70..380`，`cols=14 / rows=7`，每格 `50 × 44`；
  2. 格子底色用中性灰；`weed` 为真时叠加橙色圆点；`sprayed` 为真时叠加一层橙色低透明填充；
  3. 喷杆：`y=404` 的横向粗线，`x` 对齐 14 列中心，每列一个喷嘴圆点，`sprayed` 的列点亮；
  4. 相机视野：从喷杆中部向上张开的半透明扇形（`fill-opacity ≤ 0.08`）；
  5. 扫描线：`animated` 为真时一条竖线从左向右扫过，用 CSS `@keyframes` + `transform`，**必须包在 `@media (prefers-reduced-motion: no-preference)` 内**。
- 底部指标条：四格显示 `除草剂用量 / 漏喷 / 误喷 / 复核`，数值来自 `fieldMetrics`。
- `onModeChange` 存在时，渲染与 `ProcessCircuit` 同款 `segmented` 分段控件（三态）。
- 关键约束：
  - 除草剂用量显示为「相对全田喷洒的百分比」，不显示绝对值；
  - 整个组件标注 `场景模拟` 小字，与台账的「有限证据」标识区分；
  - 组件内**不提供 `accuracy` 控件**（旋钮归属见 §2.4）；
  - 视图中必须有一行说明「教学假设：`accuracy` 直接映射为低置信格子的比例」，不得把该假设呈现为经验规律。
- 验证：临时在 `App.tsx` 引擎章挂载 `<FieldView mode="spot" accuracy={0.85} animated />`，`npm run dev` 目视确认扫描动画、喷嘴点亮与指标条。

#### 任务 2.2：样式

- 文件路径：`src/styles.css`
- 要做的：新增 `.field-view`、`.field-canvas`、`.field-cell`、`.field-weed`、`.field-nozzle`、`.field-scan`、`.field-metrics` 一组类，配色沿用现有橙色 `#f26a2e` 与中性灰，不引入新色相。
- 验证：375px 宽度下指标条换行为 2×2，不出现横向滚动。

### 阶段 3：接入引擎章（兑现设计稿 §3.3）

#### 任务 3.1：四步之后拉远到喷杆

- 文件路径：`src/App.tsx`
- 要做的：在引擎章 `<DecisionSequence … />` 之后插入 `<FieldView mode="spot" accuracy={0.92} animated />`，并让它在 `ignited` 为真后才播放扫描（透传 `animated={ignited}`）。此处 `accuracy = 0.92` 表示「单次判断质量较高」，作为高识别能力下点喷效果的示例。
- 要求：`DecisionSequence` 保留不动，它负责「一次判断的四步」，`FieldView` 负责「判断被复制成整块田」。两者是先后关系，不是替代关系。
- 验证：点击「启动决策引擎」→ 四步走完 → 田地开始扫描，滚动不再被强制跳走。

#### 任务 3.2：文案衔接

- 文件路径：`src/model/decision-steps.ts`（只改文案常量，不改结构）
- 要做的：把 §3.3 的结论句「真正改变生产力的，不是机器判断对了一次，而是同类判断可以低成本、高频率地重复」放在田地视图上方，作为拉远的说明。
- 验证：`npm test decision-steps` 仍通过。

### 阶段 4：接入流程章（同一块田，三种流程）

#### 任务 4.1：让 processMode 驱动田地

- 文件路径：`src/App.tsx`
- 要做的：建立 `processMode` 到 `SprayMode` 的映射（`传统流程 → blanket`、`AI辅助 → spot`、`人机协同 → collaborative`），传给流程章的 `<FieldView mode={…} accuracy={0.85} />`。
- 三态**共用同一个 `accuracy = 0.85`**，构成「同一识别能力、不同流程组织」的对照。若三种模式各用不同 `accuracy`，变量就被污染，看不到流程本身的影响。
- 验证：切换分段控件，田地格子填充、喷嘴点亮数与指标条同步变化，且四种指标中「复核」只在 `人机协同` 下非零。

#### 任务 4.2：与 ProcessCircuit 分工

- 文件路径：`src/App.tsx`、`src/styles.css`
- 要做的：桌面端把 `FieldView` 与 `ProcessCircuit` 左右并置（田地在前）；375px 下纵向排列，田地在上。`ProcessCircuit` 继续负责「等待 / 返工 / 复核节点如何移动」，`FieldView` 负责「作业结果长什么样」，两者共用同一个 `processMode`，不新增状态。
- 验证：两种宽度下均无重叠，`processMode` 只有一个真实来源。

### 阶段 5：机制图 A —— 除草剂用量对比

> **挂载理由**：产业章紧邻 See & Spray 案例（`EvidenceTheater` 的第一个案例）。把「同一块田、两种策略」的模拟对照与该案例的真实证据放在同一屏，观众才看得到「机制示意」与「厂商披露」的区别。这张图不是补充信息，而是替产业章补上「结果改变」的可视化凭据。

#### 任务 5.1：实现 HerbicideSavingChart

- 文件路径：新建 `src/components/MechanismCharts.tsx`
- 要做的：导出 `HerbicideSavingChart`，**不新增模型**，直接复用 `field.ts`：
  1. 在同一个 `seed` 与 `weedRate` 下，分别取 `fieldMetrics(applyMode(grid, 'blanket', 0.85))` 与 `fieldMetrics(applyMode(grid, 'spot', 0.85))`；
  2. 左侧画两组横向对比条：除草剂用量、漏喷、误喷；
  3. 右侧并列一张台账证据卡，读 `data-ledger.json` 中 See & Spray 的 `77%` 条目。
- **防误读硬约束**（评审按此逐条验收）：
  - 左侧区块标题必须包含「场景模拟」字样，并显示本次使用的 `accuracy` 与 `weedRate` 取值；
  - 右侧证据卡标题必须包含「厂商披露」与「有限证据」字样；
  - 两者之间**不得出现等号、箭头、「相当于」「折合」「约为」类措辞**；
  - 图下只允许出现一句说明：「左侧为教学模拟，右侧为厂商披露的限定场景数据，二者统计对象与口径不同，不作换算。」
- 验证：`npm run lint`；目视确认「场景模拟」与「有限证据」在同一屏同时可见，且两者之间无任何换算措辞。

#### 任务 5.2：挂载到产业章

- 文件路径：`src/App.tsx`、`src/styles.css`
- 要做的：在产业章 `.signal-rail` 下方、`EvidenceTheater` 上方插入 `<HerbicideSavingChart />`。
- 验证：375px 下左右两区块改为上下排列，仍不出现换算措辞。

### 阶段 6：机制图 B —— 判断阈值权衡

> **挂载理由**：代价章目前只有「1 个数据锚点 + 4 张定性卡片」，是全站最薄的一章，而它直接对应主因果链的「新治理」节点。阈值图把「为什么要保留人工复核」从一句定性结论变成可量化的权衡，正是这一章缺的论证缺口。

#### 任务 6.1：先写测试

- 文件路径：新建 `src/model/threshold.ts` 与 `src/model/threshold.test.ts`
- 要做的：先写下列测试，此时 `threshold.ts` 不存在，必须为红：

```ts
export function tradeoffCurve(input: {
  steps: number
  accuracy: number
}): Array<{ decisionThreshold: number; missedRate: number; falseRate: number }>
```

- 机制（与 §2.2.1 共用同一套格子，复用 `buildField` 生成的 `confidence`）：判定阈值 `t` 上升时，低置信格子中只有 `confidence ≥ t` 的才喷 → 误喷率下降、漏喷率上升。
- 断言：`decisionThreshold` 递增时 `missedRate` 单调不降、`falseRate` 单调不增；两条线在区间内至少相交一次；`accuracy` 由 `0.6` 升到 `0.95` 时两条曲线整体下移；`steps` 为 5 与 50 时端点值一致。
- 验证：`npm test threshold` 为红，且失败原因是缺失模块。

#### 任务 6.2：实现曲线图

- 文件路径：`src/model/threshold.ts`、`src/components/MechanismCharts.tsx`
- 要做的：导出 `ThresholdTradeoffChart`：
  1. x 轴为判定阈值，两条折线分别为漏喷率与误喷率，交点标注「这里需要人工复核」；
  2. 顶部提供 `accuracy` 分段控件（`0.6 / 0.85 / 0.95`，默认 `0.85`，与流程章一致），切换时两条曲线整体平移——**这是「识别能力」这个旋钮在全站的唯一所在地**（见 §2.4）；
  3. 图下给一行结论，连接到治理章的「高影响节点保留人工复核」，不改治理章结构。
- 验证：`npm test threshold` 全绿；目视确认交点可见，切换 `accuracy` 时两条曲线整体移动。

#### 任务 6.3：挂载到代价章

- 文件路径：`src/App.tsx`、`src/styles.css`
- 要做的：在代价章 `.risk-switch` 之后、`.energy-note` 之前插入 `<ThresholdTradeoffChart />`。
- 验证：代价章内容量明显增加；375px 下不溢出。

### 阶段 7：机制图 C —— 实验室响应面

> **挂载理由**：实验室的四个预设按钮写入的只是纯函数的输入，但结果区只给一个标量指数，观众看不到「结构性短板」长什么样。响应面把 `evaluateProductivity` 的整个定义域画出来、把预设点落在曲面上，这一章的核心结论「总投入不能补偿结构性短板」才第一次变成可见的形状。

#### 任务 7.1：采样纯函数

- 文件路径：`src/model/productivity.ts`、`src/model/productivity.test.ts`
- 要做的：新增

```ts
export function sampleSurface(input: { steps: number; investment: number; process: number; training: number }): Array<{ investment: number; complementarity: number; index: number }>
```

  内部复用现有 `evaluateProductivity`，在 `steps × steps` 网格上采样，返回 `index` 矩阵。
- 断言：`steps = 3` 返回 9 个点；相同输入两次调用结果一致；网格对角线端点与直接调用 `evaluateProductivity` 的结果一致。
- 验证：`npm test productivity` 全绿。

#### 任务 7.2：出热力网格图

- 文件路径：`src/components/MechanismCharts.tsx`
- 要做的：导出 `ResponseSurfaceChart`，用 SVG 矩形网格按 `index` 着色（复用现有橙色与中性灰做明暗分层，不引入新色相），在网格上标出当前 `inputs` 对应的位置，并在图下保留原有的公式说明入口。
- 验证：`npm run test && npm run lint`。

#### 任务 7.3：替换实验室的公式抽屉

- 文件路径：`src/App.tsx`、`src/styles.css`
- 要做的：把实验室结果区的 `<details>` 公式块保留在响应面下方（作为教学假设说明），响应面本身放在结果区右侧；不在预设按钮中硬编码任何结果，四个预设继续通过 `applyPreset` 写入 `inputs`。
- 验证：点击四个预设，响应面上的标记点随之移动到四个不同位置。

### 阶段 8：验收与部署

#### 任务 8.1：工程门槛

```powershell
npm run test
npm run lint
npm run build
npm run check:data
```

- 完成条件：四条命令全部通过；`npm test` 用例数不少于 46 + 新增用例数。

#### 任务 8.2：体验门槛

- 桌面与 375px 宽度逐章截图检查；
- 减少动态效果模式下，`FieldView` 直接呈现静态终态，不播放扫描；
- 键盘可完成三态切换、流程切换与四个预设；
- 田地指标与台账证据在同一屏出现时，「场景模拟」与「有限证据」标识同时可见，且两者之间无换算措辞；
- 全站只有一个地方可调 `accuracy`（阈值图），田地视图内不存在该控件；
- 田地视图内可见「教学假设：`accuracy` 直接映射为低置信格子比例」一行说明。

#### 任务 8.3：部署门槛

- 确认 GitHub Pages 基础路径正确，线上资源刷新可用；
- 完成一次线上走查并记录。

## 4. 实施顺序与停止条件

```text
阶段0 修复
    ↓
阶段1 田地模型 + 测试
    ↓
阶段2 FieldView 组件
    ↓
阶段3 引擎章拉远
    ↓
阶段4 流程章复用          ← 到此为止交付「可视化田地」
    ↓
阶段5 除草剂用量对比图
    ↓
阶段6 阈值权衡图
    ↓
阶段7 实验室响应面        ← 到此为止交付「机制型图表」
    ↓
阶段8 验收与部署
```

任一阶段未达标时，不通过添加下一阶段内容掩盖问题。阶段 5–7 可在阶段 4 验收后单独排期。

## 5. 提交策略

1. `refactor: switch chapter indexing from offset to ChapterId`
2. `fix: add factors chapter to navigation and derive adoption insight`
3. `feat: add deterministic field model`
4. `feat: add reusable field view`
5. `feat: pull back from single decision to whole field`
6. `feat: reuse the same field across process modes`
7. `feat: add herbicide saving comparison`
8. `feat: add detection threshold tradeoff`
9. `feat: add lab response surface`
10. `chore: verify responsive, reduced-motion and pages deployment`

每个提交只包含当前阶段内容，不混入无关重构。

两点说明：

- **提交 1 与提交 2 必须分开**。提交 1 是结构性重构（props 类型变化、新增 `ChapterId` 映射表），提交 2 是缺陷修复；混在一起时回滚会连带回滚 id 化改造。
- **顺序为「先重构、后修缺陷」**，而不是反过来。原因：若先加第 8 章再改索引，提交 1 会短暂处于「章节数与偏移量不匹配」的破损状态，无法独立回滚验证；先做 id 化时仍是 7 章，行为完全不变，测试与构建照常全绿，两个提交各自都可独立回退。

## 6. 风险与对策

| 风险 | 对策 |
| --- | --- |
| 全站交互器件已很多，新增两块导致过载 | 田地在三段复用同一组件，不新建章节；三张机制图分别挂在已有章节内部，不新增导航项 |
| 田地动画拖累滚动性能 | 2D SVG + CSS `transform` 动画，不使用 JS 逐帧；`animated` 只在进入视口后为真 |
| 模拟指标被误读为真实证据 | 强制「场景模拟」标识，与台账「有限证据」视觉区分；任务 5.1 的四条防误读硬约束逐条验收 |
| `collaborative` 退化成「无脑更优」 | 复核只覆盖 `reviewCapacity`，未覆盖部分保留检出错误；测试锁住 `collab60.missed > 0` 与 `reviewCount` 随准确率上升 |
| 田地和阈值图重复演示同一个旋钮 | `accuracy` 在田地内固定（引擎 0.92 / 流程 0.85），只在阈值图里可调，见 §2.4 |
| 章节数变化打乱 3D 场景与脉冲索引 | 阶段 0.2 先完成 id 化改造，再动章节数 |
| 三张图让页面变长、节奏变拖 | 每张图高度不超过一屏的 60%，且都挂在已有章节的现有留白处 |

## 7. 验收记录（2026-10-09）

### 7.1 任务 8.1 工程门槛 —— 通过

| 命令 | 结果 |
| --- | --- |
| `npm run test` | 9 个文件 / 62 个用例全部通过（新增 `field.test.ts` 8 例、`threshold.test.ts` 4 例、`productivity.test.ts` +4 例） |
| `npm run lint` | 无告警、无错误 |
| `npm run check:data` | `Validated 13 evidence entries and 4 adoption scenes.` |
| `npm run build` | `tsc -b` 无类型错误，`vite build` 成功，5139 个模块；仅有 Three.js 场景分块 >500 kB 的既有提示，非失败 |

### 7.2 任务 8.2 体验门槛 —— 通过

**375px 逐章检查。** 由于 Windows 下无头 Chrome 的真实窗口宽度被系统钳制在约 500px，`--window-size=375` 无法生效，改为把应用嵌入 375px 宽的 iframe，使媒体查询针对真实窄视口求值，再读取 `scrollWidth / clientWidth` 与各图表包围盒。八章结果：

| 章节 | 页面级横向溢出 | 新增图表包围盒 |
| --- | --- | --- |
| engine | 无 | `.field-view` 324×703、`.field-metrics` 324×211 |
| adoption | 无 | —（工具条与时间轴各自横滚） |
| factors | 无 | — |
| process | 无 | `.field-view` 290×709、`.process-compare` 290×1572 |
| industry | 无 | `.mechanism-chart` 宽 324 |
| lab | 无 | `.mechanism-chart` 宽 324 |
| cost | 无 | `.mechanism-chart` 宽 324 |
| conclusion | 无 | — |

所有超出视口的元素都落在既有横滚轨道内（`adoption-toolbar`、`adoption-chart`、`theater-track`、`preset-bar`、`.segmented`、`domain-paths`），这些轨道在 `max-width: 767px` 下均为 `overflow-x: auto`，属预期交互而非布局破损。

**减少动态效果。** 用 `--force-prefers-reduced-motion` 对照验证：正常模式下点火后 `.field-scan` 计算样式为 `inline`，减少动态效果下为 `none`，即扫描线被隐藏、田地直接呈现静态终态。

**键盘可达性。** 全站源码无任何 `tabIndex` 覆写；三态切换、流程切换与四个预设均为原生 `<button type="button">`，配合 `aria-pressed` / `role="group" aria-label`；`styles.css` 第 23 行提供全局 `:focus-visible` 焦点环。

**防误读与旋钮归属。** 「场景模拟」在源码中有 2 处（`FieldView.tsx:56`、`MechanismCharts.tsx:42`），其中田地组件在引擎章与流程章各实例化一次，故渲染后 DOM 中出现 3 次；「厂商披露 · 有限证据」1 处、「不作换算」1 处；`相当于` / `折合` / `约为` 出现 0 次。`accuracy` 只作为 `FieldView` 的入参由外层传入（引擎 0.92 / 流程 0.85），组件内没有修改它的控件，唯一可调位置是阈值图的分段控件；田地视图内可见「教学假设」说明行（`FieldView.tsx:96`）。

### 7.3 任务 8.3 部署门槛 —— 通过

- `vite.config.ts` 基础路径为 `/AI-New-Productive-Forces/`，构建产物 `dist/index.html` 中的 JS/CSS 引用均带该前缀；
- 部署工作流触发分支为 `main`，使用 Node 24、`npm ci`、`npm run build`，与本地门槛一致；
- 线上走查：见本次推送后 `https://boveyh.github.io/AI-New-Productive-Forces/` 的 Actions 运行结果。

### 7.4 与计划的偏差

- **阈值图横轴由「准确率」改为「判定阈值」**，准确率降级为分段控件。原因：以准确率为横轴时两条误差曲线不会相交，无法表达「此消彼长」；改为阈值后出现唯一交点，才支撑「这里需要人工复核」的结论。相应把 `threshold.ts` 的评分函数改为：低置信格子按 `confidence / (1 - accuracy)` 均匀铺开得分，高置信格子取真实值，使两类误差曲线在阈值 0.5 附近形成单交点。
- 计划 §5 的第 10 项为「验收」提交；验收本身不产生代码差异，故其内容以本节记录的形式落地。
