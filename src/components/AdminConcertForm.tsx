import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from './Modal';
import { fetchAPI } from '../utils/api';

export default function AdminConcertForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', description: '', date: '', time: '', venue: '', image: '', isPublished: false });
  const [seats, setSeats] = useState<any[]>([]);
  const [seatInput, setSeatInput] = useState({ tier: 'VIP', price: 2500, row: 'A', count: 20 });
  const [modal, setModal] = useState({ open: false, type: 'success' as 'success' | 'error', title: '', msg: '' });

  useEffect(() => {
    if (id) {
      fetchAPI(`/concerts/${id}`)
        .then(data => setFormData({ name: data.name, description: data.description || '', date: data.date, time: data.time, venue: data.venue, image: data.image || '', isPublished: data.isPublished }))
        .catch(() => setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'โหลดข้อมูลเดิมไม่สำเร็จ' }));
    }
  }, [id]);

  const handleAddSeats = () => {
    const exists = seats.some(s => s.tier === seatInput.tier && s.row === seatInput.row.toUpperCase());
    if (exists) {
      setModal({ open: true, type: 'error', title: 'ข้อมูลซ้ำ', msg: `โซน ${seatInput.tier} แถว ${seatInput.row.toUpperCase()} ถูกเพิ่มไปแล้วครับ` });
      return;
    }

    const newSeats = [];
    for (let i = 1; i <= seatInput.count; i++) {
      newSeats.push({ 
        row: seatInput.row.toUpperCase(), 
        number: i, 
        tier: seatInput.tier, 
        price: Number(seatInput.price) 
      });
    }
    setSeats([...seats, ...newSeats]);

    
    const nextRowChar = String.fromCharCode(seatInput.row.toUpperCase().charCodeAt(0) + 1);
    setSeatInput({ ...seatInput, row: nextRowChar });
  };

  const handleRemoveRow = (tier: string, row: string) => {
    setSeats(seats.filter(s => !(s.tier === tier && s.row === row)));
  };

  const handleSaveConcert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id && seats.length === 0) {
      setModal({ open: true, type: 'error', title: 'แจ้งเตือน', msg: 'กรุณาเพิ่มที่นั่งอย่างน้อย 1 แถว' });
      return;
    }

    try {
      const endpoint = id ? `/admin/concerts/${id}` : '/admin/concerts';
      const body = id ? formData : { ...formData, customSeats: seats };

      await fetchAPI(endpoint, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      
      setModal({ open: true, type: 'success', title: 'สำเร็จ', msg: id ? 'อัปเดตข้อมูลสำเร็จ!' : 'สร้างคอนเสิร์ตสำเร็จ!' });
    } catch (err: any) { 
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: err.message || 'ระบบขัดข้อง' }); 
    }
  };

  // จัดกลุ่มที่นั่งเพื่อมาแสดงเป็นสรุปรายการ
  const groupedSummary = Object.entries(
    seats.reduce((acc: any, seat: any) => {
      const key = `${seat.tier}-${seat.row}`;
      if (!acc[key]) acc[key] = { tier: seat.tier, row: seat.row, price: seat.price, count: 0 };
      acc[key].count++;
      return acc;
    }, {})
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg} onClose={() => {
          setModal({ ...modal, open: false });
          if (modal.type === 'success') navigate('/');
        }} 
      />
      <h1 className="text-4xl font-extrabold mb-8 text-purple-500">{id ? 'แก้ไขคอนเสิร์ต' : 'สร้างคอนเสิร์ตใหม่'}</h1>
      
      <form onSubmit={handleSaveConcert} className="space-y-8 bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <label className="text-sm font-bold text-gray-300">สถานะการแสดงผล:</label>
          <button type="button" onClick={() => setFormData({...formData, isPublished: !formData.isPublished})} className={`px-4 py-2 rounded font-bold transition shadow-lg ${formData.isPublished ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
            {formData.isPublished ? 'PUBLIC (เปิดขายให้คนทั่วไป)' : 'PRIVATE (ร่างแบบ / ซ่อนไว้ก่อน)'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1 font-bold">ชื่อคอนเสิร์ต</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none rounded-lg text-white transition" /></div>
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1 font-bold">รายละเอียด (เว้นบรรทัดได้)</label><textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none rounded-lg text-white whitespace-pre-line transition" rows={4}></textarea></div>
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1 font-bold">URL รูปภาพโปสเตอร์</label><input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none rounded-lg text-white placeholder:text-gray-600 transition" placeholder="https://..." /></div>
          <div><label className="block text-sm text-gray-400 mb-1 font-bold">วันที่</label><input required type="text" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none rounded-lg text-white transition" placeholder="e.g. 24 Dec 2024" /></div>
          <div><label className="block text-sm text-gray-400 mb-1 font-bold">เวลา</label><input required type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none rounded-lg text-white transition" placeholder="e.g. 19:00" /></div>
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1 font-bold">สถานที่จัดงาน</label><input required type="text" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none rounded-lg text-white transition" /></div>
        </div>

        {!id && (
          <div className="border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">จัดที่นั่งและราคา</h2>
            <div className="flex flex-wrap gap-4 items-end bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-inner">
              <div><label className="block text-xs text-gray-400 mb-1 font-bold">โซน (Tier)</label><input type="text" value={seatInput.tier} onChange={e => setSeatInput({...seatInput, tier: e.target.value})} className="w-24 p-3 bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none rounded text-white transition" /></div>
              <div><label className="block text-xs text-gray-400 mb-1 font-bold">ราคา ($)</label><input type="number" value={seatInput.price} onChange={e => setSeatInput({...seatInput, price: Number(e.target.value)})} className="w-24 p-3 bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none rounded text-white transition" /></div>
              <div><label className="block text-xs text-gray-400 mb-1 font-bold">อักษรแถว</label><input type="text" maxLength={2} value={seatInput.row} onChange={e => setSeatInput({...seatInput, row: e.target.value})} className="w-16 p-3 bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none rounded text-white text-center transition" /></div>
              <div><label className="block text-xs text-gray-400 mb-1 font-bold">จำนวนเก้าอี้</label><input type="number" min={1} value={seatInput.count} onChange={e => setSeatInput({...seatInput, count: Number(e.target.value)})} className="w-20 p-3 bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none rounded text-white text-center transition" /></div>
              <button type="button" onClick={handleAddSeats} className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-extrabold transition shadow-lg">+ เพิ่มแถว</button>
            </div>

            {/* แสดงสรุปแถวที่ถูกเพิ่มแล้วแบบเป็นระเบียบ */}
            {seats.length > 0 && (
              <div className="mt-6">
                <p className="text-gray-400 text-sm font-bold mb-3 flex items-center gap-2">
                  <span className="bg-purple-600 w-2 h-2 rounded-full"></span> สรุปที่นั่งที่สร้างไว้ทั้งหมด ({seats.length} ที่นั่ง)
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {groupedSummary.map(([key, group]: any) => (
                    <div key={key} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div>
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold mr-3">{group.tier}</span>
                        <span className="text-white font-bold text-lg">แถว {group.row}</span>
                        <span className="text-gray-400 text-sm ml-3">({group.count} ที่นั่ง)</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-yellow-400 font-bold">${group.price}</span>
                        <button type="button" onClick={() => handleRemoveRow(group.tier, group.row)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1 rounded transition text-sm font-bold">ลบ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl text-white font-extrabold text-xl transition shadow-[0_0_20px_rgba(22,163,74,0.3)] border border-green-500">
          {id ? 'บันทึกการแก้ไข' : 'ยืนยันการสร้างคอนเสิร์ต'}
        </button>
      </form>
    </div>
  );
}