import { savePdfWithPrompt } from '../pdfHelper';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64, getImageDimensions } from './pdfHelpers';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../tenantHelper';
import { fetchTransactionsForReference } from '../../hooks/usePartTransactions';
import {
  formatFGasSummary,
  formatGpsCheckIn,
  getCkobCategoryLabel,
  getIndustryProfileConfig,
  calculateCo2Equivalent,
} from '../fieldServiceHelpers';

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
    const industryProfile = state.branding?.industryProfile || 'industrial';
    const profileConfig = getIndustryProfileConfig(industryProfile);

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
    doc.text(n(`VexoNT - ${profileConfig.shortName}`), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(n(profileConfig.ticketPdfTitle), 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(200, 50, 50);
    doc.text(`T${ticket.id?.slice(0, 4).toUpperCase() || '1'} - ${n(STATUSES[Number(ticket.status)] || STATUSES[ticket.status] || 'Nieznany')}`, 14, 30);

    let currentY = 45;

    const infoRows = [
      [n(`${profileConfig.machineLabel}:`), n(`${machineName}${machineObj?.internalId ? ' (' + machineObj.internalId + ')' : ''}`)],
      [n(`${profileConfig.regionLabel} / ${profileConfig.bayLabel}:`), n(`${regionName} ${ticket.bay || machineObj?.bay ? '/ ' + (ticket.bay || machineObj?.bay) : ''}`)],
    ];
    const addrStr = ticket.address || machineObj?.address || machineObj?.mapAddress || regionObj?.address || regionObj?.mapAddress;
    if (addrStr) {
      infoRows.push([n('Adres GPS:'), n(addrStr)]);
    }
    const ckobStr = getCkobCategoryLabel(machineObj?.inspectionCategory);
    if (ckobStr && industryProfile !== 'industrial') {
      infoRows.push([n('Kategoria c-KOB:'), n(ckobStr)]);
    }
    infoRows.push(
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
    );
    const gpsStr = formatGpsCheckIn(ticket.completedGps);
    if (gpsStr) {
      infoRows.push([n('Potwierdzenie GPS:'), n(gpsStr)]);
    }
    const fGasStr = formatFGasSummary(ticket.fGasProtocol);
    if (
      fGasStr &&
      industryProfile !== 'industrial' &&
      (industryProfile === 'hvac' || machineObj?.refrigerantType)
    ) {
      infoRows.push([n('Protokol F-Gaz (HVAC):'), n(fGasStr)]);
    }

    const headerColor =
      industryProfile === 'facility'
        ? [180, 83, 9]
        : industryProfile === 'hvac'
        ? [14, 116, 144]
        : [30, 41, 59];

    autoTable(doc, {
      startY: currentY,
      head: [[n('Informacje o Zgloszeniu i Realizacji'), '']],
      body: infoRows,
      theme: 'grid',
      headStyles: { fillColor: headerColor },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // Dedykowana sekcja branżowa w PDF (Industrial / Facility c-KOB / HVAC F-Gaz)
    if (industryProfile === 'industrial') {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Parametry Techniczne Utrzymania Ruchu (Przemysl / UR)'), '']],
        body: [
          [n('Status Ruchu Maszyny:'), n(ticket.isCritical ? 'POSTOJ AWARYJNY (STOP)' : 'PRACA Z OGRANICZENIEM')],
          [n('Stan Licznika (RBG):'), n(`${machineObj?.operatingHours ?? 0} RBG`)],
          [n('Kategoria / Zespol UR:'), n(ticket.assignedTo || machineObj?.category || 'Utrzymanie Ruchu')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else if (industryProfile === 'facility') {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Dane Administracyjne Obiektu i Lokalu (Facility / c-KOB)'), '']],
        body: [
          [n('Kategoria c-KOB (art. 62 PB):'), n(ckobStr || 'Instalacja / czesc wspolna budynku')],
          [n('Lokator / Administrator:'), n(`${machineObj?.contactPerson || ticket.reportedBy || '-'} ${machineObj?.contactPhone || ticket.reporterPhone ? '(' + (machineObj?.contactPhone || ticket.reporterPhone) + ')' : ''}`)],
          [n('Kod domofonu / Dostep:'), n(machineObj?.accessNotes || 'Dostep wg administracji obiektu')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else if (industryProfile === 'hvac') {
      const fGas = ticket.fGasProtocol || {};
      const co2 = calculateCo2Equivalent(
        fGas.refrigerantType || machineObj?.refrigerantType,
        fGas.refrigerantChargeKg || machineObj?.refrigerantChargeKg
      );
      const leakLabel =
        fGas.leakTestResult === 'positive'
          ? 'POZYTYWNY (Uklad szczelny)'
          : fGas.leakTestResult === 'negative'
          ? 'NEGATYWNY (Stwierdzono wyciek)'
          : 'Nie wykonywano / Nie dotyczy';
      autoTable(doc, {
        startY: currentY,
        head: [[n('Protokol F-Gaz / Kontrola Szczelnosci (Rozp. UE 2024/573 & CRO)'), '']],
        body: [
          [n('Czynnik chlodniczy i napelnienie:'), n(co2.refrigerantType ? `${co2.refrigerantType} (${co2.chargeKg} kg, GWP: ${co2.gwp})` : 'Brak danych')],
          [n('Ekwiwalent CO2e / Rejestr CRO:'), n(`${co2.co2EquivalentTons} t CO2e (${co2.requiresCroCard ? 'Wymagana Karta CRO >= 5 t CO2e' : 'Ponizej progu CRO'})`)],
          [n('Wynik proby szczelnosci:'), n(leakLabel)],
          [n('Uzupelniono / Odzyskano czynnik:'), n(`+${Number(fGas.refrigerantAddedKg || 0).toFixed(2)} kg / -${Number(fGas.refrigerantRecoveredKg || 0).toFixed(2)} kg`)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

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

    // Sekcja podpisu odbioru (wraz z podpisem cyfrowym na ekranie telefonu, jeśli złożono)
    if (currentY > 235) {
      doc.addPage();
      currentY = 25;
    } else {
      currentY += 8;
    }

    doc.setDrawColor(180, 180, 180);
    doc.line(14, currentY + 22, 90, currentY + 22);
    doc.line(115, currentY + 22, 195, currentY + 22);

    if (ticket.clientSignature && ticket.clientSignature.startsWith('data:image')) {
      try {
        doc.addImage(ticket.clientSignature, 'PNG', 120, currentY + 2, 65, 18, '', 'FAST');
      } catch (sigErr) {
        console.warn('Blad osadzania podpisu w PDF:', sigErr);
      }
    }

    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(
      n(`${profileConfig.techSignatureLabel} (${ticket.completedBy || ticket.assignedTo || 'Serwis'})`),
      14,
      currentY + 27
    );
    doc.text(
      n(
        `${profileConfig.clientSignatureLabel}${
          ticket.clientSignerName ? ' (' + ticket.clientSignerName + ')' : ''
        }`
      ),
      115,
      currentY + 27
    );

    await savePdfWithPrompt(doc, n(`Zgłoszenie_T${ticket.id?.slice(0, 4).toUpperCase() || '1'}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF zgłoszenia:', error);
    alert('Wystąpił błąd podczas generowania raportu PDF.');
  }
};
