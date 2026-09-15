# Ping Pong Counter

แอปนับแต้มปิงปองแบบก๊วน — Vue 3 + TypeScript + Tailwind CSS v4 + Capacitor 8

- แผนงาน: [ROADMAP.md](ROADMAP.md)
- แจก Android `.apk`: [docs/RELEASE-ANDROID.md](docs/RELEASE-ANDROID.md)
- ใช้เป็นเว็บแอป (PWA) บน Mac / คอม + คีย์ลัด: [docs/PWA.md](docs/PWA.md)
- แบบหน้าจอเริ่มต้น (ก่อนเปลี่ยนเป็นธีม Candy): [design/](design/)

## เครื่องมือที่ต้องมี

- Node.js `^22.18` หรือ `>=24.12`
- Android Studio รุ่นล่าสุด + JDK 21 (ตั้ง `JAVA_HOME` เมื่อ build จาก terminal)

> PowerShell บน Windows: ถ้า `npm` ใช้ไม่ได้เพราะ execution policy ให้ใช้ `npm.cmd` แทน

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm install` | ติดตั้ง dependencies |
| `npm run dev` | รันในเบราว์เซอร์ที่ http://localhost:5173 (เปิดโหมดมือถือใน DevTools) |
| `npm run test:unit` | รัน unit test (Vitest) |
| `npm run lint` | ตรวจโค้ด (Oxlint + ESLint) |
| `npm run format` | จัดรูปแบบโค้ด (Prettier) |
| `npm run build` | type-check + build เว็บ/PWA ไปที่ `dist/` |
| `npm run preview` | เปิด `dist/` ที่ http://localhost:4173 (ทดสอบ PWA) |
| `npm run cap:sync` | build แล้วคัดลอกไปโปรเจกต์ native |
| `npm run android:open` | เปิดโปรเจกต์ `android/` ใน Android Studio |
| `npm run android:run` | build แล้วติดตั้งลงมือถือ/emulator ที่ต่ออยู่ |
| `npm run android:apk:debug` | build APK สำหรับทดสอบ (ห้ามแจก) |
| `npm run android:apk` | build APK ที่เซ็นแล้วสำหรับแจก (ต้องมี `android/keystore.properties`) |
| `npm run assets:generate` | สร้างไอคอนแอป + splash ใหม่จากโลโก้ |

## โครงสร้าง

```
src/
  game/             กติกาและ engine การแข่ง (TypeScript ล้วน ไม่พึ่ง Vue)
    rules.ts          คะแนน ดิว คนเสิร์ฟ ผู้ชนะ
    session.ts        คิว ชนะติด ถอนตัว สถิติ
    settings.ts       ค่าตั้งต้น + ตรวจค่าที่อ่านจากเครื่อง
    names.ts          ตรวจชื่อผู้เล่น
  stores/           Pinia: setup (ตั้งค่า/รายชื่อ), session (การแข่งรอบนี้), storage (localStorage)
  views/            หน้าจอ: Home → Setup → Match → Summary
  components/       UI ใช้ร่วม (AppIcon, BottomSheet, PageHeader, …)
    match/            ส่วนของหน้าแข่ง (SidePanel, QueueSection, WinnerDialog, MatchSheet)
  composables/      logic ใช้ร่วมของหน้าจอ (คีย์ลัดหน้าแข่ง)
  native/           ต่อ Capacitor: สั่น/จอไม่ดับ, ปุ่ม back, แชร์รูป, ลงทะเบียน PWA
  assets/           main.css (design tokens), รูป, ลายพื้นหลัง
  __tests__/        test ระดับแอป + helper (dom.ts)
scripts/            สร้างรูปไอคอน/splash
android/            โปรเจกต์ Android (Capacitor)
```
