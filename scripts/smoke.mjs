// 布局冒烟：用 Chrome DevTools 协议在真实视口下跑几何断言。
//
// 为什么不是 Playwright：本机与 CI 都没有这个依赖，仓库也不允许联网装包。
// Node 22 自带全局 WebSocket，CDP 本身是一组 JSON-RPC，够用且零依赖。
//
// 为什么是几何断言而不是截图比对：本文件诞生于三个真实回归 ——
//   (1) 开场田地的模式按钮没接线，整块控件根本没渲染；
//   (2) 结尾星图被遮罩吃掉，节点在但看不见；
//   (3) 折叠图在宽屏空掉三分之二的右栏。
// 三个都不是 model 层单测能拦的，也都不是"某个像素变了"，而是可断言的几何/样式事实。
// 每条断言后面都写了它当初能拦住哪一个。
//
// 用法：npm run smoke            （自动起预览、跑全部宽度、退出码即结论）
//       npm run smoke -- --keep  （失败时留下截图目录，供人眼复核）

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { preview } from 'vite'

const KEEP = process.argv.includes('--keep')
const PORT = Number(process.env.SMOKE_PORT ?? 5273)
const BASE = '/AI-New-Productive-Forces/'

// 1051 是折叠图的分栏断点，两侧都必须测到；其余是常见设备与临界宽度。
// `--widths=1440,900` 可在开发时只跑几档，省掉十几秒的整页重载。
const WIDTHS = (process.argv.find((arg) => arg.startsWith('--widths='))?.slice(9) ?? '')
  .split(',').map(Number).filter(Boolean)
const TARGETS = WIDTHS.length ? WIDTHS : [1680, 1440, 1280, 1200, 1150, 1051, 1050, 1024, 990, 900, 768, 600, 414, 375]
const FOLD_BREAKPOINT = 1051
const VIEWPORT_HEIGHT = 900

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((path) => existsSync(path))
if (!CHROME) throw new Error('找不到 Chrome/Edge，可用 CHROME_PATH 指定')

/** 极简 CDP 客户端：一条 WebSocket 多路复用，按 id 配对，按 sessionId 区分目标。 */
function connect(url) {
  return new Promise((ready, fail) => {
    const socket = new WebSocket(url)
    const pending = new Map()
    let nextId = 0
    socket.addEventListener('open', () => ready(api))
    socket.addEventListener('error', () => fail(new Error(`无法连接 ${url}`)))
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      const waiter = pending.get(message.id)
      if (!waiter) return
      pending.delete(message.id)
      if (message.error) waiter.reject(new Error(message.error.message))
      else waiter.resolve(message.result)
    })
    const api = {
      send(method, params = {}, sessionId) {
        const id = ++nextId
        return new Promise((resolveCall, rejectCall) => {
          pending.set(id, { resolve: resolveCall, reject: rejectCall })
          socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
        })
      },
      close: () => socket.close(),
    }
  })
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/** 轮询直到页面里的表达式为真，或超时。懒加载的 3D 分块只能这样等。 */
async function waitFor(cdp, session, expression, timeout = 20000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const { result } = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, session)
    if (result.value) return true
    await sleep(120)
  }
  return false
}

async function evaluate(cdp, session, expression) {
  const { result, exceptionDetails } = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    session,
  )
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? '页面内求值异常')
  return result.value
}

/**
 * 把 computed style 里的 `linear-gradient(90deg, rgba(...) 0%, ...)` 解析成
 * 「给定横向比例处的合成不透明度」。CSS 渐变是渲染阶段的事，DOM 查不到结果，
 * 只能自己按色标算 —— 但这正是当初星图消失的那一条链路。
 */
function overlayAlphaAt(cssGradient, fraction) {
  const stops = [...cssGradient.matchAll(/rgba?\(([^)]+)\)\s*([\d.]+)%/g)].map((match) => {
    const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    return { at: Number(match[2]) / 100, alpha: parts.length > 3 ? parts[3] : 1 }
  })
  if (stops.length < 2) return 1
  const sorted = stops.sort((a, b) => a.at - b.at)
  if (fraction <= sorted[0].at) return sorted[0].alpha
  if (fraction >= sorted.at(-1).at) return sorted.at(-1).alpha
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const [left, right] = [sorted[index], sorted[index + 1]]
    if (fraction >= left.at && fraction <= right.at) {
      const ratio = (fraction - left.at) / (right.at - left.at || 1)
      return left.alpha + (right.alpha - left.alpha) * ratio
    }
  }
  return 1
}

/** 在页面里求值的探针。返回一个普通的可断言对象，断言逻辑留在 Node 侧。 */
const HELPERS = `
  const rect = (selector) => {
    const element = document.querySelector(selector)
    if (!element) return null
    const box = element.getBoundingClientRect()
    return { top: box.top, left: box.left, width: box.width, height: box.height }
  }
`

// 首屏与结尾必须分开量：滚到结论章之后，#engine 里的元素早就跑到视口上方很远处，
// 再读它的 rect.top 只会得到一个巨大的负数。
const HERO_PROBE = `(() => {${HELPERS}
  const rail = document.querySelector('.causal-rail')
  const modeButtons = document.querySelectorAll('#engine .field-view .segmented button')
  const eyebrow = document.querySelector('#engine .hero-copy .eyebrow')
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollY: window.scrollY,
    railBottom: rail ? rail.getBoundingClientRect().bottom : 0,
    eyebrowTop: eyebrow ? eyebrow.getBoundingClientRect().top : null,
    modeButtonCount: modeButtons.length,
    modeButtonTop: modeButtons[0] ? modeButtons[0].getBoundingClientRect().top : null,
    modeButtonWidth: modeButtons[0] ? modeButtons[0].getBoundingClientRect().width : 0,
    foldCopy: rect('#industry .capability-fold > .fold-copy'),
    foldFigure: rect('#industry .capability-fold > .capability-fold-svg'),
    foldColumns: (() => {
      const list = document.querySelector('#industry .capability-fold > .capability-list')
      return list ? getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length : 0
    })(),
  }
})()`

const CONCLUSION_PROBE = `(() => {
  const scene = document.querySelector('.scene')
  const overlay = scene ? getComputedStyle(scene, '::after') : null
  return {
    sceneClasses: scene ? scene.className : '',
    overlayImage: overlay ? overlay.backgroundImage : '',
    canvasCount: document.querySelectorAll('.scene canvas').length,
  }
})()`

async function main() {
  const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'silent' })
  const url = `http://localhost:${PORT}${BASE}`
  const profile = mkdtempSync(join(tmpdir(), 'smoke-'))
  const shots = resolve('.smoke-shots')
  if (KEEP) mkdirSync(shots, { recursive: true })

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--disable-extensions',
    '--hide-scrollbars',
    '--remote-debugging-port=9334',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' })

  const failures = []
  let cdp
  try {
    const version = await waitForEndpoint('http://127.0.0.1:9334/json/version', 15000)
    cdp = await connect(version.webSocketDebuggerUrl)
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    await cdp.send('Page.enable', {}, sessionId)
    await cdp.send('Runtime.enable', {}, sessionId)

    for (const width of TARGETS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width, height: VIEWPORT_HEIGHT, deviceScaleFactor: 1, mobile: false,
      }, sessionId)
      // 全站必须在"减少动效"下也成立：三条结尾语与星图的终值就靠这条媒体查询。
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      }, sessionId)
      await cdp.send('Page.navigate', { url }, sessionId)
      const mounted = await waitFor(cdp, sessionId, 'document.querySelector("#engine") !== null')
      if (!mounted) { failures.push(`@${width} 页面未挂载`); continue }
      // 3D 分块是懒加载的，等 canvas 就位再断言，否则会误判成"星图没渲染"。
      await waitFor(cdp, sessionId, 'document.querySelectorAll(".scene canvas").length > 0', 25000)
      await sleep(350)

      // 先量首屏。html 上有 scroll-behavior: smooth，必须显式 instant，
      // 否则下一帧还在滚动途中，读到的 rect 是过渡中的中间值。
      await evaluate(cdp, sessionId, 'window.scrollTo({ top: 0, behavior: "instant" })')
      await sleep(300)
      const hero = await evaluate(cdp, sessionId, HERO_PROBE)

      // 再滚到结论章，让星图所在章节真正成为当前章节。
      await evaluate(cdp, sessionId, 'document.querySelector("#conclusion").scrollIntoView({ block: "center", behavior: "instant" })')
      await sleep(450)
      const ending = await evaluate(cdp, sessionId, CONCLUSION_PROBE)
      const at = `@${width}`

      if (KEEP) {
        await evaluate(cdp, sessionId, 'window.scrollTo({ top: 0, behavior: "instant" })')
        await sleep(220)
        const heroShot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId)
        await evaluate(cdp, sessionId, 'document.querySelector("#conclusion").scrollIntoView({ block: "center", behavior: "instant" })')
        await sleep(320)
        const endShot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId)
        writeFileSync(join(shots, `hero-${width}.png`), Buffer.from(heroShot.data, 'base64'))
        writeFileSync(join(shots, `ending-${width}.png`), Buffer.from(endShot.data, 'base64'))
      }

      // A1 任何宽度都不许横向溢出。
      if (hero.scrollWidth > hero.clientWidth + 1) {
        failures.push(`${at} 横向溢出：scrollWidth ${hero.scrollWidth} > clientWidth ${hero.clientWidth}`)
      }

      // A2/A3 开场田地的模式按钮：必须渲染、可点、且不被顶部导航压住。
      //     当初 onModeChange 没传，整块控件根本没进 DOM，这条就是为它写的。
      if (hero.modeButtonCount !== 3) {
        failures.push(`${at} 开场田地模式按钮应为 3 个，实际 ${hero.modeButtonCount}`)
      }
      if (hero.modeButtonTop !== null && hero.modeButtonTop < hero.railBottom) {
        failures.push(`${at} 开场田地模式按钮被顶部导航遮挡（top ${Math.round(hero.modeButtonTop)} < rail ${Math.round(hero.railBottom)}）`)
      }

      // A4 首屏标题不允许顶到导航栏边上：正文第一行与因果栏之间必须留出呼吸空间。
      if (hero.eyebrowTop !== null && hero.eyebrowTop - hero.railBottom < 48) {
        failures.push(`${at} 顶部留白不足：首行距导航仅 ${Math.round(hero.eyebrowTop - hero.railBottom)}px（要求 ≥48）`)
      }

      // A5/A6 折叠图分栏：宽屏两栏且右栏真的被用起来，窄屏回到单栏。
      if (!hero.foldCopy || !hero.foldFigure) {
        failures.push(`${at} 折叠图结构缺失`)
      } else if (width >= FOLD_BREAKPOINT) {
        if (hero.foldFigure.left <= hero.foldCopy.left + 10) {
          failures.push(`${at} 折叠图未分栏：图左边界 ${Math.round(hero.foldFigure.left)} 未越过文案 ${Math.round(hero.foldCopy.left)}`)
        }
        if (hero.foldColumns !== 2) {
          failures.push(`${at} 能力卡应为 2 列，实际 ${hero.foldColumns} 列`)
        }
      } else {
        if (Math.abs(hero.foldFigure.left - hero.foldCopy.left) > 2) {
          failures.push(`${at} 折叠图窄屏应单栏，图左边界与文案差 ${Math.round(hero.foldFigure.left - hero.foldCopy.left)}px`)
        }
        if (hero.foldColumns < 2) {
          failures.push(`${at} 能力卡列数异常：${hero.foldColumns}`)
        }
      }

      // A7 结尾星图必须真的能看见：遮罩在视口中央（星图落点）的合成不透明度要低。
      //     当初是 90deg 的 94%→8% 横向渐变把正中的节点整片吃掉了。
      if (!ending.sceneClasses.includes('scene-conclusion')) {
        failures.push(`${at} 结论章未切换到 scene-conclusion，遮罩仍是默认浓度`)
      }
      const centreAlpha = overlayAlphaAt(ending.overlayImage, 0.5)
      if (centreAlpha > 0.5) {
        failures.push(`${at} 结尾星图被遮罩吃掉：视口中央遮罩不透明度 ${centreAlpha.toFixed(2)}（要求 ≤0.50）`)
      }
      if (ending.canvasCount === 0) failures.push(`${at} 3D 画布未渲染`)

      console.log(`${at} 宽度 ${hero.clientWidth}px · 首行留白 ${hero.eyebrowTop === null ? '-' : Math.round(hero.eyebrowTop - hero.railBottom)}px · 遮罩中央 α=${centreAlpha.toFixed(2)} · 折叠图 ${width >= FOLD_BREAKPOINT ? '双栏' : '单栏'} · 开场按钮 ${hero.modeButtonCount}`)
    }
  } finally {
    cdp?.close()
    chrome.kill()
    await server.close()
    if (!KEEP) rmSync(profile, { recursive: true, force: true })
  }

  if (failures.length) {
    console.error(`\n布局冒烟失败 ${failures.length} 项：`)
    failures.forEach((line) => console.error(`  · ${line}`))
    if (KEEP) console.error(`\n截图已保留在 ${shots}`)
    process.exit(1)
  }
  console.log(`\n布局冒烟通过：${TARGETS.length} 档宽度 × 8 项断言`)
}

async function waitForEndpoint(endpoint, timeout) {
  const deadline = Date.now() + timeout
  let lastError
  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint)
      if (response.ok) return await response.json()
    } catch (error) { lastError = error }
    await sleep(200)
  }
  throw new Error(`DevTools 端点未就绪：${lastError?.message ?? endpoint}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
