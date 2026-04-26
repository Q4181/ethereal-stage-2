import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Calendar, MapPin, Tag, ArrowRight, AlertCircle } from 'lucide-react';
import Modal from './Modal';

export default function TradeMarket() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    title: '',
    msg: '',
    pendingTradeId: null as number | null,
  });

  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch { return null; }
  })();

  const fetchTrades = () => {
    fetch('http://localhost:5000/api/trades')
      .then(res => res.json())
      .then(data => { setTrades(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTrades(); }, []);

  const handleBuyRequest = (trade: any) => {
    if (!localStorage.getItem('token')) {
      setModal({ open: true, type: 'info', title: 'เข้าสู่ระบบ', msg: 'กรุณาเข้าสู่ระบบก่อนซื้อตั๋ว', pendingTradeId: null });
      return;
    }
    setModal({
      open: true,
      type: 'confirm',
      title: 'ยืนยันการซื้อตั๋ว',
      msg: `ต้องการซื้อ ${trade.ticket.seat.concert.name}\nแถว ${trade.ticket.seat.row} ที่นั่ง ${trade.ticket.seat.number} (${trade.ticket.seat.tier})\nในราคา ฿${trade.price.toLocaleString()} ใช่หรือไม่?`,
      pendingTradeId: trade.id,
    });
  };

  const confirmBuy = async () => {
    const tradeId = modal.pendingTradeId;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/trades/${tradeId}/buy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setModal({ open: true, type: 'success', title: 'ซื้อสำเร็จ! 🎉', msg: 'ตั๋วถูกโอนเข้าคลังของคุณเรียบร้อยแล้ว', pendingTradeId: null });
        fetchTrades();
      } else {
        setModal({ open: true, type: 'error', title: 'เกิดข้อผิดพลาด', msg: data.error, pendingTradeId: null });
      }
    } catch {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'ระบบขัดข้อง', pendingTradeId: null });
    }
  };

  const handleModalClose = () => {
    const wasConfirm = modal.type === 'confirm';
    setModal({ ...modal, open: false });
    if (modal.msg.includes('เข้าสู่ระบบ')) navigate('/login');
    if (modal.type === 'success' && modal.title.includes('ซื้อสำเร็จ')) navigate('/inventory');
  };

  if (loading) return <div className="text-center pt-32 text-gray-400 text-xl">กำลังโหลดตลาด Trade...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Modal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.msg}
        onClose={handleModalClose}
        onConfirm={modal.type === 'confirm' ? confirmBuy : undefined}
      />

      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">ตลาดซื้อขายตั๋ว</h1>
          <p className="text-gray-400">ซื้อตั๋วมือสองจากผู้ใช้คนอื่น หรือ <Link to="/inventory" className="text-blue-400 hover:underline">ลงขายตั๋วของคุณ</Link></p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">{trades.length} รายการที่เปิดขายอยู่</p>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-16 text-center shadow-2xl">
          <ShoppingBag size={64} className="mx-auto mb-4 text-gray-700" />
          <p className="text-xl text-gray-500 mb-2">ยังไม่มีตั๋วในตลาดขณะนี้</p>
          <p className="text-gray-600 text-sm">คุณสามารถนำตั๋วของคุณมาลงขายได้จากหน้าคลังตั๋ว</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trades.map((trade: any) => {
            const concert = trade.ticket.seat.concert;
            const seat = trade.ticket.seat;
            const isOwn = currentUserId === trade.seller.id;

            return (
              <div
                key={trade.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all group"
              >
                {/* Concert image */}
                <div className="relative h-40 bg-gray-800 overflow-hidden">
                  <img
                    src={concert.image || 'https://images.unsplash.com/photo-1540039155732-68ee23e15b51?w=800&q=80'}
                    alt={concert.name}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <span className="bg-blue-600/90 text-white text-xs px-3 py-1 rounded-full font-bold">{seat.tier}</span>
                    {isOwn && (
                      <span className="bg-yellow-500/90 text-black text-xs px-3 py-1 rounded-full font-bold">ตั๋วของคุณ</span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-3 line-clamp-1">{concert.name}</h3>
                  
                  <div className="text-sm text-gray-400 space-y-1 mb-4">
                    <p className="flex items-center gap-2"><Calendar size={13} /> {concert.date} | {concert.time}</p>
                    <p className="flex items-center gap-2"><MapPin size={13} /> {concert.venue}</p>
                    <p className="flex items-center gap-2"><Tag size={13} /> แถว {seat.row} ที่ {seat.number}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">ราคาขาย</p>
                      <p className="text-2xl font-extrabold text-green-400">฿{trade.price.toLocaleString()}</p>
                    </div>
                    {isOwn ? (
                      <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-3 py-2 rounded-xl">กำลังลงขาย</span>
                    ) : (
                      <button
                        onClick={() => handleBuyRequest(trade)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                      >
                        ซื้อเลย <ArrowRight size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 mt-3">
                    ผู้ขาย: {trade.seller.email.split('@')[0]}***
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice */}
      <div className="mt-10 flex items-start gap-3 bg-blue-950/30 border border-blue-900/50 rounded-2xl p-5 text-sm text-gray-400">
        <AlertCircle size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p>ตลาด Trade เป็นพื้นที่ซื้อขายระหว่าง User การโอนตั๋วจะเกิดขึ้นทันทีหลังยืนยัน ไม่สามารถยกเลิกได้หลังจากซื้อแล้ว</p>
      </div>
    </div>
  );
}
