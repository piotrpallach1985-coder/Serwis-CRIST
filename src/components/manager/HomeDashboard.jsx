export default function HomeDashboard({ setActiveTab, setCurrentModule, user }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[600px] p-6 animate-fade-in bg-slate-50">
      <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center">Witaj w systemie zarządzania</h2>
      <p className="text-slate-500 mb-12 text-center max-w-lg">
        Wybierz moduł, do którego chcesz przejść, aby rozpocząć pracę.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {/* AWARIE UR */}
        <button 
          onClick={() => {
            setCurrentModule('tickets'); setActiveTab('tickets');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i className="ph ph-warning-circle"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Awarie UR</h3>
          <p className="text-sm text-slate-500 text-center">Zarządzanie bieżącymi awariami i usterkami zgłaszanymi z produkcji.</p>
        </button>

        {/* SERWIS UR */}
        <button 
          onClick={() => {
            setCurrentModule('planned_maintenance'); setActiveTab('planned_maintenance');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:emerald-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <i className="ph ph-calendar-check"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Serwis UR</h3>
          <p className="text-sm text-slate-500 text-center">Harmonogramy przeglądów, prewencja i zaplanowane prace serwisowe.</p>
        </button>

        {/* ADMINISTRACJA */}
        <button 
          onClick={() => {
            setCurrentModule('master_data');
            // Zależnie od uprawnień, pokaż użytkowników lub pierwszą dostępną dla niego stronę bazy maszyn
            setActiveTab(user?.role === 'admin' ? 'settings' : 'machines');
          }}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:purple-300 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <i className="ph ph-gear"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Administracja</h3>
          <p className="text-sm text-slate-500 text-center">Baza maszyn, ustawienia, pracownicy i konfiguracja systemu.</p>
        </button>
      </div>
    </div>
  );
}
