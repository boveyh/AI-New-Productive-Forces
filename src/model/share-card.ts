/**
 * 分享卡：把结尾三条收束结论渲染成一张 1200×630 的图片。
 *
 * SVG 在这里拼成字符串（纯函数，可测），栅格化交给浏览器：
 * Blob URL → <img> → canvas → PNG。整条链路没有外部资源，
 * 所以 canvas 不会被污染，toBlob/clipboard 都能用。
 */

export const SHARE_CARD_WIDTH = 1200
export const SHARE_CARD_HEIGHT = 630

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const CLOSING_PUNCTUATION = '，。；：、）」』！？'

/**
 * SVG 的 <text> 不会自动换行，按字数手动断。
 * CJK 一字一格，直接按字符数切；唯一的小讲究是标点不落行首 ——
 * 切点下一个字符是标点时把它一起带上去（避头点）。
 */
export function wrapCjk(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let rest = text
  while (rest.length > maxChars) {
    let cut = maxChars
    if (CLOSING_PUNCTUATION.includes(rest[cut])) cut += 1
    lines.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }
  if (rest) lines.push(rest)
  return lines
}

export type ShareTakeaway = { label: string; text: string }

export function buildShareCardSvg({
  takeaways,
  url,
  title = 'AI生产力引擎 · 结论',
}: {
  takeaways: ShareTakeaway[]
  url: string
  title?: string
}): string {
  const left = 84
  // 40 字/行是拿 26px 字号在 1032px 内容宽里算出来的：CJK 一字 26px，
  // 首条结论恰好 40 字（开头"AI"两个窄字母补回了余量），整句落在一行，
  // 不会在行尾甩出一个"能。"的孤行。三条结论在这档宽度下为 1/2/1 行。
  const maxChars = 40
  const blocks: string[] = []
  let y = 176

  for (const takeaway of takeaways) {
    blocks.push(
      `<rect x="${left}" y="${y - 17}" width="11" height="11" fill="#f26a2e"/>`,
      `<text x="${left + 24}" y="${y - 6}" font-family="Consolas, 'Courier New', monospace" font-size="20" letter-spacing="4" fill="#f26a2e">${escapeXml(takeaway.label)}</text>`,
    )
    for (const line of wrapCjk(takeaway.text, maxChars)) {
      y += 44
      blocks.push(`<text x="${left}" y="${y}" font-size="26" fill="#ecebe4">${escapeXml(line)}</text>`)
    }
    y += 46
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" viewBox="0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}" font-family="'MiSans','HarmonyOS Sans SC','Microsoft YaHei',system-ui,sans-serif">`,
    `<defs><radialGradient id="glow" cx="82%" cy="6%" r="42%"><stop offset="0" stop-color="#f26a2e" stop-opacity=".14"/><stop offset="1" stop-color="#f26a2e" stop-opacity="0"/></radialGradient></defs>`,
    `<rect width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" fill="#080a0c"/>`,
    `<rect width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" fill="url(#glow)"/>`,
    `<rect x="34" y="34" width="${SHARE_CARD_WIDTH - 68}" height="${SHARE_CARD_HEIGHT - 68}" fill="none" stroke="rgba(255,255,255,0.1)"/>`,
    `<text x="${left}" y="102" font-family="Consolas, 'Courier New', monospace" font-size="20" letter-spacing="4" fill="#f26a2e">${escapeXml(title)}</text>`,
    ...blocks,
    `<circle cx="${left + 5}" cy="${SHARE_CARD_HEIGHT - 58}" r="5" fill="#f26a2e"/>`,
    `<text x="${left + 24}" y="${SHARE_CARD_HEIGHT - 52}" font-family="Consolas, 'Courier New', monospace" font-size="18" letter-spacing="1" fill="#6b7378">${escapeXml(url)}</text>`,
    `</svg>`,
  ].join('')
}
