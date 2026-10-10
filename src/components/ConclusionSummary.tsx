import { ArrowRight } from '@phosphor-icons/react'
import { useCallback, useRef, useState } from 'react'
import { buildShareCardSvg, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from '../model/share-card'
import { closingChoice, closingTakeaways, summaryRows } from '../model/summary'

const SHARE_URL = 'https://boveyh.github.io/AI-New-Productive-Forces/'

/** SVG 字符串 → PNG Blob。全链路无外部资源，画布不会被污染。 */
async function rasterizeShareCard(svg: string): Promise<Blob> {
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('分享卡渲染失败'))
      image.src = blobUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = SHARE_CARD_WIDTH
    canvas.height = SHARE_CARD_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器不支持画布')
    context.drawImage(image, 0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!png) throw new Error('分享卡导出失败')
    return png
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * 结尾总结：一张表 + 三条收束结论。
 *
 * - 表格是**信息载体**：环节、被复制的判断、留下的约束、台账锚点，全部来自已有文案与证据。
 * - 星图只负责收束感，所以这里的高亮是**单向**的：表格行 hover / focus 会让星图对应节点变亮，
 *   但表格不接受来自星图的事件。反过来做，装饰层就会获得操作语义，变成第二个导航。
 * - 行内跳转用真正的 `<a href="#章节">`，所以表格行键盘可达，不需要给任何元素补键盘序号，
 *   全站刻意保留的那一处键盘例外仍然是唯一的一处（验收用 grep 复核）。
 */
export function ConclusionSummary({
  augmentation,
  focusIndex,
  onFocusStage,
}: {
  augmentation: number
  focusIndex: number | null
  onFocusStage: (index: number | null) => void
}) {
  // 分享卡的第三条随 augmentation 变化，和页面上的「选择」保持同一份文案。
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'copied' | 'saved'>('idle')
  const resetTimer = useRef<number | null>(null)

  const exportShareCard = useCallback(async (mode: 'copy' | 'download') => {
    setShareState('busy')
    try {
      const png = await rasterizeShareCard(buildShareCardSvg({
        takeaways: [
          { label: '机制', text: closingTakeaways.mechanism },
          { label: '边界', text: closingTakeaways.boundary },
          { label: '选择', text: closingChoice(augmentation) },
        ],
        url: SHARE_URL,
      }))
      if (mode === 'download') {
        downloadBlob(png, 'AI生产力引擎-结论.png')
        setShareState('saved')
      } else {
        try {
          // 剪贴板在非安全上下文（http）或旧浏览器上不可用，失败了就退回下载。
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
          setShareState('copied')
        } catch {
          downloadBlob(png, 'AI生产力引擎-结论.png')
          setShareState('saved')
        }
      }
    } catch {
      setShareState('idle')
    }
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setShareState('idle'), 2400)
  }, [augmentation])

  return <div className="summary reveal">
    <table className="summary-table">
      <caption>这些行不按章节排列，而是按因果环节：每个环节被复制了什么判断，又留下了什么约束。台账锚点只在该环节确有对应证据时给出，悬停可看证据本身的口径。</caption>
      <thead>
        <tr>
          <th scope="col">环节</th>
          <th scope="col">被复制的判断</th>
          <th scope="col">留下的约束</th>
          <th scope="col">台账锚点</th>
        </tr>
      </thead>
      <tbody>
        {summaryRows.map((row, index) => <tr
          key={row.id}
          className={focusIndex === index ? 'is-focused' : undefined}
          onMouseEnter={() => onFocusStage(index)}
          onMouseLeave={() => onFocusStage(null)}
          onFocus={() => onFocusStage(index)}
          onBlur={() => onFocusStage(null)}
        >
          <th scope="row" data-label="环节">
            <a className="summary-stage" href={`#${row.chapter}`}>{row.stage}<ArrowRight /></a>
          </th>
          <td data-label="被复制的判断">{row.copied}</td>
          <td data-label="留下的约束">{row.constraint}</td>
          <td data-label="台账锚点">
            {row.anchors.length === 0
              ? <span className="summary-anchor-empty" title="这一环节没有直接测量它的证据，所以留空，不拿邻近的数字顶替。">—</span>
              : <span className="summary-anchor">
                {row.anchors.map((anchor) => <a
                  key={anchor.id}
                  href={anchor.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`${anchor.claim}（${anchor.sourceTitle}，${anchor.year} · ${anchor.geography}）`}
                >{anchor.value}{anchor.unit.startsWith('%') ? '%' : ''}</a>)}
              </span>}
          </td>
        </tr>)}
      </tbody>
    </table>

    <div className="summary-takeaways">
      <blockquote><span>机制</span>{closingTakeaways.mechanism}</blockquote>
      <blockquote><span>边界</span>{closingTakeaways.boundary}</blockquote>
      <blockquote className="is-current"><span>选择</span>{closingChoice(augmentation)}</blockquote>
    </div>

    <div className="share-actions" role="group" aria-label="把结论带走">
      <button type="button" onClick={() => exportShareCard('copy')} disabled={shareState === 'busy'}>
        {shareState === 'copied' ? '已复制到剪贴板' : shareState === 'busy' ? '生成中…' : '复制为图片'}
      </button>
      <button type="button" onClick={() => exportShareCard('download')} disabled={shareState === 'busy'}>
        {shareState === 'saved' ? '已保存' : '下载 PNG'}
      </button>
    </div>
  </div>
}
