// Save-the-date card designs.
//
// Each design is a function that paints onto a canvas. The same function
// draws the on-screen preview and the downloaded file, so what the couple
// approves is exactly the file they send - no second renderer to drift.
//
// Canvas rather than html2canvas/SVG: the fonts are already loaded by the
// page, text measurement is exact, and there's no dependency or
// foreignObject/font-embedding fragility in the export path.

export interface SaveTheDateData {
  coupleNameA: string
  coupleNameB: string
  dateLabel: string
  shortDate: string
  venue: string
  photo: HTMLImageElement | null
}

export interface SaveTheDateDesign {
  id: string
  label: string
  // A design that has nothing to show without a photo is offered only once
  // one has been uploaded.
  needsPhoto: boolean
  draw: (ctx: CanvasRenderingContext2D, data: SaveTheDateData, w: number, h: number) => void
}

// Portrait, 3:4. Big enough that WhatsApp doesn't soften the type.
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1440

const PAPER = '#efe6d2'
const INK = '#241a14'
const MUTED = '#5a4d3a'
const RED = '#b23a2e'
const GOLD = '#8c7038'
const GREEN = '#4f5c3a'

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'center',
) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(value, x, y)
}

// The airy letter-spaced label the app uses elsewhere.
//
// Drawn as one fillText on purpose. Placing the characters by hand - the
// obvious way to fake letter-spacing on a canvas - lays them out
// left-to-right and so renders Hebrew backwards ("שמרו את התאריך" came out
// as "דיראתה תא ורמש"). One string, one call, and the canvas applies the
// bidi algorithm itself.
function spacedText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  spacing: number,
) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  // Not in every browser's Canvas2D; where it's missing the label simply
  // renders without the extra spacing rather than breaking.
  const supportsLetterSpacing = 'letterSpacing' in ctx
  if (supportsLetterSpacing) ctx.letterSpacing = `${spacing}px`
  ctx.fillText(value, x, y)
  if (supportsLetterSpacing) ctx.letterSpacing = '0px'
}

// Draws the photo cropped to fill the box, like CSS object-fit: cover.
function coverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / image.width, h / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(image, x + (w - drawWidth) / 2, y + (h - drawHeight) / 2, drawWidth, drawHeight)
  ctx.restore()
}

function leafSprig(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, flip = false) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(flip ? -scale : scale, scale)
  ctx.strokeStyle = GREEN
  ctx.fillStyle = GREEN
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(40, -40, 110, -55)
  ctx.stroke()

  for (let i = 0; i < 6; i++) {
    const t = 0.15 + i * 0.14
    const px = 110 * t + 40 * (1 - t) * t * 2
    const py = -55 * t - 40 * (1 - t) * t * 2
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(-0.5 + i * 0.12)
    ctx.beginPath()
    ctx.ellipse(0, 0, 17, 7, 0, 0, Math.PI * 2)
    ctx.globalAlpha = 0.75
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

// "רותם & עידן" with the ampersand in the accent colour.
//
// Three runs rather than one string, because only the ampersand is coloured -
// and laid out right-to-left, since that's the order Hebrew is read in. Going
// left-to-right (the arithmetic that feels natural) silently swaps the
// couple's names round.
function names(
  ctx: CanvasRenderingContext2D,
  data: SaveTheDateData,
  y: number,
  size: number,
  color: string,
) {
  ctx.font = `${size}px Bellefair, serif`
  ctx.textBaseline = 'alphabetic'

  const first = `${data.coupleNameA} `
  const amp = '& '
  const second = data.coupleNameB
  const total =
    ctx.measureText(first).width + ctx.measureText(amp).width + ctx.measureText(second).width

  // textAlign 'right' anchors each run at its right edge, so the cursor walks
  // leftwards and every run keeps its own correct internal direction.
  ctx.textAlign = 'right'
  let cursor = CARD_WIDTH / 2 + total / 2

  ctx.fillStyle = color
  ctx.fillText(first, cursor, y)
  cursor -= ctx.measureText(first).width

  ctx.fillStyle = RED
  ctx.fillText(amp, cursor, y)
  cursor -= ctx.measureText(amp).width

  ctx.fillStyle = color
  ctx.fillText(second, cursor, y)
}

export const SAVE_THE_DATE_DESIGNS: SaveTheDateDesign[] = [
  {
    id: 'classic',
    label: 'קלאסי',
    needsPhoto: false,
    draw: (ctx, data, w, h) => {
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = GOLD
      ctx.lineWidth = 2
      ctx.strokeRect(70, 70, w - 140, h - 140)
      ctx.lineWidth = 1
      ctx.strokeRect(88, 88, w - 176, h - 176)

      spacedText(ctx, 'שמרו את התאריך', w / 2, 300, '34px Rubik, sans-serif', GOLD, 8)
      names(ctx, data, 470, 108, INK)

      ctx.strokeStyle = GOLD
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(w / 2 - 150, 540)
      ctx.lineTo(w / 2 + 150, 540)
      ctx.stroke()

      text(ctx, data.shortDate, w / 2, 700, '92px Bellefair, serif', RED)
      text(ctx, data.dateLabel, w / 2, 780, '32px Rubik, sans-serif', MUTED)
      text(ctx, data.venue, w / 2, 850, '30px Rubik, sans-serif', MUTED)
      text(ctx, 'הזמנה רשמית תישלח בהמשך', w / 2, h - 200, '26px Rubik, sans-serif', GOLD)
    },
  },
  {
    id: 'botanical',
    label: 'בוטני',
    needsPhoto: false,
    draw: (ctx, data, w, h) => {
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, w, h)

      leafSprig(ctx, 150, 260, 1.1)
      leafSprig(ctx, w - 150, 260, 1.1, true)
      leafSprig(ctx, 150, h - 240, -1.1, false)
      leafSprig(ctx, w - 150, h - 240, -1.1, true)

      spacedText(ctx, 'save the date', w / 2, 400, '30px Rubik, sans-serif', GREEN, 10)
      names(ctx, data, 580, 104, INK)
      text(ctx, data.dateLabel, w / 2, 700, '36px Rubik, sans-serif', MUTED)
      text(ctx, data.shortDate, w / 2, 830, '84px Bellefair, serif', GREEN)
      text(ctx, data.venue, w / 2, 910, '30px Rubik, sans-serif', MUTED)
      text(ctx, 'מתרגשים לחגוג איתכם', w / 2, h - 230, '28px Rubik, sans-serif', GREEN)
    },
  },
  {
    id: 'arch',
    label: 'קשת',
    needsPhoto: false,
    draw: (ctx, data, w, h) => {
      ctx.fillStyle = '#f6f1e6'
      ctx.fillRect(0, 0, w, h)

      // The arch shape that runs through almost every modern save-the-date.
      const archX = 150
      const archW = w - 300
      const archTop = 200
      const archBottom = h - 220
      const radius = archW / 2

      ctx.beginPath()
      ctx.moveTo(archX, archBottom)
      ctx.lineTo(archX, archTop + radius)
      ctx.arc(archX + radius, archTop + radius, radius, Math.PI, 0)
      ctx.lineTo(archX + archW, archBottom)
      ctx.closePath()
      ctx.fillStyle = PAPER
      ctx.fill()
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 2
      ctx.stroke()

      spacedText(ctx, 'שמרו את התאריך', w / 2, 430, '28px Rubik, sans-serif', GOLD, 7)
      names(ctx, data, 600, 96, INK)
      text(ctx, data.shortDate, w / 2, 790, '76px Bellefair, serif', RED)
      text(ctx, data.venue, w / 2, 880, '28px Rubik, sans-serif', MUTED)
    },
  },
  {
    id: 'modern',
    label: 'מודרני',
    needsPhoto: false,
    draw: (ctx, data, w, h) => {
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(239,230,210,0.28)'
      ctx.lineWidth = 1
      ctx.strokeRect(60, 60, w - 120, h - 120)

      spacedText(ctx, 'save the date', w / 2, 320, '30px Rubik, sans-serif', '#c9b98d', 12)
      names(ctx, data, 560, 120, PAPER)

      ctx.fillStyle = RED
      ctx.fillRect(w / 2 - 60, 640, 120, 3)

      text(ctx, data.shortDate, w / 2, 800, '110px Bellefair, serif', PAPER)
      text(ctx, data.dateLabel, w / 2, 880, '30px Rubik, sans-serif', '#c9b98d')
      text(ctx, data.venue, w / 2, 950, '28px Rubik, sans-serif', '#c9b98d')
    },
  },
  {
    id: 'photo',
    label: 'עם תמונה',
    needsPhoto: true,
    draw: (ctx, data, w, h) => {
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, w, h)
      if (data.photo) coverImage(ctx, data.photo, 0, 0, w, h)

      // Bottom-up scrim so the text stays readable over any photo.
      const gradient = ctx.createLinearGradient(0, h * 0.35, 0, h)
      gradient.addColorStop(0, 'rgba(24,18,14,0)')
      gradient.addColorStop(1, 'rgba(24,18,14,0.88)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, h * 0.35, w, h * 0.65)

      spacedText(ctx, 'שמרו את התאריך', w / 2, h - 470, '28px Rubik, sans-serif', '#e8dcc2', 8)
      names(ctx, data, h - 330, 96, '#f6efe0')
      text(ctx, data.shortDate, w / 2, h - 200, '66px Bellefair, serif', '#f6efe0')
      text(ctx, data.venue, w / 2, h - 130, '28px Rubik, sans-serif', '#d9cdb4')
    },
  },
  {
    id: 'photo-frame',
    label: 'תמונה במסגרת',
    needsPhoto: true,
    draw: (ctx, data, w, h) => {
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, w, h)

      const margin = 110
      const photoTop = 150
      const photoHeight = 720
      if (data.photo) {
        coverImage(ctx, data.photo, margin, photoTop, w - margin * 2, photoHeight)
      }
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 2
      ctx.strokeRect(margin, photoTop, w - margin * 2, photoHeight)

      spacedText(ctx, 'שמרו את התאריך', w / 2, photoTop + photoHeight + 110, '26px Rubik, sans-serif', GOLD, 7)
      names(ctx, data, photoTop + photoHeight + 230, 84, INK)
      text(ctx, data.shortDate, w / 2, photoTop + photoHeight + 330, '58px Bellefair, serif', RED)
      text(ctx, data.venue, w / 2, photoTop + photoHeight + 395, '26px Rubik, sans-serif', MUTED)
    },
  },
]

export function renderSaveTheDate(
  canvas: HTMLCanvasElement,
  design: SaveTheDateDesign,
  data: SaveTheDateData,
) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  design.draw(ctx, data, CARD_WIDTH, CARD_HEIGHT)
}

// dd.mm.yyyy - the form a save-the-date actually shows.
export function shortDateOf(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}
