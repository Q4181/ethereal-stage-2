import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';       

const { PrismaClient } = pkg;           
const prisma = new PrismaClient();
const SECRET_KEY = 'MY_SUPER_SECRET_KEY'; 
const app = express();

app.use(cors()); 
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user; 
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required.' });
  next();
};

// สมัครสมาชิกใหม่
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  
  // เช็คความยาวรหัสผ่านที่ฝั่ง Backend เพื่อความปลอดภัยสูงสุด
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
  }

  try {
    // เช็คว่ามีอีเมลนี้หรือยัง
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    
    // สร้าง User ใหม่ (ให้ Role พื้นฐานเป็น USER)
    const newUser = await prisma.user.create({
      data: { email, password, role: 'USER' }
    });
    
    // สร้าง Token ให้ล็อกอินอัตโนมัติเลย
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ success: true, token, role: newUser.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.password === password) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ success: true, token, role: user.role });
  } else { res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }); }
});

app.get('/api/concerts', async (req, res) => {
  try {
    const concerts = await prisma.concert.findMany({ where: { isPublished: true } });
    res.json(concerts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/concerts/:id', async (req, res) => {
  try {
    const concert = await prisma.concert.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { seats: true }
    });
    if (!concert) return res.status(404).json({ error: 'Concert not found' });
    res.json(concert);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/users/me/tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.id },
      include: { 
        seat: { include: { concert: true } },
        trade: true 
      },
      orderBy: { purchasedAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/tickets/buy', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { seatIds } = req.body; 
  try {
    const result = await prisma.$transaction(async (tx) => {
      const seats = await tx.seat.findMany({ where: { id: { in: seatIds } } });
      if (seats.some(seat => seat.status !== 'AVAILABLE')) throw new Error('บางที่นั่งถูกซื้อไปแล้ว');
      await tx.seat.updateMany({ where: { id: { in: seatIds } }, data: { status: 'SOLD' } });
      return await Promise.all(seatIds.map(seatId => tx.ticket.create({ data: { userId, seatId } })));
    });
    res.json({ success: true, tickets: result });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/admin/concerts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const concerts = await prisma.concert.findMany();
    res.json(concerts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/admin/concerts', authenticateToken, isAdmin, async (req, res) => {
  const { name, description, date, time, venue, image, isPublished, customSeats } = req.body;
  try {
    const newConcert = await prisma.concert.create({
      data: { name, description, date, time, venue, image, isPublished, seats: { create: customSeats } },
    });
    res.json({ success: true, concert: newConcert });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/admin/concerts/:id', authenticateToken, isAdmin, async (req, res) => {
  const { name, description, date, time, venue, image, isPublished } = req.body;
  try {
    const updatedConcert = await prisma.concert.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description, date, time, venue, image, isPublished }
    });
    res.json({ success: true, concert: updatedConcert });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/admin/concerts/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const concertId = parseInt(req.params.id);
    await prisma.$transaction([
      prisma.trade.deleteMany({ where: { ticket: { seat: { concertId } } } }),
      prisma.ticket.deleteMany({ where: { seat: { concertId } } }),
      prisma.seat.deleteMany({ where: { concertId } }),
      prisma.concert.delete({ where: { id: concertId } })
    ]);
    res.json({ success: true });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ================== Trade API ==================
app.get('/api/trades', async (req, res) => {
  try {
    const { concertId } = req.query;
    const where = { status: 'OPEN' };
    if (concertId) { where.ticket = { seat: { concertId: parseInt(concertId) } }; }
    const trades = await prisma.trade.findMany({
      where,
      include: {
        ticket: { include: { seat: { include: { concert: true } } } },
        seller: { select: { id: true, email: true } }
      },
      orderBy: { listedAt: 'desc' }
    });
    res.json(trades);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/trades', authenticateToken, async (req, res) => {
  const { ticketId, price } = req.body;
  const sellerId = req.user.id;
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { trade: true, seat: true }
    });
    
    if (!ticket) return res.status(404).json({ error: 'ไม่พบตั๋ว' });
    if (ticket.userId !== sellerId) return res.status(403).json({ error: 'ตั๋วนี้ไม่ใช่ของคุณ' });
    
    // จัดการเคลียร์ปัญหา Unique Constraint (บั๊กขายซ้ำไม่ได้)
    if (ticket.trade) {
      if (ticket.trade.status === 'OPEN') return res.status(400).json({ error: 'ตั๋วนี้ถูกลงขายอยู่แล้ว' });
      if (ticket.trade.status === 'SOLD') return res.status(400).json({ error: 'บัตรนี้เป็นบัตรซื้อต่อมา ไม่สามารถขายซ้ำได้' });
      if (ticket.trade.status === 'CANCELLED') {
        // ลบข้อมูล Cancelled อันเก่าทิ้งไปเลย เพื่อคืนพื้นที่ให้สร้าง Trade ใหม่ได้
        await prisma.trade.delete({ where: { id: ticket.trade.id } });
      }
    }

    // เงื่อนไขราคา: ห้ามติดลบ และ ห้ามเกิน 90% ของราคาเต็ม
    const maxPrice = Math.floor(ticket.seat.price * 0.9);
    if (price <= 0) return res.status(400).json({ error: 'ราคาขายต้องมากกว่า $0' });
    if (price > maxPrice) return res.status(400).json({ error: `ไม่สามารถขายเกินราคา $${maxPrice} ได้` });

    const trade = await prisma.trade.create({
      data: { ticketId, sellerId, price: parseInt(price), status: 'OPEN' },
      include: { ticket: { include: { seat: { include: { concert: true } } } } }
    });
    res.json({ success: true, trade });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/trades/:id/buy', authenticateToken, async (req, res) => {
  const tradeId = parseInt(req.params.id);
  const buyerId = req.user.id;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUnique({
        where: { id: tradeId },
        include: { ticket: true }
      });
      if (!trade) throw new Error('ไม่พบรายการซื้อขาย');
      if (trade.status !== 'OPEN') throw new Error('รายการนี้ถูกซื้อหรือยกเลิกไปแล้ว');
      if (trade.sellerId === buyerId) throw new Error('ไม่สามารถซื้อตั๋วของตัวเองได้');

      await tx.ticket.update({
        where: { id: trade.ticketId },
        data: { userId: buyerId }
      });

      return await tx.trade.update({
        where: { id: tradeId },
        data: { status: 'SOLD', buyerId, soldAt: new Date() },
        include: {
          ticket: { include: { seat: { include: { concert: true } } } },
          seller: { select: { id: true, email: true } }
        }
      });
    });
    res.json({ success: true, trade: result });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/trades/:id', authenticateToken, async (req, res) => {
  const tradeId = parseInt(req.params.id);
  const userId = req.user.id;
  try {
    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade) return res.status(404).json({ error: 'ไม่พบรายการ' });
    if (trade.sellerId !== userId) return res.status(403).json({ error: 'คุณไม่ใช่ผู้ลงขายรายการนี้' });
    if (trade.status !== 'OPEN') return res.status(400).json({ error: 'ไม่สามารถยกเลิกรายการที่เสร็จสิ้นแล้ว' });

    // แก้บั๊ก: เปลี่ยนจากอัปเดตเป็น CANCELLED ให้เป็นการ "ลบทิ้ง" ไปเลย เพื่อคืนสิทธิ์ให้ตั้งขายใหม่ได้
    await prisma.trade.delete({ where: { id: tradeId } });
    res.json({ success: true });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/users/me/trades', authenticateToken, async (req, res) => {
  try {
    const [selling, bought] = await Promise.all([
      prisma.trade.findMany({
        where: { sellerId: req.user.id },
        include: {
          ticket: { include: { seat: { include: { concert: true } } } },
          buyer: { select: { id: true, email: true } }
        },
        orderBy: { listedAt: 'desc' }
      }),
      prisma.trade.findMany({
        where: { buyerId: req.user.id },
        include: {
          ticket: { include: { seat: { include: { concert: true } } } },
          seller: { select: { id: true, email: true } }
        },
        orderBy: { soldAt: 'desc' }
      })
    ]);
    res.json({ selling, bought });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(5000, () => console.log(`Backend server is running on http://localhost:5000`));