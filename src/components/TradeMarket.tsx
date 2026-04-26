import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TradeMarket() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])).id : null;

  useEffect(() => {
    fetch('http://localhost:5000/api/trades')
      .then(res => res.json())
      .then(data => { setTrades(data); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="text-center pt-32 text-gray-400">กำลังโหลดตลาด Trade...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-6">
        <ShoppingBag className="text-yellow-500 w-10 h-10" />
        <div>
          <h1 className="text-4xl font-extrabold text-white">ตลาด Trade</h1>
          <p className="text-gray-400 mt-1">ซื้อขายตั๋วคอนเสิร์ตระหว่างผู้ใช้งาน</p>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 rounded-3xl border border-gray-800">
          <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-500 font-bold">ยังไม่มีตั๋ววางขายในขณะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trades.map(trade => {
            const concert = trade.ticket.seat.concert;
            const seat = trade.ticket.seat;
            const isOwner = trade.sellerId === userId;

            return (
              <div key={trade.id} className="bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-2xl p-6 transition-all shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{concert.name}</h3>
                  <div className="text-sm text-gray-400 mb-4 space-y-1">
                    <p className="flex items-center gap-2"><Calendar size={14} /> {concert.date}</p>
                    <p className="flex items-center gap-2"><MapPin size={14} /> {concert.venue}</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center mb-6">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">{seat.tier}</p>
                      <p className="text-lg font-bold text-blue-400">แถว {seat.row} ที่ {seat.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">ราคาขาย</p>
                      <p className="text-2xl font-extrabold text-yellow-400">${trade.price}</p>
                    </div>
                  </div>
                </div>

                {/* เปลี่ยนปุ่มกดซื้อให้ Navigate ไปหน้า Payment พร้อมแนบข้อมูลไปด้วย */}
                {isOwner ? (
                  <button disabled className="w-full bg-gray-800 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed">
                    ตั๋วของคุณ
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/checkout', { state: { tradeItem: trade } })}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition shadow-lg flex justify-center items-center gap-2"
                  >
                    <ShoppingBag size={18} /> ซื้อตั๋วใบนี้
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}