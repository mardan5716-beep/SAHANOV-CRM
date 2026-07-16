// Генерация PNG-иконок PWA без внешних зависимостей.
// Рисует стилизованный «стол» белым на синем фоне и кодирует в PNG (RGBA + zlib).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// --- CRC32 ---
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
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = size * 4
  const raw = Buffer.alloc(size * (stride + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function render(size) {
  const px = Buffer.alloc(size * size * 4)
  const bg = [37, 99, 235, 255] // #2563eb
  const white = [255, 255, 255, 255]

  const set = (x, y, c) => {
    const i = (y * size + x) * 4
    px[i] = c[0]
    px[i + 1] = c[1]
    px[i + 2] = c[2]
    px[i + 3] = c[3]
  }
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = Math.round(y0 * size); y < Math.round(y1 * size); y++) {
      for (let x = Math.round(x0 * size); x < Math.round(x1 * size); x++) {
        if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, c)
      }
    }
  }

  // фон
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, bg)
  // стол: столешница
  rect(0.22, 0.40, 0.78, 0.47, white)
  // ножки
  rect(0.27, 0.47, 0.34, 0.72, white)
  rect(0.66, 0.47, 0.73, 0.72, white)

  return px
}

function write(name, size) {
  const png = encodePng(size, render(size))
  writeFileSync(join(publicDir, name), png)
  console.log(`  ${name} (${size}×${size}, ${png.length} байт)`)
}

console.log('Генерация иконок PWA:')
write('icon-192.png', 192)
write('icon-512.png', 512)
write('icon-maskable-512.png', 512)
write('apple-touch-icon.png', 180)
console.log('Готово.')
