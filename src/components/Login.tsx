import React, { useState } from 'react';
import Modal from './Modal';

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false); // ควบคุมการสลับโหมด
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error', title: '', msg: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // เช็คกรณีสมัครสมาชิกแล้วพิมพ์รหัสผ่านไม่ตรงกัน
    if (isRegisterMode && password !== confirmPassword) {
      setModal({ open: true, type: 'error', title: 'แจ้งเตือน', msg: 'กรุณากรอกรหัสผ่านให้ตรงกันทั้ง 2 ช่อง' });
      return;
    }

    const url = isRegisterMode ? 'http://localhost:5000/api/register' : 'http://localhost:5000/api/login';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        setModal({ 
          open: true, 
          type: 'success', 
          title: 'สำเร็จ!', 
          msg: isRegisterMode ? 'สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเรียบร้อยแล้ว' 
        });
      } else {
        setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: data.error });
      }
    } catch (err) {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
    }
  };

  return (
    <div className="min-h-[80vh] flex justify-center items-center px-6">
      <Modal 
        isOpen={modal.open} 
        type={modal.type} 
        title={modal.title} 
        message={modal.msg} 
        onClose={() => {
          setModal({ ...modal, open: false });
          // ใช้ window.location.href แทน navigate เพื่อให้ NavBar รู้ตัวว่าเราล็อกอินแล้ว
          if (modal.type === 'success') window.location.href = '/'; 
        }} 
      />

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 p-10 rounded-3xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-white">
          {isRegisterMode ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
        </h2>
        <p className="text-gray-500 text-center mb-8">
          {isRegisterMode ? 'กรอกข้อมูลเพื่อสมัครสมาชิก' : 'เพื่อดำเนินการจองตั๋วคอนเสิร์ต'}
        </p>
        
        <div className="mb-5">
          <label className="block text-gray-400 text-sm font-bold mb-2">อีเมล</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500 transition" />
        </div>
        
        <div className={isRegisterMode ? "mb-5" : "mb-8"}>
          <label className="block text-gray-400 text-sm font-bold mb-2">รหัสผ่าน</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500 transition" />
        </div>

        {isRegisterMode && (
          <div className="mb-8">
            <label className="block text-gray-400 text-sm font-bold mb-2">ยืนยันรหัสผ่านอีกครั้ง</label>
            <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500 transition" />
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold text-lg transition shadow-lg shadow-blue-600/30 mb-6">
          {isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>

        <div className="text-center text-gray-400 text-sm">
          {isRegisterMode ? 'มีบัญชีอยู่แล้วใช่ไหม? ' : 'ยังไม่มีบัญชีใช่ไหม? '}
          <button 
            type="button" 
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }} 
            className="text-blue-500 hover:text-blue-400 font-bold underline"
          >
            {isRegisterMode ? 'เข้าสู่ระบบที่นี่' : 'สมัครสมาชิกที่นี่'}
          </button>
        </div>
      </form>
    </div>
  );
}