// Готовит логотип SAKHANOV: вырезает монограмму из logo.png и собирает
// PWA-иконки (монограмма на светлом фоне) + знак mark.png для интерфейса.
//
// ВНИМАНИЕ: sharp намеренно НЕ в зависимостях проекта (ломал сборку на Vercel).
// Перед запуском скрипта установите его локально:  npm i sharp
// затем:  node scripts/gen-icons.mjs   (и удалите sharp обратно: npm remove sharp)
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')

// Регион монограммы в logo.png (1264×846), подобран визуально.
const CROP = { left: 452, top: 95, width: 360, height: 350 }
const BG = '#f3f4f6' // светлый фон под металл (как в брендбуке)

function mark() {
  // монограмма на белом фоне (родной фон логотипа), обрезанная
  return sharp(join(root, 'logo.png')).extract(CROP).flatten({ background: '#ffffff' })
}

async function makeIcon(size, padRatio) {
  const pad = Math.round(size * padRatio)
  const inner = size - pad * 2
  const markPng = await mark()
    .resize(inner, inner, { fit: 'contain', background: BG })
    .toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: markPng, gravity: 'center' }])
    .png()
}

async function main() {
  console.log('Обработка логотипа SAKHANOV:')

  // знак для интерфейса (на светлом фоне, обрезан плотно)
  await mark().resize(512, 512, { fit: 'inside' }).toFile(join(publicDir, 'mark.png'))
  console.log('  public/mark.png')

  await (await makeIcon(192, 0.12)).toFile(join(publicDir, 'icon-192.png'))
  await (await makeIcon(512, 0.12)).toFile(join(publicDir, 'icon-512.png'))
  await (await makeIcon(512, 0.18)).toFile(join(publicDir, 'icon-maskable-512.png'))
  await (await makeIcon(180, 0.12)).toFile(join(publicDir, 'apple-touch-icon.png'))
  console.log('  icon-192 / icon-512 / icon-maskable-512 / apple-touch-icon')
  console.log('Готово.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
