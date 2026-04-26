import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Ticket, ArrowLeft, Archive, ShoppingBag } from 'lucide-react';
import Modal from './Modal';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error' | 'info' | 'confirm', title: '', msg: '' });

  // 1. ฟังก์ชันนี้เรียกเมื่อกดปุ่ม "ออกจากระบบ" (จะเด้งถามก่อน)
  const handleRequestLogout = () => {
    setModal({ 
      open: true, 
      type: 'confirm', 
      title: 'ยืนยันการออกจากระบบ', 
      msg: 'คุณแน่ใจหรือไม่ที่จะออกจากระบบ?' 
    });
  };

  // 2. ฟังก์ชันนี้เรียกเมื่อกดยืนยันใน Modal
  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setModal({ 
      open: true, 
      type: 'success', 
      title: 'ออกจากระบบสำเร็จ', 
      msg: 'คุณได้ออกจากระบบเรียบร้อยแล้ว' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Modal 
        isOpen={modal.open} 
        type={modal.type} 
        title={modal.title} 
        message={modal.msg} 
        onClose={() => {
          setModal({ ...modal, open: false });
          // รีเฟรชหน้าเว็บเพื่อให้แถบเมนูด้านบนเปลี่ยนสถานะ
          if (modal.title === 'ออกจากระบบสำเร็จ') window.location.href = '/login';
        }} 
        onConfirm={modal.type === 'confirm' ? confirmLogout : undefined}
      />

      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                <ArrowLeft size={20} />
              </button>
            )}
            <Link to="/" className="text-2xl font-extrabold text-blue-500 tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
              <Ticket className="w-8 h-8" /> Magic Ticket
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {token ? (
              <>
                <Link to="/trade" className="flex items-center gap-2 text-gray-400 hover:text-white transition font-bold">
                  <ShoppingBag size={20} /> ตลาด Trade
                </Link>
                <Link to="/inventory" className="flex items-center gap-2 text-gray-400 hover:text-white transition font-bold">
                  <Archive size={20} /> คลังตั๋วของฉัน
                </Link>
                <button onClick={handleRequestLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition font-bold">
                  <LogOut size={20} /> ออกจากระบบ
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition font-bold">
                <User size={20} /> เข้าสู่ระบบ / สมัครสมาชิก
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-grow">{children}</main>
      <footer className="py-8 text-center text-gray-600 border-t border-gray-900 bg-gray-950 mt-12 text-sm">
        Magic ticket.
      </footer>
    </div>
  );
}