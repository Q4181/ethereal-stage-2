import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Calendar, Tag, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

export default function TradeMarket() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])).id : null;

  // State สำหรับคุมหน้าจอ (list = ดูรายชื่อคอนเสิร์ต, map = ดูผังที่นั่ง)
  const [view, setView] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [concertsWithTrades, setConcertsWithTrades] = useState<any[]>([]);
  const [activeConcert, setActiveConcert] = useState<any>(null);
  const [concertTrades, setConcertTrades] = useState<any[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error' | 'info', title: '', msg: '' });

  // 1. ดึงข้อมูล Trade ทั้งหมดมาจัดกลุ่มตามคอนเสิร์ต (สำหรับหน้า List)
  const fetchTradeList = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/trades');
      const data = await res.json();
      
      // จัดกลุ่ม Trade ตาม ID ของคอนเสิร์ต
      const grouped: { [key: number]: any } = {};
      data.forEach((trade: any) => {
        const concert = trade.ticket.seat.concert;
        if (!grouped[concert.id]) {
          grouped[concert.id] = { concert, tradeCount: 0, minPrice: trade.price };
        }
        grouped[concert.id].tradeCount++;
        if (trade.price < grouped[concert.id].minPrice) {
          grouped[concert.id].minPrice = trade.price;
        }
      });
      setConcertsWithTrades(Object.values(grouped));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'list') fetchTradeList();
  }, [view]);

  // 2. เมื่อกดเลือกคอนเสิร์ต ให้โหลดผังที่นั่งและ Trade ของคอนเสิร์ตนั้น
  const handleSelectConcert = async (concertId: number) => {
    setView('map');
    setLoading(true);
    setSelectedTrade(null);
    try {
      // ดึงผังที่นั่งเต็มๆ
      const cRes = await fetch(`http://localhost:5000/api/concerts/${concertId}`);
      const cData = await cRes.json();
      setActiveConcert(cData);

      // ดึง Trade เฉพาะของคอนเสิร์ตนี้
      const tRes = await fetch(`http://localhost:5000/api/trades?concertId=${concertId}`);
      const tData = await tRes.json();
      setConcertTrades(tData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // จัดกลุ่มที่นั่งเพื่อเรนเดอร์ผัง
  const groupedSeats = activeConcert?.seats?.reduce((acc: any, seat: any) => {
    if (!acc[seat.tier]) acc[seat.tier] = {};
    if (!acc[seat.tier][seat.row]) acc[seat.tier][seat.row] = [];
    acc[seat.tier][seat.row].push(seat);
    return acc;
  }, {}) || {};

  // เลือกที่นั่ง Trade
  const toggleTradeSeat = (trade: any) => {
    if (trade.sellerId === userId) {
      setModal({ open: true, type: 'info', title: 'ไม่สามารถเลือกได้', msg: 'นี่คือตั๋วที่คุณเป็นคนตั้งขายเองครับ' });
      return;
    }
    // ถ้ากดซ้ำอันเดิม ให้ยกเลิกการเลือก
    if (selectedTrade?.id === trade.id) setSelectedTrade(null);
    else setSelectedTrade(trade);
  };

  // ไปหน้าชำระเงิน
  const handleProceed = () => {
    if (!selectedTrade) return;
    navigate('/checkout', { state: { tradeItem: selectedTrade } });
  };

  if (loading) return <div className="text-center pt-32 text-gray-400">กำลังโหลดข้อมูล...</div>;

  // ================= VIEW: MAP (ผังที่นั่ง Trade) =================
  if (view === 'map' && activeConcert) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg} onClose={() => setModal({ ...modal, open: false })} />
        
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-400 hover:text-white transition font-bold mb-6 bg-gray-900 px-4 py-2 rounded-xl">
          <ArrowLeft size={18} /> กลับไปหน้าตลาด Trade
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
          <div className="flex items-start justify-between mb-8">
            <div>
              <span className="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block shadow-lg shadow-yellow-600/20">TRADE MARKET ZONE</span>
              <h1 className="text-4xl font-extrabold text-white mb-2">{activeConcert.name}</h1>
              <p className="text-blue-400 font-bold">{activeConcert.date} | {activeConcert.venue}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl text-sm border border-gray-700">
              <p className="text-white font-bold mb-2 flex items-center gap-2"><Info size={16}/> สัญลักษณ์ที่นั่ง</p>
              <div className="flex items-center gap-2 text-gray-400 mb-1"><div className="w-4 h-4 bg-green-600 rounded"></div> ว่างสำหรับ Trade</div>
              <div className="flex items-center gap-2 text-gray-400 mb-1"><div className="w-4 h-4 bg-yellow-500 rounded"></div> ที่นั่งที่คุณเลือก</div>
              <div className="flex items-center gap-2 text-gray-400"><div className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"></div> ซื้อไม่ได้ / ไม่ได้เปิด Trade</div>
            </div>
          </div>

          {/* เวที */}
          <div className="w-full h-16 bg-gradient-to-b from-yellow-600/20 to-transparent rounded-t-full border-t border-yellow-500/50 mb-16 flex items-center justify-center">
            <span className="text-yellow-300 font-bold tracking-[0.5em] text-sm">STAGE</span>
          </div>

          {/* ผังที่นั่ง */}
          {Object.keys(groupedSeats).map((tierName) => (
            <div key={tierName} className="mb-12">
              <h3 className="font-bold mb-6 tracking-widest text-sm uppercase text-gray-500 text-center">{tierName} SECTION</h3>
              <div className="flex flex-col gap-4 overflow-x-auto pb-6 custom-scrollbar">
                {Object.keys(groupedSeats[tierName]).map(rowName => {
                  const seatsInRow = groupedSeats[tierName][rowName].sort((a:any, b:any) => a.number - b.number);
                  return (
                    <div key={rowName} className="flex flex-nowrap justify-center gap-2 min-w-max mx-auto px-4">
                      <div className="w-8 flex items-center justify-center font-bold text-gray-600 mr-2">{rowName}</div>
                      
                      {seatsInRow.map((seat: any) => {
                        // ค้นหาว่าเบาะนี้มีการตั้ง Trade ไว้ไหม
                        const tradeForSeat = concertTrades.find(t => t.ticket.seatId === seat.id);
                        const isTradeable = !!tradeForSeat;
                        const isSelected = selectedTrade?.id === tradeForSeat?.id;

                        // กำหนดสีปุ่มตามเงื่อนไข
                        let btnClass = "";
                        if (!isTradeable) {
                          btnClass = "bg-gray-800 border-gray-700 text-gray-700 cursor-not-allowed opacity-50"; // สีเทา กดไม่ได้
                        } else if (isSelected) {
                          btnClass = "bg-yellow-500 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10 border-yellow-400"; // สีเหลืองเมื่อถูกเลือก
                        } else {
                          btnClass = "bg-green-600 border-green-500 text-white hover:bg-green-500 hover:scale-105 shadow-[0_0_10px_rgba(22,163,74,0.3)]"; // สีเขียว เปิดขาย Trade
                        }

                        return (
                          <button 
                            key={seat.id} 
                            disabled={!isTradeable}
                            onClick={() => toggleTradeSeat(tradeForSeat)}
                            title={isTradeable ? `ราคา Trade: $${tradeForSeat.price}` : `ไม่ได้เปิด Trade`}
                            className={`w-10 h-10 rounded font-bold text-xs transition-all flex items-center justify-center flex-shrink-0 border ${btnClass}`}
                          >
                            {seat.number}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* แถบสรุปด้านล่าง */}
        <div className="sticky bottom-8 bg-gray-800/95 backdrop-blur-md border border-gray-700 p-6 rounded-2xl flex justify-between items-center shadow-2xl">
          <div>
            <p className="text-gray-400 text-sm mb-1">สถานะการเลือก</p>
            {selectedTrade ? (
              <p className="text-2xl font-extrabold text-yellow-400">
                โซน {selectedTrade.ticket.seat.tier} แถว {selectedTrade.ticket.seat.row} ที่ {selectedTrade.ticket.seat.number} <span className="text-white ml-2">ราคา ${selectedTrade.price}</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-gray-500">กรุณาเลือกที่นั่งสีเขียว 1 ที่</p>
            )}
          </div>
          <button 
            disabled={!selectedTrade}
            onClick={handleProceed} 
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg ${selectedTrade ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
          >
            ดำเนินการชำระเงิน
          </button>
        </div>
      </div>
    );
  }

  // ================= VIEW: LIST (หน้ารวมคอนเสิร์ต) =================
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-6">
        <ShoppingBag className="text-yellow-500 w-10 h-10" />
        <div>
          <h1 className="text-4xl font-extrabold text-white">ตลาด Trade</h1>
          <p className="text-gray-400 mt-1">เลือกคอนเสิร์ตเพื่อดูผังที่นั่งและซื้อตั๋วจากผู้ใช้งานคนอื่น</p>
        </div>
      </div>

      {concertsWithTrades.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 rounded-3xl border border-gray-800">
          <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-500 font-bold">ยังไม่มีตั๋ววางขายในขณะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concertsWithTrades.map(item => (
            <div key={item.concert.id} onClick={() => handleSelectConcert(item.concert.id)} className="bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-2xl p-6 transition-all shadow-xl cursor-pointer group hover:-translate-y-2">
              <div className="h-40 bg-gray-800 rounded-xl overflow-hidden mb-4 relative">
                <img src={item.concert.image || 'https://images.unsplash.com/photo-1540039155732-68ee23e15b51?w=800&q=80'} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  มีตั๋ว Trade {item.tradeCount} ใบ
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{item.concert.name}</h3>
              <div className="text-sm text-gray-400 mb-4 space-y-1">
                <p className="flex items-center gap-2"><Calendar size={14} /> {item.concert.date}</p>
                <p className="flex items-center gap-2"><MapPin size={14} /> {item.concert.venue}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center border border-gray-700 group-hover:border-yellow-500/30 transition-colors">
                <span className="text-gray-400 text-sm font-bold">ราคาเริ่มต้น</span>
                <span className="text-2xl font-extrabold text-yellow-400">${item.minPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}