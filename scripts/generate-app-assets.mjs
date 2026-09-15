// สร้างรูปต้นฉบับสำหรับ @capacitor/assets (ไอคอนแอป + splash) จากโลโก้ไม้ปิงปองไขว้
// ใช้: node scripts/generate-app-assets.mjs && npx capacitor-assets generate --android
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const COLORS = {
  ink: '#3d2344',
  red: '#d9434a',
  blue: '#3b7be6',
  ball: '#ffbf3c',
  handle: '#fff1dc',
  iconBackground: '#fde8f1',
  splashBackground: '#fff6fa',
}

// โลโก้ไม้ปิงปองแดง/น้ำเงินไขว้ + ลูกปิงปอง (แบบสติกเกอร์)
const logoSvg = (width) => {
  const height = Math.round((width * 150) / 156)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="-78 -112 156 150" fill="none">
  <g stroke="${COLORS.ink}" stroke-width="3.5">
    <rect transform="rotate(38)" x="-8" y="-24" width="16" height="54" rx="6" fill="${COLORS.handle}"/>
    <rect transform="rotate(-38)" x="-8" y="-24" width="16" height="54" rx="6" fill="${COLORS.handle}"/>
    <circle transform="rotate(38)" cx="0" cy="-56" r="33" fill="${COLORS.blue}"/>
    <circle transform="rotate(-38)" cx="0" cy="-56" r="33" fill="${COLORS.red}"/>
    <circle cx="0" cy="-94" r="10" fill="${COLORS.ball}"/>
  </g>
  <g stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.55">
    <path transform="rotate(38)" d="M-20 -66 A 22 22 0 0 1 -4 -80"/>
    <path transform="rotate(-38)" d="M-20 -66 A 22 22 0 0 1 -4 -80"/>
  </g>
</svg>`)
}

function canvas(size, background) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
}

async function withLogo(size, logoWidth, background, file) {
  await canvas(size, background)
    .composite([{ input: logoSvg(logoWidth), gravity: 'center' }])
    .png()
    .toFile(file)
  console.log('✓', file)
}

await mkdir('assets', { recursive: true })
// ไอคอนแบบรูปเดียว (Android รุ่นเก่า / iOS)
await withLogo(1024, 760, COLORS.iconBackground, 'assets/icon-only.png')
// Adaptive icon (Android 8+): โลโก้อยู่ในวงปลอดภัยกลางภาพ พื้นหลังแยก
await withLogo(1024, 560, undefined, 'assets/icon-foreground.png')
await canvas(1024, COLORS.iconBackground).png().toFile('assets/icon-background.png')
console.log('✓ assets/icon-background.png')
// Splash screen (แอปมีธีมสว่างอย่างเดียว → ใช้แบบเดียวกันทั้งสองโหมด)
await withLogo(2732, 760, COLORS.splashBackground, 'assets/splash.png')
await withLogo(2732, 760, COLORS.splashBackground, 'assets/splash-dark.png')

// PWA (เว็บแอปที่ติดตั้งได้ บน Mac / คอม / มือถือ)
await mkdir('public', { recursive: true })
await withLogo(192, 142, COLORS.iconBackground, 'public/pwa-192.png')
await withLogo(512, 380, COLORS.iconBackground, 'public/pwa-512.png')
// maskable: เว้นขอบให้ระบบตัดเป็นวงกลม/สี่เหลี่ยมมนได้
await withLogo(512, 280, COLORS.iconBackground, 'public/pwa-maskable-512.png')
await withLogo(180, 134, COLORS.iconBackground, 'public/apple-touch-icon.png')
await withLogo(64, 56, undefined, 'public/favicon.png')
