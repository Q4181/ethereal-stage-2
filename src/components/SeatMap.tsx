interface SeatMapProps {
  concert: any;
  mode?: 'normal' | 'trade';
  selectedSeats?: any[];
  selectedTrade?: any;
  tradeList?: any[];
  onSeatClick: (seatOrTrade: any) => void;
}

export default function SeatMap({ 
  concert, 
  mode = 'normal', 
  selectedSeats = [], 
  selectedTrade, 
  tradeList = [], 
  onSeatClick 
}: SeatMapProps) {
  
  if (!concert || !concert.seats) return null;

  // จัดกลุ่มที่นั่งตาม Tier และ Row
  const groupedSeats = concert.seats.reduce((acc: any, seat: any) => {
    if (!acc[seat.tier]) acc[seat.tier] = {};
    if (!acc[seat.tier][seat.row]) acc[seat.tier][seat.row] = [];
    acc[seat.tier][seat.row].push(seat);
    return acc;
  }, {});

  return (
    <div className="w-full">
      {/* เวที */}
      <div className={`w-full h-16 bg-gradient-to-b ${mode === 'trade' ? 'from-yellow-600/20 border-yellow-500/50' : 'from-purple-600/30 border-purple-500/50'} to-transparent rounded-t-full border-t mb-16 flex items-center justify-center`}>
        <span className={`${mode === 'trade' ? 'text-yellow-300' : 'text-purple-300'} font-bold tracking-[0.5em] text-sm`}>STAGE</span>
      </div>

      {/* เรนเดอร์โซนที่นั่ง */}
      {Object.keys(groupedSeats).map((tierName) => (
        <div key={tierName} className="mb-12">
          <h3 className={`font-bold mb-6 tracking-widest text-sm uppercase text-center ${mode === 'trade' ? 'text-gray-500' : 'text-purple-400'}`}>
            {tierName} SECTION
          </h3>
          
          <div className="flex flex-col gap-4 overflow-x-auto pb-6 custom-scrollbar">
            {Object.keys(groupedSeats[tierName]).map(rowName => {
              const seatsInRow = groupedSeats[tierName][rowName].sort((a:any, b:any) => a.number - b.number);
              return (
                <div key={rowName} className="flex flex-nowrap justify-center gap-2 min-w-max mx-auto px-4">
                  <div className="w-8 flex items-center justify-center font-bold text-gray-500 mr-2">{rowName}</div>
                  
                  {seatsInRow.map((seat: any) => {
                    let btnClass = "";
                    let title = "";
                    let disabled = false;
                    let onClickHandler = () => {};

                    // คำนวณสีปุ่มสำหรับโหมดซื้อตั๋วปกติ
                    if (mode === 'normal') {
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isSold = seat.status !== 'AVAILABLE';
                      disabled = isSold;
                      title = `แถว ${seat.row} ที่นั่ง ${seat.number} ($${seat.price})`;
                      onClickHandler = () => onSeatClick(seat);
                      
                      if (isSold) btnClass = 'bg-gray-800 text-gray-700 cursor-not-allowed';
                      else if (isSelected) btnClass = 'bg-purple-500 text-white scale-110 shadow-lg border border-purple-400';
                      else btnClass = 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-600';
                    } 
                    // คำนวณสีปุ่มสำหรับโหมดตลาด Trade
                    else if (mode === 'trade') {
                      const tradeForSeat = tradeList.find(t => t.ticket.seatId === seat.id);
                      const isTradeable = !!tradeForSeat;
                      const isSelected = selectedTrade?.id === tradeForSeat?.id;
                      
                      disabled = !isTradeable;
                      title = isTradeable ? `ราคา Trade: $${tradeForSeat.price}` : `ไม่ได้เปิด Trade`;
                      onClickHandler = () => onSeatClick(tradeForSeat);

                      if (!isTradeable) btnClass = "bg-gray-800 border border-gray-700 text-gray-700 cursor-not-allowed opacity-50";
                      else if (isSelected) btnClass = "bg-yellow-500 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10 border border-yellow-400";
                      else btnClass = "bg-green-600 border border-green-500 text-white hover:bg-green-500 hover:scale-105 shadow-[0_0_10px_rgba(22,163,74,0.3)]";
                    }

                    return (
                      <button 
                        key={seat.id} 
                        onClick={onClickHandler} 
                        disabled={disabled}
                        title={title}
                        className={`w-10 h-10 rounded font-bold text-xs transition-all flex items-center justify-center flex-shrink-0 ${btnClass}`}
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
  );
}