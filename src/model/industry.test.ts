import { describe, expect, it } from 'vitest'
import { evidenceCases } from './evidence'
import { industryIndexForCase, industryNameForCase, industryNodes } from './industry'

describe('industry nodes', () => {
  it('keeps one industry per case and one case per industry', () => {
    const caseIds = industryNodes.map((node) => node.caseId)
    expect(industryNodes).toHaveLength(evidenceCases.length)
    expect(new Set(caseIds).size).toBe(caseIds.length)
    expect(new Set(industryNodes.map((node) => node.name)).size).toBe(industryNodes.length)
  })

  it('walks the five cases and the five industries in the same order', () => {
    // 折叠图与展开区共用一个选择。两串同序，才是「选第 i 个案例 = 选第 i 个行业」成立的前提；
    // 谁把其中一串重排了，这里会直接红。
    expect(industryNodes.map((node) => node.caseId)).toEqual(evidenceCases.map((item) => item.id))
  })

  it('resolves every case to a name', () => {
    for (const item of evidenceCases) {
      expect(industryNameForCase(item.id)).toBeTruthy()
      expect(industryIndexForCase(item.id)).toBeGreaterThanOrEqual(0)
    }
  })

  it('keeps case names within the four-character gutter of the fold figure', () => {
    // 折叠图左列按四个字宽预留标签沟（viewBox 里 75 往左 44 个单位）。
    // 名字变长会顶出 viewBox 左边界被裁掉，所以这里锁死长度上限。
    for (const node of industryNodes) expect([...node.name]).toHaveLength(4)
  })

  it('returns null and -1 for an unknown case', () => {
    expect(industryNameForCase('not-a-case')).toBeNull()
    expect(industryIndexForCase('not-a-case')).toBe(-1)
  })
})
