# TV Banking - Backend API 🏦

ระบบหลังบ้าน (Backend API) สำหรับแอปพลิเคชันจำลองการทำธุรกรรมทางธนาคาร พัฒนาด้วยสถาปัตยกรรมที่ทันสมัยและเน้นความปลอดภัยเป็นหลัก 

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)
* **Framework:** NestJS (TypeScript)
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT (Passport) & bcrypt

## ✨ ฟีเจอร์หลัก (Key Features)
1. **ระบบยืนยันตัวตน (Authentication):** สมัครสมาชิก และเข้าสู่ระบบ (JWT)
2. **จัดการผู้ใช้งาน (Users):** เรียกดูและอัปเดตข้อมูลโปรไฟล์ส่วนตัว
3. **จัดการบัญชีธนาคาร (Accounts):** เปิดบัญชี, ดูยอดเงิน, ปิดบัญชี
4. **ระบบทำธุรกรรม (Transactions):** ฝากเงิน, ถอนเงิน, โอนเงิน (ด้วย Database Transaction) และเรียกดูประวัติ

## 🛠️ วิธีการรันโปรเจกต์
\`\`\`bash
npm install
npx prisma migrate dev
npm run start:dev
\`\`\`