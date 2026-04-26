import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from './Modal';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [concert, setConcert] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [modal, setModal] = useState({ open: false, type: 'info' as 'info' | 'error', title: '', msg: '' });

  useEffect(() => {
    fetch(`http://localhost:5000/api/concerts/${id}`)
      .then(res => res.json())
      .then(data => setConcert(data));
  }, [id]);

  const toggleSeat = (seat: any) => {
    if (seat.status !== 'AVAILABLE') return;
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    else setSelectedSeats([...selectedSeats, seat]);
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      setModal({ open: true, type: 'info', title: 'แจ้งเตือน', msg: 'กรุณาเลือกที่นั่งอย่างน้อย 1 ที่' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setModal({ open: true, type: 'info', title: 'เข้าสู่ระบบ', msg: 'คุณต้องเข้าสู่ระบบก่อนทำการซื้อตั๋วครับ' });
      return;
    }
    navigate('/checkout', { state: { selectedSeats } });
  };

  if (!concert) return <div className="text-center pt-32 text-gray-400">Loading...</div>;

  // จัดกลุ่มที่นั่งตาม Tier และ Row 
  const groupedSeats = concert.seats?.reduce((acc: any, seat: any) => {
    if (!acc[seat.tier]) acc[seat.tier] = {};
    if (!acc[seat.tier][seat.row]) acc[seat.tier][seat.row] = [];
    acc[seat.tier][seat.row].push(seat);
    return acc;
  }, {}) || {};

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Modal 
        isOpen={modal.open} 
        type={modal.type} 
        title={modal.title} 
        message={modal.msg} 
        onClose={() => {
          setModal({ ...modal, open: false });
          if (modal.msg.includes('เข้าสู่ระบบ')) navigate('/login');
        }} 
      />
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
        
        {/* รูปภาพคอนเสิร์ตด้านบนชื่อ */}
        <div className="w-full h-80 bg-gray-800 rounded-2xl overflow-hidden mb-8 relative">
           <img src={concert.image || 'https://images.unsplash.com/photo-1540039155732-68ee23e15b51?w=1200&q=80'} alt={concert.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-2">{concert.name}</h1>
        <p className="text-blue-400 font-bold mb-6">{concert.date} | {concert.venue}</p>
        
        {/* แสดงรายละเอียดโดยให้รองรับการเว้นบรรทัด (whitespace-pre-line) */}
        {concert.description && (
          <p className="text-gray-400 mb-12 whitespace-pre-line leading-relaxed">
            {concert.description}
          </p>
        )}

        {/* เวที */}
        <div className="w-full h-16 bg-gradient-to-b from-blue-600/30 to-transparent rounded-t-full border-t border-blue-500/50 mb-16 flex items-center justify-center">
          <span className="text-blue-300 font-bold tracking-[0.5em] text-sm">STAGE</span>
        </div>

        {/* เรนเดอร์โซนที่นั่งแบบแถวยาว (Overflow X) */}
        {Object.keys(groupedSeats).map((tierName) => (
          <div key={tierName} className="mb-12">
            <h3 className={`font-bold mb-6 tracking-widest text-sm uppercase text-blue-400 text-center`}>
              {tierName} SECTION
            </h3>
            
            <div className="flex flex-col gap-4 overflow-x-auto pb-6 custom-scrollbar">
              {Object.keys(groupedSeats[tierName]).map(rowName => {
                const seatsInRow = groupedSeats[tierName][rowName].sort((a:any, b:any) => a.number - b.number);
                return (
                  <div key={rowName} className="flex flex-nowrap justify-center gap-2 min-w-max mx-auto px-4">
                    <div className="w-8 flex items-center justify-center font-bold text-gray-500 mr-2">{rowName}</div>
                    
                    {seatsInRow.map((seat: any) => {
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isSold = seat.status !== 'AVAILABLE';
                      return (
                        <button 
                          key={seat.id} onClick={() => toggleSeat(seat)} disabled={isSold}
                          title={`แถว ${seat.row} ที่นั่ง ${seat.number} ($${seat.price})`}
                          className={`w-10 h-10 rounded font-bold text-xs transition-all flex items-center justify-center flex-shrink-0 ${
                            isSold ? 'bg-gray-800 text-gray-700 cursor-not-allowed' :
                            isSelected ? `bg-blue-500 text-white scale-110 shadow-lg` :
                            `bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-600`
                          }`}
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

      <div className="sticky bottom-8 bg-gray-800/90 backdrop-blur-md border border-gray-700 p-6 rounded-2xl flex justify-between items-center shadow-2xl">
        <div>
          <p className="text-gray-400 text-sm">เลือกแล้ว {selectedSeats.length} ที่นั่ง</p>
          <p className="text-3xl font-extrabold text-white">${selectedSeats.reduce((sum, s) => sum + s.price, 0)}</p>
        </div>
        <button onClick={handleProceed} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg">
          ดำเนินการชำระเงิน
        </button>
      </div>
    </div>
  );
}