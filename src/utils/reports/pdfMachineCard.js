import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64 } from './pdfHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
};

const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
};

export const generateMachineHistoryPDF = async (machine, tickets, plannedServices) => {
  if (!machine) return;

  try {
    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
      // Obliczamy proporcje, tak by maksymalna szerokość lub wysokość wynosiła 24
      const maxSize = 24;
      let w = maxSize;
      let h = maxSize;
      if (dims.width > dims.height) {
        h = (dims.height / dims.width) * maxSize;
      } else {
        w = (dims.width / dims.height) * maxSize;
      }
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 14 - w, 10, w, h, '', 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.text('CRIST S.A.', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    // Tytuł dokumentu
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Karta Historii Maszyny'), 14, 20);

    // Informacje podstawowe
    doc.setFontSize(11);
    doc.text(n(`Nazwa Maszyny: ${machine.name || 'Brak'}`), 14, 30);
    doc.text(n(`Numer Seryjny (QR): ${machine.qrCode || 'Brak'}`), 14, 36);
    doc.text(n(`Rejon: ${machine.regionName || 'Nieznany'}`), 14, 42);
    doc.text(n(`Stan Licznika: ${machine.currentWorkHours || 0} RBG`), 14, 48);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(n(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`), 14, 54);

    let currentY = 62;

    // ----- Tabela Awarii (Tickets) -----
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Historia Zgloszonych Awarii'), 14, currentY);
    currentY += 4;

    const ticketRows = tickets.map(t => {
      const date = safeParseDate(t.createdAt);
      const problemDesc = t.topic ? `${t.topic}${t.description ? ' - ' + t.description : ''}` : (t.description || '-');
      return [
        date ? date.toLocaleDateString('pl-PL') : '-',
        n(t.reportedBy || '-'),
        n(problemDesc),
        n(t.status === 5 ? 'Zamkniete' : 'Otwarte'),
        n(t.completedBy || '-')
      ];
    });

    if (ticketRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Zgloszenia'), n('Zglaszajacy'), n('Opis Usterki'), n('Status'), n('Naprawil(a)')]],
        body: ticketRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 50, 50] },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      currentY += 6;
      doc.setFontSize(10);
      doc.text(n('Brak zgloszonych awarii dla tej maszyny.'), 14, currentY);
      currentY += 15;
    }

    // ----- Tabela Serwisów (Planned) -----
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.text(n('Historia Serwisow Planowanych'), 14, currentY);
    currentY += 4;

    const serviceRows = plannedServices.map(s => {
      const date = safeParseDate(s.completedAt || s.createdAt);
      return [
        date ? date.toLocaleDateString('pl-PL') : '-',
        n(s.name || '-'),
        n(s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Czasowy' : 'RBG + Czas')),
        n(s.status === 'completed' ? 'Zakonczony' : 'Oczekujacy'),
        n(s.completionDetails?.completedBy || s.completedBy || '-')
      ];
    });

    if (serviceRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Wykonania'), n('Rodzaj Serwisu'), n('Tryb'), n('Status'), n('Wykonal(a)')]],
        body: serviceRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [50, 100, 200] },
      });
    } else {
      currentY += 6;
      doc.setFontSize(10);
      doc.text(n('Brak zaplanowanych lub zrealizowanych serwisow dla tej maszyny.'), 14, currentY);
    }

    doc.save(n(`Karta_Maszyny_${machine.qrCode || 'Nieznana'}_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF:', error);
    alert('Wystąpił błąd podczas generowania dokumentu.');
  }
};
