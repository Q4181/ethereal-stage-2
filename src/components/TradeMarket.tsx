import { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Calendar, Tag, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import SeatMap from './SeatMap';
import { fetchAPI } from '../utils/api';

export default function TradeMarket() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])).id : null;

  const [view, setView] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const [concertsWithTrades, setConcertsWithTrades] = useState<any[]>([]);
  const [activeConcert, setActiveConcert] = useState<any>(null);
  const [concertTrades, setConcertTrades] = useState<any[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error' | 'info', title: '', msg: '' });

  const fetchTradeList = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/trades');
      const grouped: { [key: number]: any } = {};
      data.forEach((trade: any) => {
        const concert = trade.ticket.seat.concert;
        
        if (!concert.isPublished) return;

        if (!grouped[concert.id]) grouped[concert.id] = { concert, tradeCount: 0, minPrice: trade.price };
        grouped[concert.id].tradeCount++;
        if (trade.price < grouped[concert.id].minPrice) grouped[concert.id].minPrice = trade.price;
      });
      setConcertsWithTrades(Object.values(grouped));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (view === 'list') fetchTradeList(); }, [view]);

  const handleSelectConcert = async (concertId: number) => {
    setView('map');
    setLoading(true);
    setSelectedTrade(null);
    try {
      const [cData, tData] = await Promise.all([
        fetchAPI(`/concerts/${concertId}`),
        fetchAPI(`/trades?concertId=${concertId}`)
      ]);
      setActiveConcert(cData);
      setConcertTrades(tData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleTradeSeat = (trade: any) => {
    if (trade.sellerId === userId) {
      setModal({ open: true, type: 'info', title: 'ไม่สามารถเลือกได้', msg: 'นี่คือตั๋วที่คุณเป็นคนตั้งขายเองครับ' });
      return;
    }
    if (selectedTrade?.id === trade.id) setSelectedTrade(null);
    else setSelectedTrade(trade);
  };

  if (loading) return <div className="text-center pt-32 text-gray-400">กำลังโหลดข้อมูล...</div>;

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

          <SeatMap 
            concert={activeConcert} 
            mode="trade" 
            selectedTrade={selectedTrade} 
            tradeList={concertTrades} 
            onSeatClick={toggleTradeSeat} 
          />
        </div>

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
          <button disabled={!selectedTrade} onClick={() => navigate('/checkout', { state: { tradeItem: selectedTrade } })} className={`px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg ${selectedTrade ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
            ดำเนินการชำระเงิน
          </button>
        </div>
      </div>
    );
  }

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