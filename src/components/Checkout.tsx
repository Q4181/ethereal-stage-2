import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, ChevronRight, Ticket } from 'lucide-react';
import Modal from './Modal';

type PaymentMethod = 'card' | 'promptpay' | 'truemoney';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // รองรับการรับค่าทั้งจากการจองปกติ (selectedSeats) และจากหน้า Trade (tradeItem)
  const selectedSeats = location.state?.selectedSeats || [];
  const tradeItem = location.state?.tradeItem || null;

  const [step, setStep] = useState<'summary' | 'payment' | 'processing'>('summary');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'error' as 'success' | 'error', title: '', msg: '' });

  const [cardData, setCardData] = useState({
    number: '', name: '', expiry: '', cvv: '',
  });

  // คำนวณราคาให้ถูกต้อง (ถ้าเป็นตั๋ว Trade ใช้ราคา Trade, ถ้าตั๋วปกติเอามาบวกกัน)
  const total = tradeItem ? tradeItem.price : selectedSeats.reduce((sum: number, s: any) => sum + s.price, 0);

  const formatCardNumber = (val: string) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
  };

  const handlePay = async () => {
    if (paymentMethod === 'card') {
      const rawNumber = cardData.number.replace(/\s/g, '');
      if (rawNumber.length < 16) { setModal({ open: true, type: 'error', title: 'ข้อมูลไม่ครบ', msg: 'กรุณากรอกหมายเลขบัตร 16 หลัก' }); return; }
      if (!cardData.name.trim()) { setModal({ open: true, type: 'error', title: 'ข้อมูลไม่ครบ', msg: 'กรุณากรอกชื่อบนบัตร' }); return; }
      if (cardData.expiry.length < 5) { setModal({ open: true, type: 'error', title: 'ข้อมูลไม่ครบ', msg: 'กรุณากรอกวันหมดอายุ (MM/YY)' }); return; }
      if (cardData.cvv.length < 3) { setModal({ open: true, type: 'error', title: 'ข้อมูลไม่ครบ', msg: 'กรุณากรอก CVV 3 หลัก' }); return; }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setModal({ open: true, type: 'error', title: 'แจ้งเตือน', msg: 'กรุณาเข้าสู่ระบบก่อนซื้อตั๋ว' });
      return;
    }

    setStep('processing');
    setLoading(true);
    await new Promise(res => setTimeout(res, 2000)); // จำลอง processing time

    try {
      let response;
      if (tradeItem) {
        // ถ้ายิงมาจากตลาด Trade
        response = await fetch(`http://localhost:5000/api/trades/${tradeItem.id}/buy`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        // ถ้าเป็นการซื้อตั๋วปกติ
        response = await fetch('http://localhost:5000/api/tickets/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ seatIds: selectedSeats.map((s: any) => s.id) })
        });
      }

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        setStep('summary');
        setModal({ open: true, type: 'success', title: 'ชำระเงินสำเร็จ! 🎉', msg: 'ตั๋วของคุณถูกบันทึกเข้าคลังเรียบร้อยแล้ว' });
      } else {
        setStep('payment');
        setModal({ open: true, type: 'error', title: 'เกิดข้อผิดพลาด', msg: data.error });
      }
    } catch {
      setLoading(false);
      setStep('payment');
      setModal({ open: true, type: 'error', title: 'ผิดพลาด', msg: 'ระบบขัดข้อง กรุณาลองใหม่' });
    }
  };

  if (step === 'processing') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xl font-bold text-gray-300">กำลังดำเนินการชำระเงิน...</p>
        <p className="text-gray-500 text-sm">กรุณาอย่าปิดหน้าต่างนี้</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Modal isOpen={modal.open} type={modal.type} title={modal.title} message={modal.msg}
        onClose={() => {
          setModal({ ...modal, open: false });
          if (modal.type === 'success') navigate('/inventory');
          if (modal.msg.includes('เข้าสู่ระบบ')) navigate('/login');
        }}
      />

      <div className="flex items-center gap-3 mb-10 justify-center">
        {(['summary', 'payment'] as const).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-bold ${step === s ? 'text-blue-400' : 'text-gray-600'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{i + 1}</span>
              {s === 'summary' ? 'สรุปรายการ' : 'ชำระเงิน'}
            </div>
            {i < 1 && <ChevronRight size={16} className="text-gray-700" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          {step === 'summary' && (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
              <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3">
                <Ticket className="text-blue-400" /> ที่นั่งที่เลือก
              </h2>
              <div className="space-y-3 mb-8">
                {tradeItem ? (
                  // การ์ดตั๋วรูปแบบ Trade
                  <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded font-bold">TRADE</span>
                      <span className="text-white font-bold">{tradeItem.ticket.seat.concert.name} - แถว {tradeItem.ticket.seat.row} ที่นั่ง {tradeItem.ticket.seat.number}</span>
                    </div>
                    <span className="text-gray-300 font-bold">฿{tradeItem.price.toLocaleString()}</span>
                  </div>
                ) : (
                  // การ์ดตั๋วปกติ
                  selectedSeats.map((seat: any) => (
                    <div key={seat.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">{seat.tier}</span>
                        <span className="text-white font-bold">แถว {seat.row} ที่นั่ง {seat.number}</span>
                      </div>
                      <span className="text-gray-300 font-bold">฿{seat.price.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setStep('payment')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl text-lg transition">
                ดำเนินการชำระเงิน →
              </button>
            </div>
          )}

          {/* ... (ส่วนฟอร์ม Payment Method ของคุณเหมือนเดิมเป๊ะๆ) ... */}
          {step === 'payment' && (
             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
             <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2">
               <CreditCard className="text-blue-400" /> วิธีชำระเงิน
             </h2>

             {/* เลือกวิธีชำระ */}
             <div className="grid grid-cols-3 gap-3 mb-6">
               {[
                 { key: 'card', label: '💳 บัตรเครดิต/เดบิต' },
                 { key: 'promptpay', label: '📱 PromptPay' },
                 { key: 'truemoney', label: '💛 TrueMoney' },
               ].map(m => (
                 <button key={m.key} type="button"
                   onClick={() => setPaymentMethod(m.key as PaymentMethod)}
                   className={`p-3 rounded-xl border text-sm font-bold text-center transition ${paymentMethod === m.key ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                   {m.label}
                 </button>
               ))}
             </div>

             {/* บัตรเครดิต */}
             {paymentMethod === 'card' && (
               <div className="space-y-4">
                 {/* Card preview */}
                 <div className="bg-gradient-to-br from-blue-800 to-blue-950 rounded-2xl p-6 mb-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                   <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
                   <p className="text-blue-300 text-xs mb-4 font-bold tracking-widest">CREDIT / DEBIT CARD</p>
                   <p className="text-white text-2xl font-mono tracking-widest mb-4">
                     {cardData.number || '•••• •••• •••• ••••'}
                   </p>
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-blue-400 text-xs">CARD HOLDER</p>
                       <p className="text-white font-bold uppercase">{cardData.name || 'YOUR NAME'}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-blue-400 text-xs">EXPIRES</p>
                       <p className="text-white font-bold">{cardData.expiry || 'MM/YY'}</p>
                     </div>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm text-gray-400 mb-1">หมายเลขบัตร</label>
                   <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                     value={cardData.number}
                     onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                     className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">ชื่อบนบัตร</label>
                   <input type="text" placeholder="JOHN DOE"
                     value={cardData.name}
                     onChange={e => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                     className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white uppercase focus:border-blue-500 outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">วันหมดอายุ</label>
                     <input type="text" inputMode="numeric" placeholder="MM/YY"
                       value={cardData.expiry}
                       onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                       className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">CVV</label>
                     <input type="password" inputMode="numeric" placeholder="•••" maxLength={4}
                       value={cardData.cvv}
                       onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                       className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                   </div>
                 </div>
               </div>
             )}

             {/* PromptPay */}
             {paymentMethod === 'promptpay' && (
               <div className="text-center py-6">
                 <div className="bg-white rounded-2xl p-6 inline-block mb-4">
                   {/* QR จำลอง */}
                   <svg width="160" height="160" viewBox="0 0 160 160">
                     <rect width="160" height="160" fill="white"/>
                     {/* QR pattern จำลอง */}
                     {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => (
                       ((r < 3 || r > 3) && (c < 3 || c > 3)) || (r === 3 && c === 3) ?
                       <rect key={`${r}-${c}`} x={10+r*20} y={10+c*20} width="18" height="18" fill={Math.random() > 0.5 ? '#000' : '#fff'} rx="2"/> : null
                     )))}
                     <rect x="10" y="10" width="58" height="58" fill="none" stroke="#000" strokeWidth="4" rx="4"/>
                     <rect x="92" y="10" width="58" height="58" fill="none" stroke="#000" strokeWidth="4" rx="4"/>
                     <rect x="10" y="92" width="58" height="58" fill="none" stroke="#000" strokeWidth="4" rx="4"/>
                     <rect x="22" y="22" width="34" height="34" fill="#000" rx="2"/>
                     <rect x="104" y="22" width="34" height="34" fill="#000" rx="2"/>
                     <rect x="22" y="104" width="34" height="34" fill="#000" rx="2"/>
                   </svg>
                 </div>
                 <p className="text-white font-bold text-lg mb-1">สแกน QR เพื่อชำระเงิน</p>
                 <p className="text-gray-400 text-sm mb-2">PromptPay หมายเลข: 0xx-xxx-xxxx</p>
                 <p className="text-blue-400 font-extrabold text-2xl">฿{total.toLocaleString()}</p>
                 <p className="text-gray-500 text-xs mt-3">QR จะหมดอายุใน 15 นาที</p>
               </div>
             )}

             {/* TrueMoney */}
             {paymentMethod === 'truemoney' && (
               <div className="text-center py-6">
                 <div className="text-6xl mb-4">💛</div>
                 <p className="text-white font-bold text-lg mb-2">TrueMoney Wallet</p>
                 <p className="text-gray-400 text-sm mb-4">กรอกเบอร์โทรศัพท์ที่ผูกกับ TrueMoney</p>
                 <input type="tel" inputMode="numeric" placeholder="08x-xxx-xxxx" maxLength={10}
                   className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center font-mono focus:border-yellow-500 outline-none mb-2" />
                 <p className="text-yellow-400 font-extrabold text-2xl mt-4">฿{total.toLocaleString()}</p>
               </div>
             )}

             <div className="flex gap-3 mt-6">
               <button onClick={() => setStep('summary')}
                 className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition">
                 ← กลับ
               </button>
               <button onClick={handlePay}
                 className="flex-[2] py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-2xl text-lg transition flex items-center justify-center gap-2">
                 <Lock size={18} /> ยืนยันชำระเงิน ฿{total.toLocaleString()}
               </button>
             </div>

             <p className="text-center text-gray-600 text-xs mt-4 flex items-center justify-center gap-1">
               <Lock size={12} /> ข้อมูลการชำระเงินของคุณถูกเข้ารหัสด้วย SSL
             </p>
           </div>
          )}
        </div>

        {/* ขวา: order summary */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sticky top-24">
            <h3 className="font-bold text-gray-400 mb-4 text-sm uppercase tracking-wider">สรุปคำสั่งซื้อ</h3>
            <div className="space-y-2 mb-4">
              {tradeItem ? (
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-400">{tradeItem.ticket.seat.tier} — แถว {tradeItem.ticket.seat.row} ที่ {tradeItem.ticket.seat.number}</span>
                   <span className="text-white">฿{tradeItem.price.toLocaleString()}</span>
                 </div>
              ) : (
                selectedSeats.map((seat: any) => (
                  <div key={seat.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">{seat.tier} — แถว {seat.row} ที่ {seat.number}</span>
                    <span className="text-white">฿{seat.price.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
              <span className="text-gray-400 font-bold">ยอดรวม</span>
              <span className="text-3xl font-extrabold text-blue-400">฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}