# Roadmap · Ping Pong Counter

แอปมือถือสำหรับนับแต้มปิงปองแบบก๊วน มีคิวผู้เล่น สลับคนลงเล่นอย่างยุติธรรม และสรุปสถิติแชร์เป็นรูปได้

- **แบบหน้าจอ:** https://claude.ai/code/artifact/fd106cb6-5a1e-437a-9cd0-9f6504ea1341
- **ไฟล์ออกแบบ:** [design/](design/)

## 0. ข้อมูลแอป

| หัวข้อ | ค่า |
|---|---|
| ชื่อแอป | Ping Pong Counter |
| Package ID | `com.kapom.pingpongcounter` (เปลี่ยนไม่ได้หลังลงทะเบียน — ยืนยันก่อน M8) |
| Server | ไม่มี — ข้อมูลเก็บในเครื่องทั้งหมด ใช้งาน offline ได้ |
| ลำดับการแจก | ① Android `.apk` (ฟรี, ≤ 20 เครื่อง) → ② Google Play Store → ③ iOS App Store |

---

## 1. Tech stack

| ส่วน | เลือกใช้ |
|---|---|
| Framework | Vue 3 + Vite + TypeScript |
| State | Pinia |
| Styling | Tailwind CSS v4 (สี/ฟอนต์ตามแบบ ใส่ใน `@theme`) |
| Headless UI (เมื่อจำเป็น) | Reka UI — dialog, bottom sheet |
| Drag & drop | `vue-draggable-plus` |
| ฟอนต์ (ฝังในแอป ใช้ offline ได้) | `@fontsource/chakra-petch`, `@fontsource/anuphan` |
| แชร์รูป | `html-to-image` + `@capacitor/filesystem` + `@capacitor/share` |
| Native | Capacitor: `@capacitor/haptics`, `@capacitor/preferences`, `@capacitor/app`, `@capacitor/screen-orientation`, `@capacitor-community/keep-awake` |
| Test | Vitest (logic), Vue Test Utils (component) |

**Design tokens (ธีม Candy)** — อยู่ใน [src/assets/main.css](src/assets/main.css)

```css
--color-bg: #fff6fa;      --color-surface: #ffffff;  --color-surface-2: #fde8f1;
--color-line: #f5cfe0;    --color-divider: #f8e4ee;
--color-ink: #3d2344;     --color-muted: #8c7090;    --color-faint: #baa4be;
--color-primary: #ec4f93; --color-on-primary: #ffffff;
--color-accent: #ffbf3c;  --color-danger: #e0445a;
--color-red-side: #d9434a; --color-blue-side: #3b7be6;   /* สีฝั่งผู้แข่ง คงเดิม */
--font-display: "Chakra Petch"; --font-body: "Anuphan";
```

---

## 2. กติกาและ logic (spec)

### 2.1 ค่าตั้งต้น
| ค่า | ตัวเลือก | ค่าเริ่มต้น |
|---|---|---|
| แต้มที่ชนะ `T` | 5 / 7 / 11 | 5 |
| สลับเสิร์ฟทุก `S` ลูก | 1–5 | 2 |
| ดิว ต้องนำ `D` แต้ม | 1 / 2 / 3 | 2 |
| กติกาชนะติด | เปิด/ปิด | เปิด |
| จำนวนเกมที่ชนะติด `K` | 2–5 | 3 |

### 2.2 การชนะเกม
- **ดิว** เริ่มเมื่อทั้งสองฝั่งได้ `T-1` แต้ม
- ฝั่งที่มีแต้ม `s` ชนะ เมื่อ `s >= T` และ (`อีกฝั่ง < T-1` หรือ `s - อีกฝั่ง >= D`)

### 2.3 การเสิร์ฟ
- **คนเสิร์ฟก่อน:** เกมแรก / หลังชนะติดครบ (ออกทั้งคู่) / หลังมีคนถอนตัว → ฝั่งแดง · เกมที่ผู้ชนะอยู่ต่อ → ฝั่งผู้แพ้ (ผู้ท้าชิงที่ลงแทน) เสิร์ฟก่อน
- ก่อนดิว: เปลี่ยนคนเสิร์ฟทุก `S` ลูก → `server = (firstServer + floor(total / S)) % 2`
- ระหว่างดิว: สลับคนเสิร์ฟ **ทุกลูก** ต่อจากคนที่เสิร์ฟอยู่ตอนเริ่มดิว
- ป้ายบอกลูกที่เสิร์ฟ เช่น "ลูก 1/2" / ช่วงดิวแสดง "สลับทุกลูก"

### 2.4 คิวผู้เล่น
- 2 คนแรกของรายชื่อลงเล่นก่อน (ฝั่งแดง / ฝั่งน้ำเงิน) ที่เหลือเข้าคิวตามลำดับ
- จบเกม: **ผู้ชนะอยู่ต่อ**, ผู้แพ้ไปต่อท้ายคิว, คนแรกในคิวลงแทนฝั่งผู้แพ้
- **กติกาชนะติด:** ถ้าผู้ชนะชนะติดครบ `K` เกม → ทั้งคู่ไปต่อท้ายคิว (ผู้แพ้ก่อน แล้วผู้ชนะ), 2 คนแรกในคิวลงเล่น
- ลากจัดลำดับคิวได้ตลอด (เช่น คนถัดไปไปห้องน้ำ)
- เพิ่มผู้เล่นระหว่างเกมได้ → ต่อท้ายคิว

### 2.5 ออก / ถอนตัว / กลับเข้า
- **ผู้เล่นในคิว → "ออกจากการแข่งขัน":** ย้ายไปท้ายรายชื่อ สถานะ inactive (แสดงจาง) สถิติยังอยู่
- **ผู้เล่นที่กำลังแข่ง → "ถอนตัว":** เกมนี้ถูกยกเลิก **ไม่นับชนะ/แพ้ให้ใคร** อีกฝ่ายอยู่ต่อ (ชนะติดคงเดิม) คนที่ถอนตัวเป็น inactive คนถัดไปลงแทน เริ่ม 0–0
- **"กลับเข้าการแข่งขัน":** จาก inactive → ต่อท้ายคิว นับสถิติต่อจากเดิม

### 2.6 Undo
- เก็บทุกแต้มเป็น event stack → "ย้อนแต้ม" ย้อนแต้มล่าสุด (แสดงปุ่มที่ฝั่งที่เพิ่งได้แต้ม)
- แต้มที่ทำให้จบเกมย้อนได้จาก dialog ผู้ชนะ ("กดผิด · ย้อนแต้มล่าสุด") → คืนผลเกม, สถิติ, streak, คิว

### 2.7 สถิติ (ต่อ session)
- ต่อผู้เล่น: เล่น / ชนะ / แพ้ / % ชนะ — รวมผู้เล่นที่ inactive
- เรียงตาม ชนะ มาก → น้อย แล้ว % ชนะ
- ไม่นับเกมที่ยังไม่จบ

---

## 3. Data model (ร่าง)

```ts
type Side = 'red' | 'blue'

interface GameSettings {
  targetScore: 5 | 7 | 11
  serveEvery: number        // S
  deuceLead: 1 | 2 | 3      // D
  streakRule: { enabled: boolean; wins: number } // K
}

interface Player {
  id: string
  name: string
  status: 'active' | 'inactive'
  played: number
  wins: number
  losses: number
}

interface Game {
  no: number
  red: string               // player id
  blue: string
  firstServer: Side
  points: Side[]            // event stack สำหรับคำนวณคะแนน/เสิร์ฟ/undo
  result?: { winner: Side | null; kind: 'normal' | 'void' }
}

interface Session {
  id: string
  startedAt: string
  settings: GameSettings
  players: Player[]
  queue: string[]           // player ids ที่รอ (active)
  streak: { playerId: string; count: number } | null
  games: Game[]
  status: 'playing' | 'finished'
}
```

> คะแนน, คนเสิร์ฟ, สถานะดิว **คำนวณจาก `points`** ไม่เก็บซ้ำ → undo ง่ายและไม่ผิดพลาด

---

## 4. Milestones

### M0 · ตั้งโปรเจกต์
- [x] สร้าง Vue 3 + Vite + TS, ESLint + Oxlint + Prettier
- [x] Tailwind v4 + design tokens + ฟอนต์ฝังในแอป
- [x] Pinia, Vue Router (setup → match → summary)
- [x] Vitest
- [x] เพิ่ม Capacitor 8, สร้าง platform `android` (`ios` ทำใน M10)
- [ ] ติดตั้ง Android Studio (มี JDK 21 + Android SDK 36 มาในตัว)
- [ ] รันบนเครื่อง Android จริงได้

**เสร็จเมื่อ:** เปิดแอปบนมือถือ Android เห็นหน้าเปล่าที่ใช้ฟอนต์/สีถูกต้อง

### M1 · Game engine (logic ล้วน ไม่มี UI)
- [x] `score`, `server`, `isDeuce`, `winner` คำนวณจาก points + settings — [src/game/rules.ts](src/game/rules.ts)
- [x] จัดคิว: ผู้แพ้ต่อท้าย, กติกาชนะติด, คนถัดไปลงแทน — [src/game/session.ts](src/game/session.ts)
- [x] ออก / ถอนตัว (ไม่นับผล) / กลับเข้า, เพิ่มผู้เล่น, จัดลำดับคิว
- [x] คนเสิร์ฟก่อน: ผู้ชนะอยู่ต่อ → ฝั่งผู้แพ้เสิร์ฟ, กรณีอื่น → ฝั่งแดง
- [x] undo แต้ม และ undo แต้มจบเกม (เกมที่ชนะแล้วรอ "เริ่มเกมถัดไป" จึงย้อนได้)
- [x] สถิติผู้เล่น + leaderboard
- [x] Unit test ครอบคลุม: T = 5/7/11, D = 1/2/3, S = 1/2/5, ดิวยาว, ชนะติดครบ K, ถอนตัวกลางดิว, undo หลังจบเกม, ผู้เล่นไม่พอ

**เสร็จเมื่อ:** test ผ่านทั้งหมด, engine ไม่ import Vue ✅
### M2 · หน้าแรก + หน้าตั้งค่าเกม
- [x] หน้าแรก: ชื่อแอป + ปุ่ม "เริ่มเกม" → ไปหน้าตั้งค่า
- [x] เลือกแต้ม 5/7/11, stepper สลับเสิร์ฟ, ดิว 1/2/3
- [x] toggle + stepper กติกาชนะติด
- [x] เพิ่ม / ลบผู้เล่น (กันชื่อซ้ำ), ลากจัดลำดับ, แสดง 2 คนแรก = แดง/น้ำเงิน
- [x] ปุ่ม "ยืนยันและเริ่มเกม" (ถ้าผู้เล่น < 2 แสดง "เพิ่มผู้เล่นอีก N คน")
- [x] จำค่าตั้งค่าล่าสุดและรายชื่อไว้ใช้ครั้งหน้า (localStorage)
- [ ] ทดสอบลากจัดลำดับด้วยนิ้วบนมือถือจริง

### M3 · หน้าแข่ง (core)
- [x] 2 ฝั่งแดง/น้ำเงิน แตะเพื่อนับแต้ม + haptic + กันแตะซ้ำภายใน 400ms
- [x] ป้ายเสิร์ฟ, จุดชนะติด, ปุ่มย้อนแต้ม
- [x] แถบดิว "ต้องนำ D แต้มถึงชนะ"
- [x] `touch-action: manipulation`, กันซูม/เลือกข้อความ, safe area
- [x] ล็อกจอแนวตั้ง (AndroidManifest), keep-awake ระหว่างแข่ง
- [x] session store บันทึกลงเครื่องทุกแต้ม + ปุ่ม "เล่นต่อ" ที่หน้าแรก
- [x] คิวรอเล่นแบบอ่านอย่างเดียว + สถิติ (จัดการคิวทำใน M4)
- [x] แถบผู้ชนะชั่วคราว + "เริ่มเกมถัดไป" (dialog เต็มทำใน M5)
- [ ] ทดสอบ haptic / keep-awake / ล็อกแนวตั้ง บนมือถือจริง

### M4 · คิวและการจัดการผู้เล่น
- [x] รายการคิวพร้อมสถิติ, ป้าย "คนถัดไป"
- [x] ลากจัดลำดับคิว
- [x] เพิ่มผู้เล่นระหว่างเกม (กันชื่อซ้ำ)
- [x] Bottom sheet: ออกจากการแข่งขัน (ผู้เล่นในคิว)
- [x] Bottom sheet: ถอนตัว (ผู้เล่นที่กำลังแข่ง ผ่านปุ่ม ⋯) — ตัวเลือกเดียว ไม่นับผล
- [x] ส่วน "ออกจากการแข่งขัน" ท้ายรายชื่อ + กลับเข้าการแข่งขัน
- [ ] ทดสอบลากคิวด้วยนิ้วบนมือถือจริง

### M5 · ประกาศผู้ชนะ
- [x] Dialog: ชื่อผู้ชนะ (สีฝั่ง), สกอร์, แจ้งกติกาชนะติด, เกมถัดไปใครพบใคร + ใครเสิร์ฟก่อน
- [x] ปุ่ม "เริ่มเกมถัดไป"
- [x] ปุ่ม "กดผิด · ย้อนแต้มล่าสุด"
- [x] ปิด dialog ด้วยการแตะพื้นหลัง/Esc ไม่ได้ (กันปิดโดยไม่ตั้งใจ) + สั่นแจ้งตอนจบเกม

### M6 · สรุปผลและแชร์
- [x] ปุ่ม "จบการแข่งขัน" → หน้าสรุป (ไม่ล้างข้อมูล กลับไปเล่นต่อได้) + ปุ่มใน dialog ผู้ชนะ
- [x] การ์ดสรุป: วันที่ (พ.ศ.), ผู้ชนะมากสุด, ตาราง เล่น/ชนะ/แพ้/% — รวมเกมที่เพิ่งชนะและผู้เล่นที่ออกไปแล้ว
- [x] แชร์เป็นรูป (html-to-image → PNG → Filesystem cache → share sheet / เบราว์เซอร์: Web Share หรือดาวน์โหลด)
- [x] กลับไปเล่นต่อ / เริ่มรอบใหม่ (confirm ก่อนล้างสถิติ)
- [ ] ทดสอบแชร์รูปเข้า LINE / Facebook บนมือถือจริง

### M7 · ความเสถียรบนมือถือ
- [x] บันทึก session ลงเครื่องทุกแต้ม → ปิดแอป/แอปเด้งแล้วเล่นต่อได้ (ทำใน M3)
- [x] ปุ่ม back ของ Android: ปิด sheet/dialog ก่อน (dialog ผู้ชนะไม่ปิด) · หน้าแข่งถามก่อนออก · ตั้งค่า→หน้าแรก · สรุป→หน้าแข่ง · หน้าแรก→ออกจากแอป
- [x] หน้าตั้งค่า: ถามก่อนเริ่มรอบใหม่ทับรอบที่ค้างอยู่
- [x] แถบระบบ Android: ไอคอนสีเข้มบนพื้นสว่าง (SystemBars `LIGHT`) + safe area จาก `--safe-area-inset-*`
- [x] ตรวจจอเล็ก 360×640 ในเบราว์เซอร์: ทุกหน้าไม่ล้นจอ, dialog ผู้ชนะเลื่อนได้ถ้าจอเตี้ยมาก
- [ ] ทดสอบบนมือถือ Android จริง (back, แถบระบบ, รอยบาก) และ iPhone ที่มีรอยบาก (M10)
- [ ] ทดสอบจริงที่โต๊ะ: แตะเร็ว ๆ, มือเปียก, แสงจ้า

### M8 · แจก Android `.apk` (ฟรี)
> ตั้งแต่ **30 ก.ย. 2026** ประเทศไทยบังคับ Android developer verification — แอปจากผู้พัฒนาที่ไม่ได้ยืนยันตัวตนจะติดตั้งบนมือถือทั่วไปไม่ได้ (รวม `.apk`)

คู่มือทีละขั้น: [docs/RELEASE-ANDROID.md](docs/RELEASE-ANDROID.md)

- [ ] 👤 สมัคร **limited distribution account** (ฟรี, ไม่ต้องใช้บัตรประชาชน, แจกได้ ≤ 20 เครื่อง) ใน Android Developer Console
- [ ] 👤 ลงทะเบียน Package ID `com.kapom.pingpongcounter`
- [ ] 👤 สร้าง release keystore — **สำรองไฟล์ + รหัสผ่านไว้หลายที่** (หายแล้วอัปเดตแอปเดิมไม่ได้)
- [x] ไอคอน + splash จากโลโก้ไม้ปิงปองไขว้ (`npm run assets:generate`)
- [x] signing config อ่านจาก `android/keystore.properties` (ไม่ commit) + `npm run android:apk`
- [x] เลขเวอร์ชันเริ่มต้น `versionCode 1` / `versionName "1.0.0"`
- [ ] 👤 build release APK แล้วเพิ่มเครื่องผู้ทดสอบที่อนุญาต แจกให้คนในก๊วน

> 👤 = ต้องทำเอง (บัญชี, รหัสผ่าน)

### เว็บแอป (PWA) + คีย์ลัด — ใช้บน Mac / คอม
คู่มือ: [docs/PWA.md](docs/PWA.md)

- [x] manifest + service worker (vite-plugin-pwa) ใช้ offline ได้ · ไม่ลงทะเบียนในแอป Capacitor
- [x] ไอคอน PWA / apple-touch-icon / favicon จากโลโก้
- [x] คีย์ลัดหน้าแข่ง ← A / → L / Backspace Z / Enter + แสดงคำใบ้เมื่อใช้เมาส์
- [ ] 👤 อัปโหลด `dist` ขึ้น Netlify หรือ Cloudflare Pages แล้วติดตั้งบน Mac

### M9 · Google Play Store (เมื่อพร้อมจ่าย 25 USD)
- [ ] อัปเกรดเป็นบัญชี Google Play Console
- [ ] หน้า privacy policy (ฟรีบน GitHub Pages / Google Sites)
- [ ] ใช้ keystore เดิม (ผู้ใช้ `.apk` อัปเดตผ่าน Play ได้ต่อ)
- [ ] build AAB, ไอคอน 512×512, ภาพหน้าจอ ≥ 2, คำอธิบายแอป
- [ ] Closed testing ≥ 12 คน ต่อเนื่อง 14 วัน (บัญชีส่วนตัวใหม่) → production

### M10 · iOS App Store
- [ ] Apple Developer Program (99 USD/ปี)
- [ ] build ผ่าน Mac หรือ cloud CI (Codemagic / GitHub Actions macOS)
- [ ] ทดสอบ safe area / รอยบาก บน iPhone จริง
- [ ] TestFlight → App Store

---

## 5. ไอเดียหลังเปิดตัว (ยังไม่ผูกมัด)
- พูดคะแนนออกเสียง (text-to-speech)
- ประวัติหลาย session / สถิติสะสมรายคน
- นับแต้มด้วยปุ่มปรับเสียงหรือรีโมท Bluetooth
- แสดงคอลัมน์ "ชนะติดสูงสุด" ในสรุป

---

## 6. คำถามที่ยังต้องตัดสินใจ
- [x] ใครเสิร์ฟก่อนในแต่ละเกม → ผู้ชนะอยู่ต่อ: ฝั่งผู้แพ้เสิร์ฟ · ไม่มีผู้ชนะอยู่ในสนาม: ฝั่งแดง
- [ ] ต้องสลับฝั่งแดง–น้ำเงินระหว่างเกมไหม
- [x] กติกาชนะติดครบ: ใครไปต่อคิวก่อน → ผู้แพ้ก่อน
- [x] ถอนตัวนับผลไหม → ไม่นับชนะ/แพ้ให้ใคร (ตัดตัวเลือก "ให้อีกฝ่ายชนะ" ออก)
- [x] ผู้เล่นที่ออกไปแล้ว แสดงในหน้าสรุปด้วยไหม → แสดง
- [ ] ชื่อที่แสดงบนการ์ดสรุป — ตอนนี้ใช้ "Ping Pong Counter" · ให้ตั้งชื่อก๊วนเองได้ไหม
