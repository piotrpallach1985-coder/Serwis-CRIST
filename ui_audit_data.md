# UI Audit Report

## src/components/manager/MachineDetails.jsx
```jsx
<div className="bg-[#f8f9fa] w-full flex flex-col h-full animate-fade-in relative text-[#111827]">
            <div className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 shadow-sm gap-3">
        
        {/* Górna linia na mobile: Powrót + Tytuł */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={onBack}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-sm shrink-0"
            title="Powrót"
          >
            <i className="ph ph-arrow-left text-lg"></i> <span className="hidden sm:inline">Powrót</span>
          </button>
          <h2 className="text-base md:text-xl font-bold text-gray-800 shrink-0">Szczegóły Maszyny</h2>
        </div>

        {/* Dolna linia na mobile / Prawa strona na desktopie: Przyciski akcji */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          {onScanNext && (
            <button
              onClick={onScanNext}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 md:w-auto md:h-auto md:py-1.5 md:px-3 rounded-lg font-bold text-sm shadow-sm transition-colors shrink-0"
              title="Skanuj kod QR maszyny"
            >
              <i className="ph ph-qr-code text-xl md:text-lg"></i>
              <span className="hidden md:inl
```

## src/components/manager/TicketDetails.jsx
```jsx
<div className="bg-[#f8f9fa] w-full flex flex-col h-full overflow-y-auto animate-fade-in relative text-[#111827]">
        

        {/* Górny pasek nawigacyjny z przyciskiem powrotu */}
        <div className="p-2 md:p-4 border-b border-gray-200 bg-white sticky top-0 z-20 flex flex-wrap justify-between items-center gap-2 shadow-sm">
          <div className="flex flex-wrap gap-2 md:gap-4">
            
            {location.state?.backToMachineId && (
              <button onClick={() => {
                const returnId = location.state?.backToMachineId;
                if (returnId) {
                  navigate(`/manager/master_data/machines?openMachine=${returnId}`);
                }
              }} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all">
                <i className="ph ph-arrow-u-up-left text-lg"></i> Wróć do Urządzenia
              </button>
            )}

            <button onClick={() => {
              if (location.state?.fromNotification) {
                 setSelectedTicketId(null);
                 navigate('?module=tickets&tab=tickets_active', { replace: true });
              } else {
                 setSelectedTicketId(null);
              }
            }} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all">
              <i className="ph ph-arrow-left text-lg"></i> Powrót do rejes
```

## src/components/manager/PlannedMaintenanceDetails.jsx
```jsx
<div className="space-y-6 animate-fade-in">
      {/* Pasek nawigacji */}
      <div className="flex gap-2 sm:gap-4 flex-wrap p-2 sm:p-4 bg-white/95 backdrop-blur border-b sm:border border-gray-200 shadow-sm sm:rounded-xl mb-4">
        {location.state?.backToMachineId && (
          <button
            onClick={() => {
              const returnId = location.state?.backToMachineId;
              if (returnId) {
                navigate(`/manager/master_data/machines?openMachine=${returnId}`);
              }
            }}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all w-fit"
          >
            <i className="ph ph-arrow-u-up-left text-lg"></i>
            Wróć do Urządzenia
          </button>
        )}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all w-fit"
        >
          <i className="ph ph-arrow-left text-lg"></i>
          Wróć do listy serwisów
        </button>
        <button
          onClick={() => import('../../utils/reports/pdfServiceCard').then(m => m.generateServicePDF(srv, machine))}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 md:px-5 md:py
```

## src/components/manager/parts/PartDetails.jsx
```jsx
<div className="w-full space-y-4 pb-20">
      {/* NAGŁÓWEK */}
      <div className="p-2 md:p-4 border-b border-gray-200 bg-white sticky top-0 z-20 flex flex-wrap justify-between items-center gap-2 shadow-sm rounded-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all">
            <i className="ph ph-arrow-left text-lg"></i> Powrót do rejestru
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{part.name}</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">KOD: {part.code || '-'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTxMode('receive')} className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 md:px-5 md:py-2.5 rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-2 text-xs md:text-base">
            <i className="ph ph-plus-circle text-lg"></i> Dostawa
          </button>
          <button onClick={() => setTxMode('issue')} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 md:px-5 md:py-2.5 rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-2 text-xs md:text-base">
            <i className="
```

## src/components/manager/Machines.jsx
```jsx
<div className="space-y-6">
      <QRScannerModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        title="Skanuj kod QR (Baza Urzadzen)"
        subtitle="Skieruj aparat na kod QR maszyny, aby otworzyć jej detale."
      />
        <NFCScannerModal
          isOpen={isNfcScanning}
          onClose={() => setIsNfcScanning(false)}
          onScanSuccess={(decoded) => {
            setIsNfcScanning(false);
            handleScanSuccess(decoded);
          }}
          title="Odczyt NFC (Baza Urządzeń)"
        />

      {selectedMachine ? (
        <MachineDetails
          machine={machines.find(m => m.id === selectedMachine.id) || selectedMachine}
          history={machineHistory}
          loading={loadingHistory}
          isFromQR={isFromQRScan}
          onScanNext={() => setIsScanning(true)}
          onNfcNext={() => setIsNfcScanning(true)}
          onBack={() => { setSelectedMachine(null); setIsFromQRScan(false); }}
          onPrint={handlePrint}
          onGeneratePDF={() => generateMachineHistoryPDF({...selectedMachine, regionName: regions.find(r => r.id === selectedMachine.regionId)?.name}, machineHistory.tickets, machineHistory.services)}
            onGenerateNewQR={() => handleGenerateNewQR(selectedMachine.id)}
          regions={regions}
          user={user}
          onOpenTicket={onOpenTicket}
          onOpenService={onOpenService}
          onEdit={() => { setEditingId(selectedMachine
```

## src/components/manager/Tickets.jsx
```jsx
<div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <span className="ml-3 text-gray-500 font-medium">Wczytywanie zgłoszenia...</span>
      </div>
    );
  }

  if (selectedTicketId && currentTicket) {
    return (
      <ErrorBoundary>
        <TicketDetails
        machines={machines}
        currentTicket={currentTicket}
        setSelectedTicketId={setSelectedTicketId}
        user={user}
        handleUpdate={handleUpdate}
        handleDeleteTicket={handleDeleteTicket}
        handleArchiveTicket={handleArchiveTicket}
        comment={comment}
        setComment={setComment}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        etr={etr}
        setEtr={setEtr}
        loading={loading}
        allowTicketDeletion={allowTicketDeletion}
        showToast={showToast}
        showConfirm={showConfirm}
        STATUSES={STATUSES}
        isArchive={isArchive}
      />
      </ErrorBoundary>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!isArchive && (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 max-w-2xl">
          <div className="bg-white p-3 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0">
          
```

## src/components/manager/PlannedMaintenance.jsx
```jsx
<div className="space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className={`ph ${isArchive ? 'ph-archive text-slate-600' : 'ph-calendar-check text-blue-600'} text-2xl`}></i>
            {isArchive ? 'Archiwum Serwisów' : 'Serwis Planowany'}
          </h2>
          <p className="text-slate-500 text-[10px] md:text-xs mt-1 leading-tight">
            {isArchive ? 'Historia zakończonych prac prewencyjnych' : 'Konserwacja prewencyjna, harmonogramy i liczniki roboczogodzin'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button onClick={handleExportExcel} className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs flex items-center gap-2 border border-green-200 transition-colors shrink-0">
            <i className="ph ph-file-xls text-lg"></i> Eksportuj (.xlsx)
          </button>
          {!isArchive && (
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none px-4 py-2 font-bold text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg
```

## src/components/manager/parts/PartsList.jsx
```jsx
<div className="w-full">
        <PartDetails part={currentPart} onBack={() => setSelectedPartId(null)} user={user} onEdit={() => setIsFormOpen(true)} />
        {isFormOpen && <PartForm part={currentPart} onClose={() => setIsFormOpen(false)} user={user} />}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Baza Magazynowa</h2>
            <p className="text-sm text-slate-500 mt-1">Zarządzaj częściami zapasowymi, przypisuj je do maszyn i śledź stany</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <i className="ph ph-qr-code text-lg"></i>
              Skanuj QR
            </button>
            <button
              onClick={() => { setIsFormOpen(true); setSelectedPartId(null); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <i className="ph ph-plus text-lg"></i>
```

## src/components/OperatorView.jsx
```jsx
<div className="min-h-screen bg-gray-100 flex flex-col relative">


      <header className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            Zgłoś Awarię
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onSwitchView && (
            <button 
              onClick={onSwitchView} 
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold px-3 py-2 rounded transition-colors shadow-sm"
              title="Wróć do Dyspozytorni"
            >
              <i className="ph ph-desktop text-xl"></i>
              <span className="hidden sm:inline">Dyspozytornia</span>
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded transition-colors text-sm sm:text-base">
            <i className="ph ph-sign-out text-xl"></i>
            <span>Wyjdź</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full mt-4">
        
        {/* Kontener na błędy (Logowanie błędów na ekranie) */}
        {errorMsg && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-600 text-red-900 p-4 rounded shadow-sm">
            <h3 classNam
```

