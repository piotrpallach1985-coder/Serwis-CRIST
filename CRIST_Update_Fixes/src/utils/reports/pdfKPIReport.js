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

export const generateKPIReportPDF = async (tickets, plannedServices, machines, dateRangeTitle) => {
  try {
    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
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
    doc.setFontSize(22);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Raport Zarzadczy UR'), 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(n(`Okres raportowy: ${dateRangeTitle}`), 14, 30);
    doc.text(n(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`), 14, 36);

    // --- OBLICZENIA ---
    const closedTickets = tickets.filter(t => t.status === 5);
    const completedServices = plannedServices.filter(s => s.status === 'completed');

    // 1. MTTR
    let totalRepairTimeMs = 0;
    let repairCount = 0;
    closedTickets.forEach(t => {
      const openD = safeParseDate(t.createdAt);
      const closeD = safeParseDate(t.closedAt);
      if (openD && closeD) {
        totalRepairTimeMs += (closeD.getTime() - openD.getTime());
        repairCount++;
      }
    });
    const mttrHours = repairCount > 0 ? (totalRepairTimeMs / repairCount / (1000 * 60 * 60)).toFixed(1) : 0;

    // 2. Proporcja
    const totalInterventions = repairCount + completedServices.length;
    const preventivePercent = totalInterventions > 0 ? Math.round((completedServices.length / totalInterventions) * 100) : 0;
    const reactivePercent = totalInterventions > 0 ? Math.round((repairCount / totalInterventions) * 100) : 0;

    // 3. TOP 5 Awaryjnych Maszyn
    const machineFaultCounts = {};
    closedTickets.forEach(t => {
      if (t.machineId) {
        machineFaultCounts[t.machineId] = (machineFaultCounts[t.machineId] || 0) + 1;
      }
    });
    
    const top5Machines = Object.entries(machineFaultCounts)
      .map(([id, count]) => {
        const mach = machines.find(m => m.id === id);
        return { name: mach?.name || 'Nieznana Maszyna', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- WIZUALIZACJA NA PDF ---
    let currentY = 50;
    
        const openTicketsCount = tickets.filter(t => t.status !== 5).length;
    const reportedTicketsCount = tickets.length;
    const allPlannedCount = plannedServices.length;

    const now = new Date();
    const overdueServicesCount = plannedServices.filter(srv => {
        if (srv.status === 'completed' || srv.status === 'in_progress') return false;
        let isOverdue = false;
        const machine = machines.find(m => m.id === srv.machineId);
        if (srv.nextDate) {
          const nDate = safeParseDate(srv.nextDate);
          if (nDate && nDate < now) isOverdue = true;
        }
        if (srv.targetWorkHours && machine) {
          if (machine.currentWorkHours >= srv.targetWorkHours) isOverdue = true;
        }
        return isOverdue;
    }).length;

    const formatMTTR = (totalMs, count) => {
      if (count === 0) return '0 h 0 min';
      const avgMs = totalMs / count;
      const hours = Math.floor(avgMs / (1000 * 60 * 60));
      const mins = Math.round((avgMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} h ${mins} min`;
    };

    const mttrString = formatMTTR(totalRepairTimeMs, repairCount);

    // Tabela G'ƈwnych KPI
    autoTable(doc, {
      startY: currentY,
      head: [[n('Wskaznik (KPI)'), n('Wynik'), n('Opis Wskaznika')]],
      body: [
        [n('MTTR (Sredni Czas Naprawy)'), mttrString, n('Sredni czas od zgloszenia do usuniecia awarii')],
        [n('Liczba zgloszonych awarii'), `${reportedTicketsCount}`, n('Wszystkie awarie w wybranym okresie')],
        [n('Liczba otwartych zgloszen'), `${openTicketsCount}`, n('Awarie obecnie oczekujace/w trakcie')],
        [n('Liczba wykonanych napraw'), `${repairCount}`, n('Awarie zakonczone w wybranym okresie')],
        [n('Liczba planowanych serwisow'), `${allPlannedCount}`, n('Wszystkie serwisy wpisane do planu')],
        [n('Liczba wykonanych serwisow'), `${completedServices.length}`, n('Zrealizowane prace z kalendarza/RBG')],
        [n('Liczba zaleglych serwisow'), `${overdueServicesCount}`, n('Przekroczony czas lub RBG')],
        [n('Stosunek Pracy (Prewencja / Reakcja)'), `${preventivePercent}% / ${reactivePercent}%`, n('Serwisy zaplanowane vs naprawy awaryjne')]
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [40, 80, 140] },
      theme: 'grid'
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Tabela: Top 5 Awaryjnych Maszyn
    doc.setFontSize(14);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Ranking: Top 5 Najbardziej Usterkowych Maszyn'), 14, currentY);
    currentY += 6;

    if (top5Machines.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Miejsce'), n('Nazwa Maszyny'), n('Ilosc Zgloszonych Awarii')]],
        body: top5Machines.map((m, i) => [i + 1, n(m.name), m.count]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [180, 60, 60] },
      });
    } else {
      doc.setFontSize(10);
      doc.text(n('Brak danych o awariach w podanym okresie.'), 14, currentY + 5);
    }

    // Stopka dokumentu
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        n(`Wygenerowano z systemu VexoNT (Modul Zarzadczy) | Strona ${i} z ${pageCount}`), 
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(n(`Raport_Zarzadczy_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania raportu KPI PDF:', error);
    alert('Wystąpił błąd podczas generowania raportu.');
  }
};
