import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Trash2, Plus, Edit } from 'lucide-react';
import Modal from './Modal';
import { fetchAPI } from '../utils/api';

export default function Home() {
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error' | 'info' | 'confirm', title: '', msg: '', pendingId: null as number | null });

  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    const endpoint = isAdmin ? '/admin/concerts' : '/concerts';
    fetchAPI(endpoint)
      .then(data => { setConcerts(data); setLoading(false); })
      .catch(err => console.error(err));
  }, [isAdmin]);

  const confirmDelete = (id: number) => {
    setModal({ open: true, type: 'confirm', title: 'ยืนยันการลบ', msg: 'คุณแน่ใจหรือไม่ที่จะลบคอนเสิร์ตนี้?', pendingId: id });
  };

  const handleDelete = async () => {
    const id = modal.pendingId;
    if (!id) return;
    
    try {
      await fetchAPI(`/admin/concerts/${id}`, { method: 'DELETE' });
      setConcerts(concerts.filter(c => c.id !== id));
      setModal({ open: true, type: 'success', title: 'สำเร็จ', msg: 'ลบคอนเสิร์ตเรียบร้อยแล้ว', pendingId: null });
    } catch (err: any) {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: err.message || 'ไม่สามารถลบได้', pendingId: null });
    }
  };

  if (loading) return <div className="text-center pt-32 text-gray-400 text-xl">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg} onClose={() => setModal({ ...modal, open: false, pendingId: null })} onConfirm={modal.type === 'confirm' ? handleDelete : undefined} />

      {isAdmin && (
        <div className="flex justify-end">
          <Link to="/admin/concert" className="bg-blue-600 hover:bg-blue-500 transition text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <Plus size={20} /> สร้างคอนเสิร์ต
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {concerts.map(concert => (
          <div key={concert.id} className="relative group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500 transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
            {isAdmin && !concert.isPublished && (
              <div className="absolute top-4 right-4 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full z-20 shadow-lg">DRAFT</div>
            )}
            {isAdmin && (
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <Link to={`/admin/concert/${concert.id}`} className="bg-blue-600/90 hover:bg-blue-500 p-2 rounded-lg text-white shadow-lg"><Edit size={16} /></Link>
                <button onClick={() => confirmDelete(concert.id)} className="bg-red-600/90 hover:bg-red-500 p-2 rounded-lg text-white shadow-lg"><Trash2 size={16} /></button>
              </div>
            )}
            <Link to={`/event/${concert.id}`}>
              <div className="h-56 bg-gray-800">
                <img src={concert.image || 'https://images.unsplash.com/photo-1540039155732-68ee23e15b51?w=800&q=80'} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">{concert.name}</h3>
                <p className="text-gray-400 text-sm flex items-center gap-1"><MapPin size={14} /> {concert.venue}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}