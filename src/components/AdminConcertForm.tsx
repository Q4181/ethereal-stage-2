import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function AdminConcertForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', description: '', date: '', time: '', venue: '', image: '', isPublished: false
  });
  
  const [seats, setSeats] = useState<any[]>([]);
  const [seatInput, setSeatInput] = useState({ tier: 'VIP', price: 2500, row: 'A', count: 5 });
  const [modal, setModal] = useState({ open: false, type: 'success' as 'success' | 'error', title: '', msg: '' });

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/concerts/${id}`)
        .then(res => res.json())
        .then(data => setFormData({
          name: data.name,
          description: data.description || '',
          date: data.date,
          time: data.time,
          venue: data.venue,
          image: data.image || '',
          isPublished: data.isPublished
        }));
    }
  }, [id]);

  const handleAddSeats = () => {
    const newSeats = [];
    for (let i = 1; i <= seatInput.count; i++) {
      newSeats.push({
        row: seatInput.row.toUpperCase(),
        number: i,
        tier: seatInput.tier,
        price: Number(seatInput.price),
        status: 'AVAILABLE'
      });
    }
    setSeats(prev => [...prev, ...newSeats]);
    // เลื่อน row ไปตัวถัดไปอัตโนมัติ
    setSeatInput(prev => ({
      ...prev,
      row: String.fromCharCode(prev.row.toUpperCase().charCodeAt(0) + 1)
    }));
  };

  const handleRemoveRow = (rowName: string, tier: string) => {
    setSeats(prev => prev.filter(s => !(s.row === rowName && s.tier === tier)));
  };

  const handleSaveConcert = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!id && seats.length === 0) {
      setModal({ open: true, type: 'error', title: 'แจ้งเตือน', msg: 'กรุณาเพิ่มที่นั่งอย่างน้อย 1 แถวก่อนบันทึก' });
      return;
    }

    try {
      const url = id ? `http://localhost:5000/api/admin/concerts/${id}` : 'http://localhost:5000/api/admin/concerts';
      const method = id ? 'PUT' : 'POST';
      const body = id ? formData : { ...formData, customSeats: seats };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setModal({ open: true, type: 'success', title: 'สำเร็จ', msg: id ? 'อัปเดตข้อมูลสำเร็จ!' : 'สร้างคอนเสิร์ตสำเร็จ!' });
      } else {
        setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: data.error });
      }
    } catch (err) {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'ระบบขัดข้อง' });
    }
  };

  // จัดกลุ่มที่นั่งตาม tier + row เพื่อแสดง preview
  const groupedSeats = seats.reduce((acc: any, seat) => {
    const key = `${seat.tier}__${seat.row}`;
    if (!acc[key]) acc[key] = { tier: seat.tier, row: seat.row, count: 0, price: seat.price };
    acc[key].count++;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <Modal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.msg}
        onClose={() => {
          setModal({ ...modal, open: false });
          if (modal.type === 'success') navigate('/');
        }}
      />
      <h1 className="text-4xl font-extrabold mb-8 text-blue-500">{id ? 'แก้ไขคอนเสิร์ต' : 'สร้างคอนเสิร์ตใหม่'}</h1>

      <form onSubmit={handleSaveConcert} className="space-y-8 bg-gray-900 p-8 rounded-2xl border border-gray-800">

        {/* สถานะ */}
        <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <label className="text-sm font-bold">สถานะ:</label>
          <button type="button" onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
            className={`px-4 py-2 rounded font-bold transition ${formData.isPublished ? 'bg-green-600' : 'bg-yellow-600'}`}>
            {formData.isPublished ? '✅ PUBLIC — เปิดขายแล้ว' : '🔒 PRIVATE — ยังไม่เปิดขาย'}
          </button>
        </div>

        {/* ข้อมูลคอนเสิร์ต */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">ชื่อคอนเสิร์ต</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">รายละเอียด</label>
            <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none" rows={4} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">URL รูปภาพ</label>
            <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">วันที่ (เช่น 24 Dec 2024)</label>
            <input required type="text" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">เวลา (เช่น 19:00)</label>
            <input required type="text" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">สถานที่</label>
            <input required type="text" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none" />
          </div>
        </div>

        {/* ส่วนจัดที่นั่ง (เฉพาะโหมดสร้างใหม่) */}
        {!id && (
          <div className="border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">จัดที่นั่งและราคา</h2>

            {/* Input เพิ่มแถว */}
            <div className="flex flex-wrap gap-3 items-end bg-gray-800 p-4 rounded-xl border border-gray-700 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">โซน</label>
                <input type="text" value={seatInput.tier} onChange={e => setSeatInput({ ...seatInput, tier: e.target.value })}
                  className="w-24 p-2 bg-gray-700 rounded text-white border border-gray-600 outline-none focus:border-blue-500" placeholder="VIP" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">ราคา (฿)</label>
                <input type="number" min="0" value={seatInput.price} onChange={e => setSeatInput({ ...seatInput, price: Number(e.target.value) })}
                  className="w-24 p-2 bg-gray-700 rounded text-white border border-gray-600 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">ชื่อแถว</label>
                <input type="text" maxLength={2} value={seatInput.row} onChange={e => setSeatInput({ ...seatInput, row: e.target.value.toUpperCase() })}
                  className="w-16 p-2 bg-gray-700 rounded text-white text-center border border-gray-600 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">จำนวนที่นั่ง</label>
                <input type="number" min="1" max="100" value={seatInput.count} onChange={e => setSeatInput({ ...seatInput, count: Number(e.target.value) })}
                  className="w-20 p-2 bg-gray-700 rounded text-white text-center border border-gray-600 outline-none focus:border-blue-500" />
              </div>
              <button type="button" onClick={handleAddSeats}
                className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-bold transition">
                + เพิ่มแถว
              </button>
            </div>

            {/* Preview ที่นั่งที่เพิ่มแล้ว */}
            {Object.keys(groupedSeats).length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 mb-2">ที่นั่งที่เพิ่มแล้ว ({seats.length} ที่นั่ง)</p>
                {Object.values(groupedSeats).map((g: any) => (
                  <div key={`${g.tier}-${g.row}`} className="flex justify-between items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">{g.tier}</span>
                      <span className="text-white font-bold">แถว {g.row}</span>
                      <span className="text-gray-400 text-sm">{g.count} ที่นั่ง</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400 font-bold">฿{g.price.toLocaleString()}</span>
                      <button type="button" onClick={() => handleRemoveRow(g.row, g.tier)}
                        className="text-red-500 hover:text-red-400 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 border border-dashed border-gray-700 rounded-xl">
                ยังไม่มีที่นั่ง — กรอกข้อมูลแล้วกด + เพิ่มแถว
              </div>
            )}
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold text-xl transition shadow-lg">
          {id ? 'บันทึกการแก้ไข' : `บันทึกคอนเสิร์ต (${seats.length} ที่นั่ง)`}
        </button>
      </form>
    </div>
  );
}
