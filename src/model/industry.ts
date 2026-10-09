export type IndustryOutcome = '成本' | '周期' | '质量' | '任务边界'

export type IndustryNode = {
  id: string
  name: string
  caseId: string
  decision: string
  processNode: string
  outcome: IndustryOutcome
}

export const industryNodes: IndustryNode[] = [
  { id: 'precision-agriculture', name: '精准农业', caseId: 'deere-see-spray-77', decision: '识别单株杂草并判断是否喷洒', processNode: '田间执行', outcome: '成本' },
  { id: 'software', name: '软件研发', caseId: 'github-copilot-55-8', decision: '为指定编码任务生成候选实现', processNode: '编码与验证', outcome: '周期' },
  { id: 'customer-service', name: '客户服务', caseId: 'nber-support-14', decision: '把优秀经验转成实时处理建议', processNode: '一线会话', outcome: '质量' },
  { id: 'tire-manufacturing', name: '轮胎制造', caseId: 'wef-guizhou-tire-68', decision: '把检测与工艺数据变成现场判断', processNode: '检测与工艺反馈', outcome: '质量' },
  { id: 'protein-research', name: '科学研究', caseId: 'alphafold-200m', decision: '预测蛋白质三维结构', processNode: '结构获取', outcome: '任务边界' },
]

export const industryLayers = ['AI在判断什么', '判断嵌入哪个流程节点', '最终改变了什么'] as const

const industryByCase = new Map(industryNodes.map((node) => [node.caseId, node]))

/**
 * 案例 id → 行业名。
 *
 * 折叠图的左列是「五个案例」，但案例在证据模型里只有一长串 id，
 * 没有可以直接画进图里的短名。行业名正好是四个字、五个各不相同，
 * 而且它在下方展开区还会再出现一次 —— 折叠前后用同一套名字，
 * 读者才认得出「折起来的是这五个，展开的还是这五个」。
 */
export function industryNameForCase(caseId: string): string | null {
  return industryByCase.get(caseId)?.name ?? null
}

/** 案例 id → 行业下标。两处选择要保持同步时用；找不到返回 -1。 */
export function industryIndexForCase(caseId: string): number {
  return industryNodes.findIndex((node) => node.caseId === caseId)
}
