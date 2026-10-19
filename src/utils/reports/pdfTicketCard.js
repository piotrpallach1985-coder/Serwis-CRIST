import { savePdfWithPrompt } from '../pdfHelper';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64, getImageDimensions } from './pdfHelpers';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../tenantHelper';
import { fetchTransactionsForReference } from '../../hooks/usePartTransactions';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
};

const STATUSES = {
  1: 'Przyjecie zgloszenia',
  2: 'Wybor wykonawcy',
  3: 'Rozpoczecie naprawy',
  4: 'Naprawa w trakcie',
  5: 'Zakonczone'
};

const fetchPhotoData = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const MAX = 800;
        if (w > h && w > MAX) { h = (h / w) * MAX; w = MAX; }
        else if (h > w && h > MAX) { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ b64: canvas.toDataURL('image/jpeg', 0.85), w, h });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => resolve(null);
      img.src = objectUrl;
    });
  } catch (e) {
    return null;
  }
};

export const generateTicketPDF = async (ticket) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  if (!ticket) return;

  try {
    const state = useManagerStore.getState();
    const allParts = state.parts || [];
    const allMachines = state.machines || [];
    const allRegions = state.regions || [];

    const machineObj = allMachines.find(m => m.id === ticket.machineId);
    const regionObj = allRegions.find(r => r.id === (ticket.regionId || machineObj?.regionId));
    const machineName = ticket.machineName || machineObj?.name || 'Nieznana';
    const regionName = ticket.regionName || regionObj?.name || 'Brak';

    let ticketTransactions = [];
    try {
      const txs = await fetchTransactionsForReference(getCurrentTenant(), ticket.id);
      ticketTransactions = (txs || []).filter(
        tx => tx.referenceId === ticket.id && ['issue_adhoc', 'issue', 'issue_planned'].includes(tx.type)
      );
    } catch (e) {
      console.warn('Nie udalo sie pobrac czesci dla zgloszenia PDF:', e);
    }

    const totalTicketPartsCost = ticketTransactions.reduce(
      (sum, tx) => sum + Number(tx.totalCost || Math.abs(Number(tx.quantity || 0)) * Number(tx.price || 0) || 0),
      0
    );

    const doc = new jsPDF();
    const logoBase64 = await getBrandingLogoBase64();

    if (logoBase64) {
      const dims = await getImageDimensions(logoBase64);
      const maxSize = 24;
      let w = maxSize, h = maxSize;
      if (dims.width > dims.height) { h = (dims.height / dims.width) * maxSize; } 
      else { w = (dims.width / dims.height) * maxSize; }
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 14 - w, 10, w, h, '', 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175);
      doc.text('VexoNT', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Karta Zgloszenia Awarii'), 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(200, 50, 50);
    doc.text(`T${ticket.id?.slice(0, 4).toUpperCase() || '1'} - ${n(STATUSES[Number(ticket.status)] || STATUSES[ticket.status] || 'Nieznany')}`, 14, 30);

    let currentY = 45;

    autoTable(doc, {
      startY: currentY,
      head: [[n('Informacje o Zgloszeniu i Realizacji'), '']],
      body: [
        [n('Maszyna:'), n(`${machineName}${machineObj?.internalId ? ' (' + machineObj.internalId + ')' : ''}`)],
        [n('Lokalizacja:'), n(`${regionName} ${ticket.bay || machineObj?.bay ? '/ ' + (ticket.bay || machineObj?.bay) : ''}`)],
        [n('Zglaszajacy:'), n(`${ticket.reportedBy || 'Nieznany'} ${ticket.reporterPhone ? '(' + ticket.reporterPhone + ')' : ''}`)],
        [n('Data Zgloszenia:'), safeParseDate(ticket.createdAt)?.toLocaleString('pl-PL') || '-'],
        [n('Priorytet:'), n(ticket.isCritical ? 'Krytyczny (Wysoki)' : 'Standardowy')],
        [n('Wyznaczony Wykonawca:'), n(ticket.assignedTo || '-')],
        [n('Data Przypisania:'), ticket.assignedAt ? safeParseDate(ticket.assignedAt)?.toLocaleString('pl-PL') : '-'],
        [n('Rozpoczecie Naprawy:'), ticket.inProgressAt ? safeParseDate(ticket.inProgressAt)?.toLocaleString('pl-PL') : '-'],
        [n('Planowany Czas Zakonczenia (ETR):'), ticket.etr ? safeParseDate(ticket.etr)?.toLocaleString('pl-PL') : '-'],
        [n('Data Zamkniecia:'), ticket.closedAt ? safeParseDate(ticket.closedAt)?.toLocaleString('pl-PL') : '-'],
        [n('Zakonczone przez:'), n(ticket.completedBy || ticket.assignedTo || '-')],
        [n('Koszt Zuzytych Czesci:'), n(`${totalTicketPartsCost.toFixed(2)} PLN`)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [60, 100, 180] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } }
    });

    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Temat: ' + (ticket.topic || 'Brak')), 14, currentY);
    currentY += 7;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const splitDescription = doc.splitTextToSize(n(ticket.description || 'Brak opisu...'), doc.internal.pageSize.getWidth() - 28);
    doc.text(splitDescription, 14, currentY);
    
    currentY += splitDescription.length * 5 + 10;

    // ----- Zużyte części zamienne w zgłoszeniu -----
    if (ticketTransactions.length > 0) {
      if (currentY > 245) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n(`Pobrane Czesci Zamienne (${ticketTransactions.length})`), 14, currentY);
      currentY += 4;

      const partRows = ticketTransactions.map(tx => {
        const partObj = allParts.find(p => p.id === tx.partId);
        const unit = partObj?.unit || tx.unit || 'szt.';
        const qty = Math.abs(Number(tx.quantity || 0));
        const cost = Number(tx.totalCost || qty * Number(tx.price || 0) || 0);
        return [
          safeParseDate(tx.date)?.toLocaleString('pl-PL') || '-',
          n(tx.partName || partObj?.name || 'Nieznana czesc'),
          n(`${qty} ${unit}`),
          n(tx.user || '-'),
          n(`${cost.toFixed(2)} PLN`)
        ];
      });

      partRows.push(['', n('LACZNY KOSZT CZESCI:'), '', '', n(`${totalTicketPartsCost.toFixed(2)} PLN`)]);

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data'), n('Nazwa Czesci'), n('Ilosc'), n('Pobral(a)'), n('Koszt (PLN)')]],
        body: partRows,
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [16, 120, 80] }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }

    // Zbierz wszystkie zdjęcia z notatek
    const historyPhotos = new Set();
    if (ticket.history) {
      ticket.history.forEach(h => {
        if (h.photos) {
          h.photos.forEach(p => historyPhotos.add(p));
        }
      });
    }

    const mainPhotos = (ticket.photos || []).filter(p => !historyPhotos.has(p));

    if (mainPhotos.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Zdjecia zgloszenia:'), 14, currentY);
      currentY += 10;
      
      let xOffset = 14;
      let maxHeightInRow = 0;
      for (const photoUrl of mainPhotos) {
        if (xOffset > 150) {
           xOffset = 14;
           currentY += maxHeightInRow + 5;
           maxHeightInRow = 0;
           if (currentY > 240) { doc.addPage(); currentY = 20; }
        }
        
        const photoData = await fetchPhotoData(photoUrl);
        if (photoData) {
          let pw = 60;
          let ph = (photoData.h / photoData.w) * pw;
          if (ph > 80) { ph = 80; pw = (photoData.w / photoData.h) * ph; }
          
          doc.addImage(photoData.b64, 'JPEG', xOffset, currentY, pw, ph, '', 'FAST');
          xOffset += pw + 10;
          if (ph > maxHeightInRow) maxHeightInRow = ph;
        } else {
          doc.setFontSize(9);
          doc.text(n('[Zdjecie niedostepne - blokada CORS]'), xOffset, currentY + 10);
          xOffset += 60;
          if (20 > maxHeightInRow) maxHeightInRow = 20;
        }
      }
      currentY += maxHeightInRow + 15;
    }

    if (ticket.history && ticket.history.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Historia i Notatki'), 14, currentY);
      currentY += 6;

      const historyRows = [...ticket.history].reverse().map(h => {
        const d = safeParseDate(h.date || h.timestamp || h.createdAt);
        return [
          d ? d.toLocaleString('pl-PL') : '-',
          n(h.user || h.userName || h.author || '-'),
          n(h.action || '-'),
          n(h.note || h.comment || '-')
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data'), n('Autor'), n('Akcja'), n('Szczegoly / Notatka')]],
        body: historyRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 100, 100] }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      for (const h of [...ticket.history].reverse()) {
         if (h.photos && h.photos.length > 0) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(12);
            const dStr = safeParseDate(h.date || h.timestamp || h.createdAt)?.toLocaleString('pl-PL') || '';
            doc.text(n(`Zdjecia z notatki (${dStr}):`), 14, currentY);
            currentY += 8;
            
            let xOffset = 14;
            let maxHeightInRow = 0;
            for (const photoUrl of h.photos) {
              if (xOffset > 150) {
                 xOffset = 14;
                 currentY += maxHeightInRow + 5;
                 maxHeightInRow = 0;
                 if (currentY > 240) { doc.addPage(); currentY = 20; }
              }
              const photoData = await fetchPhotoData(photoUrl);
              if (photoData) {
                let pw = 60;
                let ph = (photoData.h / photoData.w) * pw;
                if (ph > 80) { ph = 80; pw = (photoData.w / photoData.h) * ph; }
                
                doc.addImage(photoData.b64, 'JPEG', xOffset, currentY, pw, ph, '', 'FAST');
                xOffset += pw + 10;
                if (ph > maxHeightInRow) maxHeightInRow = ph;
              } else {
                doc.setFontSize(9);
                doc.text(n('[Zdjecie niedostepne - blokada CORS]'), xOffset, currentY + 10);
                xOffset += 60;
                if (20 > maxHeightInRow) maxHeightInRow = 20;
              }
            }
            currentY += maxHeightInRow + 15;
         }
      }
    }

    await savePdfWithPrompt(doc, n(`Zgłoszenie_T${ticket.id?.slice(0, 4).toUpperCase() || '1'}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF zgłoszenia:', error);
    alert('Wystąpił błąd podczas generowania raportu PDF.');
  }
};
