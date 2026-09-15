import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kapom.pingpongcounter',
  appName: 'Ping Pong Counter',
  webDir: 'dist',
  backgroundColor: '#fff6fa',
  plugins: {
    SystemBars: {
      // พื้นแอปสว่าง → ไอคอนนาฬิกา/แบตเตอรี่เป็นสีเข้ม
      style: 'LIGHT',
      // ส่งระยะรอยบาก/แถบระบบเป็น CSS variable --safe-area-inset-*
      insetsHandling: 'css',
    },
  },
}

export default config
