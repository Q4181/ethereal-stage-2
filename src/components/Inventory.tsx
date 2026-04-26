import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, ExternalLink, Tag, X, ShoppingBag, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from './Modal';

export default function Inventory() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [myTrades, setMyTrades] = useState<{ selling: any[]; bought: any[] }>({ selling: [], bought: [] });
  const [loading, setLoading] = useState(true);
  const [sellPrice, setSellPrice] = useState<{ [ticketId: number]: string }>({});
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error' | 'info' | 'confirm', title: '', msg: '', action: null as null | (() => void) });

  const token = localStorage.getItem('token');

  const fetchAll = async () => {
    try {
      const [ticketRes, tradeRes] = await Promise.all([
        fetch('http://localhost:5000/api/users/me/tickets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/users/me/trades', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const ticketData = await ticketRes.json();
      const tradeData = await tradeRes.json();
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setMyTrades({ selling: tradeData.selling || [], bought: tradeData.bought || [] });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openTradeByTicketId = Object.fromEntries(
    myTrades.selling.filter(t => t.status === 'OPEN').map(t => [t.ticketId, t])
  );

  const handleListForSale = async (ticketId: number, maxPrice: number) => {
    const price = parseInt(sellPrice[ticketId] || '0');
    if (!price || price <= 0) {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'กรุณากรอกราคาที่มากกว่า $0', action: null });
      return;
    }
    if (price > maxPrice) {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: `คุณสามารถตั้งราคาได้สูงสุด $${maxPrice} เท่านั้น`, action: null });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ticketId, price }),
      });
      const data = await res.json();
      if (data.success) {
        setModal({ open: true, type: 'success', title: 'ลงขายสำเร็จ! 🎉', msg: 'ตั๋วของคุณถูกลงขายในตลาด Trade แล้ว', action: null });
        setSellPrice(prev => { const next = { ...prev }; delete next[ticketId]; return next; });
        fetchAll();
      } else {
        setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: data.error, action: null });
      }
    } catch {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'ระบบขัดข้อง', action: null });
    }
  };

  const handleCancelTrade = (tradeId: number) => {
    setModal({
      open: true, type: 'confirm', title: 'ยืนยันการยกเลิก', msg: 'ต้องการยกเลิกการลงขายตั๋วนี้ใช่หรือไม่?',
      action: async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/trades/${tradeId}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setModal({ open: true, type: 'success', title: 'ยกเลิกสำเร็จ', msg: 'ยกเลิกการลงขายเรียบร้อยแล้ว', action: null });
            fetchAll();
          } else { setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: data.error, action: null }); }
        } catch { setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'ระบบขัดข้อง', action: null }); }
      }
    });
  };

  if (loading) return <div className="text-center pt-32 text-gray-400">กำลังโหลดคลังตั๋ว...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg}
        onClose={() => setModal({ ...modal, open: false })}
        onConfirm={modal.type === 'confirm' && modal.action ? modal.action : undefined}
      />

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">คลังตั๋วของฉัน</h1>
          <p className="text-gray-400">คุณมีตั๋วทั้งหมด {tickets.length} ใบ</p>
        </div>
        <Link to="/trade" className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 px-5 py-2.5 rounded-xl font-bold text-sm transition">
          <ShoppingBag size={16} /> ดูตลาด Trade
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 shadow-2xl">
          <Ticket size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl">คุณยังไม่มีตั๋วคอนเสิร์ตเลย</p>
          <Link to="/" className="inline-block mt-6 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-colors">
            ดูคอนเสิร์ตทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {tickets.map((ticket: any) => {
            const concert = ticket.seat.concert;
            const seat = ticket.seat;
            const openTrade = openTradeByTicketId[ticket.id];
            
            // เช็คสถานะ Tradeable หรือ Untradeable
            const isUntradeable = ticket.trade && ticket.trade.status === 'SOLD';
            const maxPrice = Math.floor(seat.price * 0.9); // คำนวณราคา 90% ของราคาเต็ม

            return (
              <div key={ticket.id} className="bg-gradient-to-br from-blue-900/40 to-gray-900 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <Ticket className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 -rotate-12 pointer-events-none" />

                {/* ป้ายแสดงสถานะขวาบน */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                  {openTrade && (
                    <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      กำลังลงขาย ${openTrade.price}
                    </div>
                  )}
                  {isUntradeable ? (
                    <div className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-1 rounded-full font-bold backdrop-blur-md">
                      <ShieldAlert size={12} /> UNTRADEABLE
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2 py-1 rounded-full font-bold backdrop-blur-md">
                      <ShieldCheck size={12} /> TRADEABLE
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start mb-2 relative z-10 pr-24">
                  <Link to={`/event/${concert.id}`} className="group flex items-start gap-2">
                    <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {concert.name}
                    </h3>
                    <ExternalLink size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors mt-1 shrink-0" />
                  </Link>
                </div>

                <div className="text-sm text-gray-400 mb-5 space-y-1 relative z-10">
                  <p className="flex items-center gap-2"><Calendar size={14} /> {concert.date} | {concert.time}</p>
                  <p className="flex items-center gap-2"><MapPin size={14} /> {concert.venue}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-4 flex justify-between items-center border border-white/5 mb-4 relative z-10">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">โซน {seat.tier}</p>
                    <p className="text-2xl font-extrabold text-blue-400">{seat.row}{seat.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Ticket ID</p>
                    <p className="text-sm font-mono text-gray-300">#{ticket.id.toString().padStart(6, '0')}</p>
                  </div>
                </div>

                {/* ส่วนของปุ่มลงขาย */}
                {openTrade ? (
                  <button onClick={() => handleCancelTrade(openTrade.id)} className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/60 border border-red-700/50 text-red-400 py-2.5 rounded-xl font-bold text-sm transition relative z-10">
                    <X size={14} /> ยกเลิกการลงขาย
                  </button>
                ) : (
                  !isUntradeable && (
                    <div className="flex gap-2 relative z-10">
                      <input
                        type="number" min="1" max={maxPrice}
                        placeholder={`ขายสูงสุด $${maxPrice}`}
                        value={sellPrice[ticket.id] || ''}
                        onChange={e => setSellPrice(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition"
                      />
                      <button onClick={() => handleListForSale(ticket.id, maxPrice)} className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0">
                        <Tag size={14} /> ลงขาย
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}