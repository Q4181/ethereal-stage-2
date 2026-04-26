import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from './Modal';
import SeatMap from './SeatMap';
import { fetchAPI } from '../utils/api';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [concert, setConcert] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [modal, setModal] = useState({ open: false, type: 'info' as 'info' | 'error', title: '', msg: '' });

  useEffect(() => {
    fetchAPI(`/concerts/${id}`)
      .then(data => setConcert(data))
      .catch(() => setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'โหลดข้อมูลคอนเสิร์ตไม่สำเร็จ' }));
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
    if (!localStorage.getItem('token')) {
      setModal({ open: true, type: 'info', title: 'เข้าสู่ระบบ', msg: 'คุณต้องเข้าสู่ระบบก่อนทำการซื้อตั๋วครับ' });
      return;
    }
    navigate('/checkout', { state: { selectedSeats } });
  };

  if (!concert) return <div className="text-center pt-32 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg} onClose={() => {
        setModal({ ...modal, open: false });
        if (modal.msg.includes('เข้าสู่ระบบ')) navigate('/login');
      }} />
      
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
        <div className="w-full h-80 bg-gray-800 rounded-2xl overflow-hidden mb-8 relative">
           <img src={concert.image || 'https://images.unsplash.com/photo-1540039155732-68ee23e15b51?w=1200&q=80'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-2">{concert.name}</h1>
        <p className="text-blue-400 font-bold mb-6">{concert.date} | {concert.venue}</p>
        
        {concert.description && (
          <p className="text-gray-400 mb-12 whitespace-pre-line leading-relaxed">{concert.description}</p>
        )}

        {/* โค้ดผังที่นั่งเหลือแค่นี้! */}
        <SeatMap 
          concert={concert} 
          mode="normal" 
          selectedSeats={selectedSeats} 
          onSeatClick={toggleSeat} 
        />
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