import * as XLSX from 'xlsx';

/**
 * Eksportuje podane dane do pliku Excel (.xlsx)
 * @param {Array<Object>} data - Tablica obiektów (wierszy) z przetworzonymi danymi (nagłówki kolumn powinny odpowiadać kluczom).
 * @param {string} filename - Nazwa pliku wyjściowego (bez rozszerzenia).
 * @param {string} sheetName - Nazwa arkusza w pliku.
 */
export const exportToExcel = (data, filename = 'raport', sheetName = 'Dane') => {
  if (!data || data.length === 0) {
    alert('Brak danych do wyeksportowania.');
    return;
  }

  try {
    // 1. Tworzymy nowy skoroszyt
    const workbook = XLSX.utils.book_new();

    // 2. Zamieniamy dane JSON na arkusz kalkulacyjny
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Domyślna szerokość kolumn dla wygody
    const cols = Object.keys(data[0]).map(key => ({ wch: Math.max(20, key.length + 5) }));
    worksheet['!cols'] = cols;

    // 3. Dodajemy arkusz do skoroszytu
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 4. Pobieramy plik
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Błąd podczas generowania pliku Excel:', error);
    alert('Wystąpił błąd podczas generowania pliku.');
  }
};
