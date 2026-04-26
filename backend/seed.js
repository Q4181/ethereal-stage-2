// ไฟล์: backend/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('กำลังสร้างข้อมูลจำลอง...');

  // 1. สร้างบัญชี Admin และ User ธรรมดา
  const admin = await prisma.user.create({
    data: { email: 'admin@test.com', password: 'password123', role: 'ADMIN' }
  });

  const user = await prisma.user.create({
    data: { email: 'user@test.com', password: 'password123', role: 'USER' }
  });

  // 2. สร้างคอนเสิร์ตพร้อมที่นั่ง
  const concert = await prisma.concert.create({
    data: {
      name: 'Luna Blue - Ethereal Tour',
      description: 'คอนเสิร์ตสุดยิ่งใหญ่แห่งปี',
      date: '24 Dec 2024',
      time: '19:00',
      venue: 'Ethereal Stadium',
      seats: {
        create: [
          { row: 'A', number: 1, tier: 'VIP', status: 'AVAILABLE' },
          { row: 'A', number: 2, tier: 'VIP', status: 'AVAILABLE' },
          { row: 'B', number: 1, tier: 'Regular', status: 'AVAILABLE' },
          { row: 'B', number: 2, tier: 'Regular', status: 'AVAILABLE' },
          { row: 'B', number: 3, tier: 'Regular', status: 'AVAILABLE' },
        ]
      }
    }
  });

  console.log('สร้างข้อมูลสำเร็จ!');
  console.log('Admin Email:', admin.email);
  console.log('User Email:', user.email);
  console.log('Concert:', concert.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });