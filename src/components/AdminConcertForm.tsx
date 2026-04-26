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
    const newSeats = [];
    for (let i = 1; i <= seatInput.count; i++) {
      newSeats.push({ row: seatInput.row, number: i, tier: seatInput.tier, price: Number(seatInput.price) });
    }
    setSeats([...seats, ...newSeats]);
  };

  const handleSaveConcert = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg} onClose={() => {
          setModal({ ...modal, open: false });
          if (modal.type === 'success') navigate('/');
        }} 
      />
      <h1 className="text-4xl font-extrabold mb-8 text-blue-500">{id ? 'แก้ไขคอนเสิร์ต' : 'สร้างคอนเสิร์ตใหม่'}</h1>
      
      <form onSubmit={handleSaveConcert} className="space-y-8 bg-gray-900 p-8 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <label className="text-sm font-bold">สถานะการแสดงผล:</label>
          <button type="button" onClick={() => setFormData({...formData, isPublished: !formData.isPublished})} className={`px-4 py-2 rounded font-bold transition ${formData.isPublished ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
            {formData.isPublished ? 'PUBLIC (เปิดขายให้คนทั่วไป)' : 'PRIVATE (ร่างแบบ / ซ่อนไว้ก่อน)'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">ชื่อคอนเสิร์ต</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-gray-800 rounded-lg text-white" /></div>
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">รายละเอียด (เว้นบรรทัดได้)</label><textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-gray-800 rounded-lg text-white whitespace-pre-line" rows={6}></textarea></div>
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">URL รูปภาพ</label><input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder:text-gray-600" placeholder="https://..." /></div>
          <div><label className="block text-sm text-gray-400 mb-1">วันที่</label><input required type="text" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-gray-800 rounded-lg text-white" /></div>
          <div><label className="block text-sm text-gray-400 mb-1">เวลา</label><input required type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-gray-800 rounded-lg text-white" /></div>
          <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">สถานที่</label><input required type="text" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full p-3 bg-gray-800 rounded-lg text-white" /></div>
        </div>

        {!id && (
          <div className="border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">จัดที่นั่งและราคา</h2>
            <div className="flex flex-wrap gap-4 items-end bg-gray-800 p-4 rounded-xl">
              <div><label className="block text-xs text-gray-400 mb-1">โซน</label><input type="text" value={seatInput.tier} onChange={e => setSeatInput({...seatInput, tier: e.target.value})} className="w-24 p-2 bg-gray-700 rounded text-white" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">ราคา ($)</label><input type="number" value={seatInput.price} onChange={e => setSeatInput({...seatInput, price: Number(e.target.value)})} className="w-20 p-2 bg-gray-700 rounded text-white" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">ชื่อแถว</label><input type="text" value={seatInput.row} onChange={e => setSeatInput({...seatInput, row: e.target.value})} className="w-16 p-2 bg-gray-700 rounded text-white text-center" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">จำนวนที่นั่ง</label><input type="number" value={seatInput.count} onChange={e => setSeatInput({...seatInput, count: Number(e.target.value)})} className="w-20 p-2 bg-gray-700 rounded text-white text-center" /></div>
              <button type="button" onClick={handleAddSeats} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold">+ เพิ่มแถว</button>
            </div>
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold text-xl transition shadow-lg">
          {id ? 'บันทึกการแก้ไข' : 'บันทึกคอนเสิร์ต'}
        </button>
      </form>
    </div>
  );
}