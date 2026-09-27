import React, { useState, useMemo } from 'react';
import { safeParseDate } from '../../utils/dateHelpers';

export default function ServiceCalendar({ services, machines, onSelectService }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMonths, setViewMonths] = useState(1); // 1 = 1 miesiąc, 3 = 3 miesiące

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - viewMonths, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + viewMonths, 1));
  };
  const today = () => {
    setCurrentDate(new Date());
  };

  const getMachineName = (id) => machines.find(m => m.id === id)?.name || 'Nieznana maszyna';

  // Generowanie kalendarza dla danego miesiąca
  const renderMonth = (monthOffset) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Niedziela
    const startDay = firstDay === 0 ? 6 : firstDay - 1; // Przesunięcie na poniedziałek = 0

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

    return (
      <div key={monthOffset} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1 min-w-[300px]">
        <h3 className="text-lg font-bold text-gray-800 text-center mb-4">{monthNames[month]} {year}</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} className="p-2 border border-transparent"></div>;
            
            // Znajdź serwisy na ten dzień
            const dayServices = services.filter(s => {
              if (!s.nextDate) return false;
              const dDate = safeParseDate(s.nextDate);
              return dDate.getFullYear() === day.getFullYear() && 
                     dDate.getMonth() === day.getMonth() && 
                     dDate.getDate() === day.getDate() &&
                     s.status !== 'completed';
            });

            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div 
                key={idx} 
                className={`min-h-[80px] p-1 border rounded flex flex-col ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'} hover:bg-gray-100 transition-colors`}
              >
                <div className={`text-right text-xs font-bold ${isToday ? 'text-blue-600' : 'text-gray-500'} mb-1`}>
                  {day.getDate()}
                </div>
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] no-scrollbar">
                  {dayServices.map(srv => (
                    <div 
                      key={srv.id} 
                      onClick={() => onSelectService && onSelectService(srv.id)}
                      className={`cursor-pointer text-[10px] leading-tight p-1 rounded font-medium border
                        ${srv.priority === 'Krytyczny' ? 'bg-red-100 text-red-800 border-red-200' : 
                          srv.priority === 'Wysoki' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                          'bg-blue-100 text-blue-800 border-blue-200'}`}
                      title={`${srv.name} - ${getMachineName(srv.machineId)}`}
                    >
                      <div className="font-bold truncate">{srv.name}</div>
                      <div className="truncate text-gray-600">{getMachineName(srv.machineId)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div className="flex gap-2">
          <button onClick={prevMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors">
            &larr; Poprzedni
          </button>
          <button onClick={today} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded transition-colors">
            Dzisiaj
          </button>
          <button onClick={nextMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors">
            Następny &rarr;
          </button>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMonths(1)}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewMonths === 1 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            1 Miesiąc
          </button>
          <button 
            onClick={() => setViewMonths(3)}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewMonths === 3 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            3 Miesiące
          </button>
        </div>
      </div>

      <div className={`flex flex-col xl:flex-row gap-6 items-start ${viewMonths === 3 ? 'overflow-x-auto pb-4' : ''}`}>
        {Array.from({ length: viewMonths }).map((_, i) => renderMonth(i))}
      </div>
    </div>
  );
}
