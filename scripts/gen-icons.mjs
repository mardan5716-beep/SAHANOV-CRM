// Генерация PNG-иконок PWA без внешних зависимостей.
// Бренд SAKHANOV: серебристая монограмма S в шестиграннике на графите.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// --- CRC32 / PNG ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = size * 4
  const raw = Buffer.alloc(size * (stride + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- геометрия ---
function hexVertices(cx, cy, r) {
  const v = []
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (60 * k)
    v.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return v
}
function inPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    const hit = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}
function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  return [x, y]
}

function render(size) {
  const px = Buffer.alloc(size * size * 4)
  const bgTop = [32, 34, 39] // графит вверху
  const bgBot = [18, 19, 22] // темнее внизу
  const set = (x, y, c, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    // альфа-смешение поверх текущего
    const ia = a / 255
    px[i] = Math.round(c[0] * ia + px[i] * (1 - ia))
    px[i + 1] = Math.round(c[1] * ia + px[i + 1] * (1 - ia))
    px[i + 2] = Math.round(c[2] * ia + px[i + 2] * (1 - ia))
    px[i + 3] = 255
  }
  // металлический серебристый цвет с вертикальным градиентом и лёгким бликом
  const silver = (y) => {
    const t = y / size
    const base = 235 - t * 120 // сверху светлее
    return [Math.min(255, base + 8), Math.min(255, base + 6), Math.min(255, base + 12)]
  }

  // фон-градиент
  for (let y = 0; y < size; y++) {
    const t = y / size
    const c = [
      Math.round(bgTop[0] + (bgBot[0] - bgTop[0]) * t),
      Math.round(bgTop[1] + (bgBot[1] - bgTop[1]) * t),
      Math.round(bgTop[2] + (bgBot[2] - bgTop[2]) * t),
    ]
    for (let x = 0; x < size; x++) set(x, y, c)
  }

  const c = size / 2
  // кольцо-шестигранник (flat-top)
  const outer = hexVertices(c, c, size * 0.40)
  const inner = hexVertices(c, c, size * 0.305)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inPolygon(x, y, outer) && !inPolygon(x, y, inner)) set(x, y, silver(y))
    }
  }

  // монограмма S (две кубические кривые), толстая обводка серебром
  const S = size
  const top = [
    [0.66 * S, 0.34 * S],
    [0.30 * S, 0.28 * S],
    [0.34 * S, 0.52 * S],
    [0.5 * S, 0.5 * S],
  ]
  const bot = [
    [0.5 * S, 0.5 * S],
    [0.66 * S, 0.48 * S],
    [0.70 * S, 0.72 * S],
    [0.34 * S, 0.66 * S],
  ]
  const rad = Math.max(2, size * 0.052)
  const stamp = (cx, cy) => {
    for (let dy = -rad; dy <= rad; dy++)
      for (let dx = -rad; dx <= rad; dx++)
        if (dx * dx + dy * dy <= rad * rad) set(Math.round(cx + dx), Math.round(cy + dy), silver(cy + dy))
  }
  for (let i = 0; i <= 120; i++) {
    const p = cubic(top[0], top[1], top[2], top[3], i / 120)
    stamp(p[0], p[1])
  }
  for (let i = 0; i <= 120; i++) {
    const p = cubic(bot[0], bot[1], bot[2], bot[3], i / 120)
    stamp(p[0], p[1])
  }

  return px
}

function write(name, size) {
  const png = encodePng(size, render(size))
  writeFileSync(join(publicDir, name), png)
  console.log(`  ${name} (${size}×${size}, ${png.length} байт)`)
}

console.log('Генерация иконок SAKHANOV:')
write('icon-192.png', 192)
write('icon-512.png', 512)
write('icon-maskable-512.png', 512)
write('apple-touch-icon.png', 180)
console.log('Готово.')
