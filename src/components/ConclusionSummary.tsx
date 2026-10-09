import { ArrowRight } from '@phosphor-icons/react'
import { closingChoice, closingTakeaways, summaryRows } from '../model/summary'

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
  </div>
}
