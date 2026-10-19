import { savePdfWithPrompt } from '../pdfHelper';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64 } from './pdfHelpers';
import { TICKET_STATUS, SERVICE_STATUS } from '../constants';

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

export const generateKPIReportPDF = async (tickets = [], services = [], machines = [], periodTitle = '') => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

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
      doc.text('VexoNT', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    // Tytuł dokumentu
    doc.setFontSize(22);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Raport Zarzadczy UR (KPI)'), 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(n(`Okres raportowy: ${periodTitle}`), 14, 30);
    doc.text(n(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`), 14, 36);

    const machinesMap = (machines || []).reduce((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {});

    // --- OBLICZENIA ---
    const closedTickets = tickets.filter(t => Number(t.status) === TICKET_STATUS.CLOSED);
    const criticalTicketsCount = tickets.filter(t => t.isCritical).length;
    const completedServices = services.filter(
      s => s.status === SERVICE_STATUS.COMPLETED || s.status === 'completed'
    );
    const inProgressServicesCount = services.filter(
      s => s.status === SERVICE_STATUS.IN_PROGRESS || s.status === 'in_progress'
    ).length;

    // 1. MTTR
    let totalRepairTimeMs = 0;
    let repairCount = 0;
    closedTickets.forEach(t => {
      const openD = safeParseDate(t.createdAt);
      const closeD = safeParseDate(t.closedAt);
      if (openD && closeD && closeD >= openD) {
        totalRepairTimeMs += (closeD.getTime() - openD.getTime());
        repairCount++;
      }
    });

    // 2. Proporcja Prewencja vs Reakcja
    const totalInterventions = repairCount + completedServices.length;
    const preventivePercent = totalInterventions > 0 ? Math.round((completedServices.length / totalInterventions) * 100) : 0;
    const reactivePercent = totalInterventions > 0 ? Math.round((repairCount / totalInterventions) * 100) : 0;

    // 3. TOP 5 Awaryjnych Maszyn
    const machineFaultCounts = {};
    tickets.forEach(t => {
      const mName = t.machineName || machinesMap[t.machineId]?.name || 'Nieznana maszyna';
      machineFaultCounts[mName] = (machineFaultCounts[mName] || 0) + 1;
    });
    
    const top5Machines = Object.entries(machineFaultCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. TOP 5 Serwisowanych Maszyn
    const machineServiceCounts = {};
    services.forEach(s => {
      const mName = s.machineName || machinesMap[s.machineId]?.name || 'Nieznana maszyna';
      machineServiceCounts[mName] = (machineServiceCounts[mName] || 0) + 1;
    });

    const top5ServiceMachines = Object.entries(machineServiceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- WIZUALIZACJA NA PDF ---
    let currentY = 48;
    
    const openTicketsCount = tickets.filter(t => Number(t.status) !== TICKET_STATUS.CLOSED).length;
    const reportedTicketsCount = tickets.length;
    const allPlannedCount = services.length;

    const now = new Date();
    const overdueServicesCount = services.filter(srv => {
      if (srv.status === SERVICE_STATUS.COMPLETED || srv.status === 'completed' || srv.status === SERVICE_STATUS.IN_PROGRESS || srv.status === 'in_progress') return false;
      let isOverdue = false;
      const machine = machinesMap[srv.machineId];
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

    // Tabela Głównych KPI
    autoTable(doc, {
      startY: currentY,
      head: [[n('Wskaznik (KPI)'), n('Wynik'), n('Opis Wskaznika')]],
      body: [
        [n('MTTR (Sredni Czas Naprawy)'), mttrString, n('Sredni czas od zgloszenia do usuniecia awarii')],
        [n('Liczba zgloszonych awarii'), `${reportedTicketsCount} (w tym kryt.: ${criticalTicketsCount})`, n('Wszystkie awarie w wybranym okresie')],
        [n('Liczba otwartych zgloszen'), `${openTicketsCount}`, n('Awarie obecnie oczekujace / w trakcie realizacji')],
        [n('Liczba wykonanych napraw'), `${repairCount}`, n('Awarie zakonczone w wybranym okresie')],
        [n('Liczba wszystkich serwisow planowanych'), `${allPlannedCount}`, n('Wszystkie serwisy w harmonogramie i archiwum')],
        [n('Serwisy w trakcie realizacji'), `${inProgressServicesCount}`, n('Rozpoczete przeglady planowane')],
        [n('Liczba wykonanych serwisow'), `${completedServices.length}`, n('Zrealizowane prace prewencyjne z kalendarza / RBG')],
        [n('Liczba zaleglych serwisow'), `${overdueServicesCount}`, n('Przekroczony termin kalendarzowy lub limit RBG')],
        [n('Stosunek Pracy (Prewencja / Reakcja)'), `${preventivePercent}% / ${reactivePercent}%`, n('Serwisy zaplanowane vs naprawy awaryjne')]
      ],
      styles: { fontSize: 9.5, cellPadding: 3.5 },
      headStyles: { fillColor: [40, 80, 140] },
      theme: 'grid'
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Tabela: Top 5 Awaryjnych Maszyn
    doc.setFontSize(13);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Ranking: Top 5 Najbardziej Usterkowych Maszyn (Awarie)'), 14, currentY);
    currentY += 5;

    if (top5Machines.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Miejsce'), n('Nazwa Maszyny'), n('Ilosc Zgloszonych Awarii')]],
        body: top5Machines.map((m, i) => [i + 1, n(m.name), m.count]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [180, 60, 60] },
      });
      currentY = doc.lastAutoTable.finalY + 14;
    } else {
      doc.setFontSize(9.5);
      doc.text(n('Brak danych o awariach w podanym okresie.'), 14, currentY + 5);
      currentY += 14;
    }

    // Tabela: Top 5 Maszyn wg Serwisów Planowanych
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFontSize(13);
    doc.setTextColor(30, 40, 50);
    doc.text(n('Zestawienie Prewencji: Top 5 Maszyn wg Serwisow Planowanych'), 14, currentY);
    currentY += 5;

    if (top5ServiceMachines.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Miejsce'), n('Nazwa Maszyny'), n('Liczba Serwisow (Plan + Historia)')]],
        body: top5ServiceMachines.map((m, i) => [i + 1, n(m.name), m.count]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [40, 130, 90] },
      });
    } else {
      doc.setFontSize(9.5);
      doc.text(n('Brak serwisow planowanych w podanym okresie.'), 14, currentY + 5);
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

    await savePdfWithPrompt(doc, n(`Raport_Zarzadczy_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania raportu KPI PDF:', error);
    alert('Wystąpił błąd podczas generowania raportu.');
  }
};
