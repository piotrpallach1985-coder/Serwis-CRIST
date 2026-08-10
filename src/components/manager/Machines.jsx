import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { QRCodeSVG } from 'qrcode.react';

export default function Machines({ machines }) {
  const [newMachineName, setNewMachineName] = useState('');
  const [newDepartment, setNewDepartment] = useState(''); // Hala
  const [newBay, setNewBay] = useState(''); // Przelot
  const [loading, setLoading] = useState(false);

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!newMachineName.trim() || !newDepartment.trim() || !newBay.trim()) {
      return alert('Proszę wypełnić wszystkie pola: Numer hali, Numer przelotu oraz Nazwę maszyny.');
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'machines'), {
        name: newMachineName.trim(),
        department: newDepartment.trim(),
        bay: newBay.trim(),
      });
      setNewMachineName('');
      setNewDepartment('');
      setNewBay('');
    } catch (error) {
      console.error('Błąd dodawania maszyny:', error);
      alert('Nie udało się dodać maszyny.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Czy na pewno chcesz usunąć maszynę "${name}" z bazy danych?\n(Historia powiązanych z nią awarii pozostanie nienaruszona)`)) {
      try {
        await deleteDoc(doc(db, 'machines', id));
      } catch (error) {
        console.error('Błąd usuwania maszyny:', error);
        alert('Nie udało się usunąć maszyny.');
      }
    }
  };

  const handlePrint = (machineId, machineName) => {
    // Proste otwarcie nowego okna do wydruku etykiety
    const printWindow = window.open('', '_blank');
    
    // Generujemy URL, na który wskazuje QR kod. Zakładamy, że aplikacja będzie hostowana i operator zeskanuje kod.
    // W ramach tego projektu skaner wbudowany rozpoznaje parametr ?machine=ID
    const qrContent = `${window.location.origin}?machine=${machineId}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Wydruk Etykiety QR - ${machineName}</title>
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
            }
            .label-container {
              border: 4px dashed #000;
              padding: 40px;
              text-align: center;
              width: 500px;
            }
            .company { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .name { font-size: 32px; font-weight: bold; margin-bottom: 25px; }
            .qr { margin-bottom: 20px; }
            /* Zwiększenie svg z canvas */
            .qr svg { width: 350px; height: 350px; }
            .hint { font-size: 16px; color: #555; }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="company">CRIST S.A. - Serwis UR</div>
            <div class="name">${machineName}</div>
            <div class="qr">
              <!-- Najprościej skopiować wyrenderowany element SVG bezpośrednio ze strony -->
              ${document.getElementById('qr-svg-' + machineId).outerHTML}
            </div>
            <div class="hint">Zeskanuj kod w aplikacji, aby zgłosić awarię</div>
            <div class="hint" style="margin-top: 10px; font-weight: bold;">ID: ${machineId}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Sekcja dodawania maszyn */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="ph ph-plus-circle text-blue-600"></i>
          Dodaj nową maszynę i wygeneruj kod QR
        </h2>
        <form onSubmit={handleAddMachine} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer hali</label>
            <input 
              type="text" 
              value={newDepartment} 
              onChange={(e) => setNewDepartment(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Hala K3" 
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer przelotu</label>
            <input 
              type="text" 
              value={newBay} 
              onChange={(e) => setNewBay(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Przelot 2" 
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa / Numer maszyny</label>
            <input 
              type="text" 
              value={newMachineName} 
              onChange={(e) => setNewMachineName(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-900 outline-none" 
              placeholder="np. Suwnica S-01" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded transition-colors whitespace-nowrap"
          >
            {loading ? 'Dodawanie...' : 'Dodaj i wygeneruj QR'}
          </button>
        </form>
      </div>

      {/* Tabela maszyn */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Rejestr Maszyn i Kody QR</h2>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold">Łącznie: {machines.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="p-4 border-b">Maszyna</th>
                <th className="p-4 border-b">Kod QR (Podgląd)</th>
                <th className="p-4 border-b">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {machines.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">Brak maszyn w bazie. Dodaj pierwszą powyżej.</td>
                </tr>
              ) : (
                machines.map(m => {
                  const qrValue = `${window.location.origin}?machine=${m.id}`;
                  return (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-800 text-base">{m.name}</div>
                        <div className="text-gray-500 text-sm mt-1">
                          {m.department ? `Hala: ${m.department}` : ''} {m.bay ? ` | Przelot: ${m.bay}` : ''}
                        </div>
                        <div className="text-xs font-mono text-gray-400 mt-1">ID: {m.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="p-2 bg-white inline-block border border-gray-200 rounded shadow-sm">
                          <QRCodeSVG 
                            id={`qr-svg-${m.id}`}
                            value={qrValue} 
                            size={80} 
                            level={"M"} 
                            includeMargin={false} 
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handlePrint(m.id, m.name)}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-semibold py-2 px-4 rounded transition-colors"
                          >
                            <i className="ph ph-printer"></i>
                            Drukuj
                          </button>
                          <button 
                            onClick={() => handleDelete(m.id, m.name)}
                            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2 px-4 rounded transition-colors"
                            title="Usuń maszynę"
                          >
                            <i className="ph ph-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}