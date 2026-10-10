import { describe, expect, it } from 'vitest'
import { buildShareCardSvg, wrapCjk } from './share-card'
import { closingChoice, closingTakeaways } from './summary'

describe('wrapCjk', () => {
  it('按字数切行，余数进末行', () => {
    expect(wrapCjk('一二三四五', 2)).toEqual(['一二', '三四', '五'])
  })

  it('整除时不留空行', () => {
    expect(wrapCjk('一二三四', 2)).toEqual(['一二', '三四'])
  })

  it('标点不落行首（避头点）', () => {
    // 「三」后面是句号，切点带上下一个字符，句号不会掉到第二行行首。
    expect(wrapCjk('一二三。四五', 3)).toEqual(['一二三。', '四五'])
  })

  it('空字符串返回空数组', () => {
    expect(wrapCjk('', 10)).toEqual([])
  })
})

describe('buildShareCardSvg', () => {
  const takeaways = [
    { label: '机制', text: closingTakeaways.mechanism },
    { label: '边界', text: closingTakeaways.boundary },
    { label: '选择', text: closingChoice(62) },
  ]

  it('是自包含的 SVG：带命名空间、固定尺寸，且不引用任何外部资源', () => {
    const svg = buildShareCardSvg({ takeaways, url: 'https://example.com/' })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg).toContain('width="1200"')
    expect(svg).toContain('height="630"')
    expect(svg).not.toMatch(/href=/)
    expect(svg).not.toMatch(/url\(http/)
    // 栅格化到 canvas 的前提是没有外部引用，否则画布被污染，toBlob 直接抛异常。
    expect(svg).not.toMatch(/@import|<image|<use/)
  })

  it('三条结论的文字都进了卡片，包括随滑杆变化的第三条', () => {
    const svg = buildShareCardSvg({ takeaways, url: 'https://example.com/' })
    for (const takeaway of takeaways) {
      expect(svg).toContain(takeaway.text.slice(0, 8))
    }
    expect(svg).toContain(closingChoice(62))
  })

  it('对文本做 XML 转义，注入字符不会破坏结构', () => {
    const svg = buildShareCardSvg({
      takeaways: [{ label: 'x', text: 'a<b & "c" \'d\'' }],
      url: 'https://example.com/',
    })
    expect(svg).toContain('a&lt;b &amp; &quot;c&quot; &apos;d&apos;')
  })

  it('URL 原样出现在页脚', () => {
    const svg = buildShareCardSvg({ takeaways, url: 'https://boveyh.github.io/AI-New-Productive-Forces/' })
    expect(svg).toContain('https://boveyh.github.io/AI-New-Productive-Forces/')
  })
})
