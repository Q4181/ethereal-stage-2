import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('กำลังรีเซ็ตและสร้างข้อมูลเริ่มต้น...');


  await prisma.trade.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.concert.deleteMany({});
  await prisma.user.deleteMany({});


  const admin = await prisma.user.create({
    data: { 
      email: 'admin@gmail.com', 
      password: '12345678', 
      role: 'ADMIN' 
    }
  });


  await prisma.concert.create({
    data: {
      name: 'Magic Ticket Opening Show',
      description: 'คอนเสิร์ตตัวอย่างสำหรับทดสอบระบบ',
      date: '31 Dec 2024',
      time: '20:00',
      venue: 'Main Hall',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXoLyBwEP91wOEq5bFd2jXnmmuBzWP3uEWkg&s',
      isPublished: true,
      seats: {
        create: [
          { row: 'A', number: 1, tier: 'VIP', price: 5000, status: 'AVAILABLE' },
          { row: 'A', number: 2, tier: 'VIP', price: 5000, status: 'AVAILABLE' },
          { row: 'B', number: 1, tier: 'Standard', price: 2000, status: 'AVAILABLE' },
        ]
      }
    }
  });

  console.log('สร้างข้อมูลสำเร็จ!');
  console.log('คุณสามารถใช้บัญชี Admin: admin@test.com / password123 เพื่อเข้าจัดการระบบได้ทันที');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });