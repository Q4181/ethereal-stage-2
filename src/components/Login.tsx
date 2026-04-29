import { useState } from 'react';
import Modal from './Modal';
import { fetchAPI } from '../utils/api';

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modal, setModal] = useState({ open: false, type: 'info' as 'success' | 'error', title: '', msg: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegisterMode) {
      if (password.length < 8) return setModal({ open: true, type: 'error', title: 'แจ้งเตือน', msg: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
      if (password !== confirmPassword) return setModal({ open: true, type: 'error', title: 'แจ้งเตือน', msg: 'กรุณากรอกรหัสผ่านให้ตรงกันทั้ง 2 ช่อง' });
    }

    try {
      const endpoint = isRegisterMode ? '/register' : '/login';
      const data = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      setModal({ open: true, type: 'success', title: 'สำเร็จ!', msg: isRegisterMode ? 'สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเรียบร้อยแล้ว' });
    } catch (err: any) {
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
    }
  };

  return (
    <div className="min-h-[80vh] flex justify-center items-center px-6">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg} onClose={() => {
          setModal({ ...modal, open: false });
          if (modal.type === 'success') window.location.href = '/'; 
        }} 
      />

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 p-10 rounded-3xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-white">{isRegisterMode ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}</h2>
        <p className="text-gray-500 text-center mb-8">{isRegisterMode ? 'กรอกข้อมูลเพื่อสมัครสมาชิก' : 'เพื่อดำเนินการจองตั๋วคอนเสิร์ต'}</p>
        
        <div className="mb-5">
          <label className="block text-gray-400 text-sm font-bold mb-2">อีเมล</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500 transition" />
        </div>
        
        <div className={isRegisterMode ? "mb-5" : "mb-8"}>
          <label className="block text-gray-400 text-sm font-bold mb-2">รหัสผ่าน {isRegisterMode && <span className="text-xs font-normal text-gray-500">(ขั้นต่ำ 8 ตัวอักษร)</span>}</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={isRegisterMode ? 8 : undefined} className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500 transition" />
        </div>

        {isRegisterMode && (
          <div className="mb-8">
            <label className="block text-gray-400 text-sm font-bold mb-2">ยืนยันรหัสผ่านอีกครั้ง</label>
            <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500 transition" />
          </div>
        )}

        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl text-white font-bold text-lg transition shadow-lg mb-6">
          {isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>

        <div className="text-center text-gray-400 text-sm">
          {isRegisterMode ? 'มีบัญชีอยู่แล้วใช่ไหม? ' : 'ยังไม่มีบัญชีใช่ไหม? '}
          <button type="button" onClick={() => { setIsRegisterMode(!isRegisterMode); setEmail(''); setPassword(''); setConfirmPassword(''); }} className="text-purple-500 hover:text-purple-400 font-bold underline">
            {isRegisterMode ? 'เข้าสู่ระบบที่นี่' : 'สมัครสมาชิกที่นี่'}
          </button>
        </div>
      </form>
    </div>
  );
}