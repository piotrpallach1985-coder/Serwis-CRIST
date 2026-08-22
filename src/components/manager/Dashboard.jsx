export default function Dashboard({ tickets, machines }) {
  // Obliczenia statystyk
  const activeTickets = tickets.filter(t => t.status !== 5);
  const criticalTickets = activeTickets.filter(t => t.isCritical);
  const completedToday = tickets.filter(t => {
    if (t.status !== 5 || !t.closedAt) return false;
    const closedDate = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
    const today = new Date();
    return closedDate.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-warning-circle"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{activeTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Aktywne Zgłoszenia</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-siren"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{criticalTickets.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Krytyczne (Postój)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-check-circle"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{completedToday.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Zakończone Dzisiaj</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-3xl">
            <i className="ph ph-engine"></i>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{machines.length}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Maszyny w bazie</div>
          </div>
        </div>
      </div>
    </div>
  );
}