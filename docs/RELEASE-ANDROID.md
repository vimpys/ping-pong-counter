# แจก Ping Pong Counter เป็นไฟล์ `.apk`

คู่มือนี้สำหรับแจกให้คนในก๊วน (ไม่เกิน 20 เครื่อง) โดยยังไม่ขึ้น Google Play

> ⚠️ ตั้งแต่ **30 ก.ย. 2026** มือถือ Android ในไทยจะติดตั้งแอปจากผู้พัฒนาที่ **ยังไม่ยืนยันตัวตน** ไม่ได้ — ทำขั้นตอนที่ 1 ก่อนแจก
> กติกานี้ยังเปลี่ยนได้ ตรวจรายละเอียดล่าสุดที่ <https://developer.android.com/developer-verification>

---

## 1. สมัครบัญชีผู้พัฒนาแบบฟรี (ครั้งเดียว)

1. เข้า **Android Developer Console** แล้วสมัคร **limited distribution account** (สำหรับนักเรียน/งานอดิเรก — ไม่เสียเงิน ไม่ต้องใช้บัตรประชาชน)
2. ลงทะเบียน **Package ID**: `com.kapom.pingpongcounter`
   - ถ้าระบบขอข้อมูล signing key ให้ใช้ **SHA-256 fingerprint** จากขั้นตอนที่ 2
3. เพิ่มเครื่องของคนในก๊วนที่อนุญาตให้ติดตั้ง (สูงสุด 20 เครื่อง) ตามที่ Console แนะนำ

## 2. สร้าง keystore สำหรับเซ็นแอป (ครั้งเดียว)

keystore คือ "กุญแจ" ที่พิสูจน์ว่าแอปมาจากคุณ **ถ้าหาย จะออกเวอร์ชันใหม่ให้เครื่องเดิมอัปเดตไม่ได้**

สร้างโฟลเดอร์ `C:\Users\Kapom\keys` แล้วรันใน PowerShell (ระบบจะถามรหัสผ่านและชื่อ — พิมพ์เอง):

```powershell
& "$env:USERPROFILE\.jdks\jbr-21.0.11\bin\keytool.exe" -genkeypair -v -keystore C:\Users\Kapom\keys\ping-pong-counter-release.jks -alias ping-pong-counter -keyalg RSA -keysize 2048 -validity 10000
```

- ใช้รหัสผ่านเป็น **ตัวอักษรอังกฤษ/ตัวเลข** เท่านั้น
- ดู SHA-256 fingerprint (ใช้ในขั้นตอนที่ 1):

```powershell
& "$env:USERPROFILE\.jdks\jbr-21.0.11\bin\keytool.exe" -list -v -keystore C:\Users\Kapom\keys\ping-pong-counter-release.jks -alias ping-pong-counter
```

### สำรอง keystore ทันที
- คัดลอก `ping-pong-counter-release.jks` ไว้ **อย่างน้อย 2 ที่** เช่น Google Drive + แฟลชไดรฟ์
- จดรหัสผ่านไว้ในที่ปลอดภัย (เช่น password manager)
- **ห้าม** ใส่ไฟล์ .jks หรือรหัสผ่านไว้ใน git (ตั้ง `.gitignore` ไว้แล้ว)

## 3. ตั้งค่าให้ build ใช้ keystore (ครั้งเดียว)

1. คัดลอก `android/keystore.properties.example` เป็น `android/keystore.properties`
2. ใส่รหัสผ่านจริงแทน `CHANGE_ME` ทั้ง 2 ช่อง

## 4. Build ไฟล์ APK

ต้องใช้ JDK 21 — ตั้ง `JAVA_HOME` ใน PowerShell ที่จะรัน:

```powershell
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\jbr-21.0.11"
```

```powershell
npm.cmd run android:apk
```

ไฟล์ที่ได้: `android\app\build\outputs\apk\release\app-release.apk`

> ทางเลือก: ใน Android Studio → **Build → Generate Signed App Bundle or APK → APK** แล้วเลือก keystore เดียวกัน

## 5. แจกให้คนในก๊วน

1. ส่งไฟล์ `app-release.apk` ผ่าน LINE / Google Drive
2. บนมือถือ: เปิดไฟล์ → อนุญาต **"ติดตั้งแอปที่ไม่รู้จัก"** สำหรับแอปที่ใช้เปิด (เช่น LINE, Files) → ติดตั้ง
3. ถ้าเจอคำเตือนจาก Play Protect ให้ดูรายละเอียดก่อนกดติดตั้งต่อ

## 6. ออกเวอร์ชันใหม่

1. แก้ `android/app/build.gradle`
   - `versionCode` **+1 ทุกครั้ง** (เช่น 1 → 2) — ถ้าไม่เพิ่ม เครื่องที่ติดตั้งแล้วจะอัปเดตไม่ได้
   - `versionName` ตามที่อยากแสดง (เช่น `"1.0.1"`)
2. Build ด้วย keystore **ตัวเดิม** (ขั้นตอนที่ 4)
3. แจกไฟล์ใหม่ — ติดตั้งทับได้เลย ข้อมูลในแอปไม่หาย

## 7. เปลี่ยนไอคอน / splash

แก้โลโก้ใน `scripts/generate-app-assets.mjs` แล้วรัน:

```powershell
npm.cmd run assets:generate
```
