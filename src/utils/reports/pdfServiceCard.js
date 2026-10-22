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
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z')
    .replace(/[\u2013\u2014]/g, '-').replace(/\u00b1/g, '+/-').replace(/\u00b2/g, '2').replace(/\u00b3/g, '3');
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

export const generateServicePDF = async (service, machine) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  if (!service) return;

  try {
    const state = useManagerStore.getState();
    const allParts = state.parts || [];
    const industryProfile = state.branding?.industryProfile || 'industrial';
    const profileConfig = getIndustryProfileConfig(industryProfile);

    let serviceTransactions = [];
    try {
      const txs = await fetchTransactionsForReference(getCurrentTenant(), service.id);
      serviceTransactions = (txs || []).filter(
        tx => tx.referenceId === service.id && ['issue_planned', 'issue_adhoc', 'issue'].includes(tx.type)
      );
    } catch (e) {
      console.warn('Nie udalo sie pobrac transakcji czesci dla serwisu PDF:', e);
    }

    const totalServicePartsCost = serviceTransactions.reduce(
      (sum, tx) => sum + Number(tx.totalCost || Math.abs(Number(tx.quantity || 0)) * Number(tx.price || 0) || 0),
      0
    );

    const completionHistoryEntry = [...(service.history || [])]
      .reverse()
      .find(h => h.manHours !== undefined && h.manHours !== null);
    const actualManHours = completionHistoryEntry?.manHours || service.actualManHours || null;

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
    doc.text(n(profileConfig.servicePdfTitle), 14, 22);
    
    doc.setFontSize(14);
    const isCompleted = service.status === 'completed';
    doc.setTextColor(isCompleted ? 30 : 200, isCompleted ? 150 : 100, 50);
    doc.text(n(isCompleted ? 'Zakonczony' : 'Oczekujacy / W trakcie'), 14, 30);

    let currentY = 45;

    const serviceInfoRows = [
      [n('Nazwa Serwisu / Przegladu:'), n(service.name || 'Brak')],
      [n(`${profileConfig.machineLabel}:`), n(service.machineName || machine?.name || 'Nieznana')],
    ];
    const addrStr = machine?.address || machine?.mapAddress;
    if (addrStr) {
      serviceInfoRows.push([n('Adres Obiektu / GPS:'), n(addrStr)]);
    }
    const ckobStr = getCkobCategoryLabel(machine?.inspectionCategory);
    if (ckobStr && industryProfile !== 'industrial') {
      serviceInfoRows.push([n('Kategoria c-KOB:'), n(ckobStr)]);
    }
    const inspectorLicense =
      service.inspectorLicense || service.completionDetails?.inspectorLicense || null;

    serviceInfoRows.push(
      [n('Priorytet:'), n(service.priority || 'Standardowy')],
      [n('Typ Wyzwalacza:'), n(service.triggerType === 'calendar' ? 'Czasowy (Kalendarz)' : service.triggerType === 'hours' ? 'Licznikowy (RBG)' : 'Mieszany (Czas + RBG)')],
      [n('Data Planowana:'), service.nextDate ? safeParseDate(service.nextDate)?.toLocaleDateString('pl-PL') : '-'],
      [n('Docelowy Stan Licznika:'), service.targetWorkHours ? `${service.targetWorkHours} RBG` : '-'],
      [n('Wyznaczony Wykonawca:'), n(service.assignedService || service.completionDetails?.completedBy || service.completedBy || '-')],
      ...(inspectorLicense
        ? [[n('Uprawnienia Wykonawcy / Inspektora:'), n(inspectorLicense)]]
        : []),
      [n('Wykonano Dnia:'), service.completedAt ? safeParseDate(service.completedAt)?.toLocaleString('pl-PL') : '-'],
      [n('Zakonczone przez:'), n(service.completionDetails?.completedBy || service.completedBy || '-')],
      [n('Naklad Pracy (RBG):'), n(actualManHours ? `${actualManHours} h (Plan: ${service.estimatedManHours || '-'} h)` : (service.estimatedManHours ? `Plan: ${service.estimatedManHours} h` : '-'))],
      [n('Koszt Zuzytych Czesci:'), n(`${totalServicePartsCost.toFixed(2)} PLN`)]
    );
    const gpsStr = formatGpsCheckIn(service.completedGps || service.completionDetails?.completedGps);
    if (gpsStr) {
      serviceInfoRows.push([n('Potwierdzenie GPS:'), n(gpsStr)]);
    }
    const rawFGas =
      service.fGasProtocol ||
      service.completionDetails?.fGasProtocol ||
      (machine?.refrigerantType
        ? {
            refrigerantType: machine.refrigerantType,
            refrigerantChargeKg: machine.refrigerantChargeKg,
          }
        : null);
    const fGasStr = formatFGasSummary(rawFGas);
    if (
      fGasStr &&
      industryProfile !== 'industrial' &&
      (industryProfile === 'hvac' || machine?.refrigerantType)
    ) {
      serviceInfoRows.push([n('Protokol F-Gaz (HVAC):'), n(fGasStr)]);
    }

    const headerColor =
      industryProfile === 'facility'
        ? [180, 83, 9]
        : industryProfile === 'hvac'
        ? [14, 116, 144]
        : [40, 140, 80];

    autoTable(doc, {
      startY: currentY,
      head: [[n('Informacje o Serwisie / Przegladzie'), '']],
      body: serviceInfoRows,
      theme: 'grid',
      headStyles: { fillColor: headerColor },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // Dedykowana sekcja branżowa na karcie serwisu PDF
    if (industryProfile === 'industrial') {
      const intDays = service.calendarIntervalDays ?? service.intervalDays;
      const intHours = service.hoursInterval ?? service.intervalHours;
      autoTable(doc, {
        startY: currentY,
        head: [[n('Parametry Prewencji Utrzymania Ruchu (Przemysl / UR)'), '']],
        body: [
          [n('Aktualny licznik maszyny (RBG):'), n(`${machine?.currentWorkHours ?? machine?.operatingHours ?? 0} RBG`)],
          [n('Interwal odnawiania:'), n(`${intDays ? 'Co ' + intDays + ' dni' : ''} ${intHours ? '/ Co ' + intHours + ' RBG' : ''}`.trim() || 'Wg DTR')],
          [n('Planowany czas przestoju:'), n(`${service.estimatedDowntimeHours || 0} h`)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else if (industryProfile === 'facility') {
      const facilityBody = [
        [n('Kategoria przegladu c-KOB:'), n(ckobStr || 'Przeglad okresowy instalacji budynku (art. 62 PB)')],
        [n('Zarzadca / Kontakt / Domofon:'), n(`${machine?.contactPerson || 'Administracja obiektu'} ${machine?.accessNotes ? '(' + machine.accessNotes + ')' : ''}`)],
        [n('Orzeczenie techniczne c-KOB:'), n(isCompleted ? 'DOPUSZCZONO DO DALSZEJ EKSPLOATACJI' : 'W TRAKCIE PRZEGLADU')],
      ];
      if (machine?.buildingType || machine?.usableAreaM2 || machine?.cubatureM3 || machine?.floorsCount) {
        const metricsParts = [
          machine.buildingType,
          machine.usableAreaM2 ? `Pow: ${machine.usableAreaM2} m2` : null,
          machine.cubatureM3 ? `Kub: ${machine.cubatureM3} m3` : null,
          machine.floorsCount ? `Kondygnacje: ${machine.floorsCount}` : null,
        ].filter(Boolean);
        facilityBody.push([n('Metryczka obiektu (art. 60j PB):'), n(metricsParts.join(' | '))]);
      }
      if (machine?.pinbAuthority) {
        facilityBody.push([n('Wlasciwy organ PINB:'), n(machine.pinbAuthority)]);
      }
      if (machine?.hasAsbestos) {
        facilityBody.push([n('Wyroby zawierajace azbest:'), n(machine.hasAsbestos === true || machine.hasAsbestos === 'Występuje' ? 'WYSTEPUJE' : 'Brak')]);
      }
      autoTable(doc, {
        startY: currentY,
        head: [[n('Protokol Przegladu Okresowego Obiektu Budowlanego (c-KOB art. 62)'), '']],
        body: facilityBody,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else if (industryProfile === 'hvac') {
      const fGas = rawFGas || {};
      const co2 = calculateCo2Equivalent(
        fGas.refrigerantType || machine?.refrigerantType,
        fGas.refrigerantChargeKg || machine?.refrigerantChargeKg
      );
      const leakLabel =
        fGas.leakTestResult === 'positive'
          ? 'POZYTYWNY (Uklad szczelny)'
          : fGas.leakTestResult === 'negative'
          ? 'NEGATYWNY (Wykryto nieszczelnosc!)'
          : 'Nie wykonywano / Nie dotyczy';
      autoTable(doc, {
        startY: currentY,
        head: [[n('Protokol F-Gaz i Kontrola Szczelnosci (Rozp. UE 2024/573 & CRO)'), '']],
        body: [
          [n('Czynnik chlodniczy i napelnienie:'), n(co2.refrigerantType ? `${co2.refrigerantType} (${co2.chargeKg} kg, GWP: ${co2.gwp})` : 'Brak danych')],
          [n('Ekwiwalent CO2e / Obowiazek CRO:'), n(`${co2.co2EquivalentTons} t CO2e (${co2.requiresCroCard ? 'Wymagana Karta CRO >= 5 t CO2e' : 'Ponizej progu CRO'})`)],
          [n('Wynik proby szczelnosci:'), n(leakLabel)],
          [n('Bilans czynnika (Dodano / Odzyskano):'), n(`+${Number(fGas.refrigerantAddedKg || 0).toFixed(2)} kg / -${Number(fGas.refrigerantRecoveredKg || 0).toFixed(2)} kg`)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Wymagane narzędzia
    let toolsText = 'Podstawowe (skrzynka narzedziowa)';
    if (service.toolsType === 'Specjalne') toolsText = `Specjalne: ${service.specialTools || '-'}`;
    else if (service.toolsType === 'Inne') toolsText = `Inne: ${service.otherTools || '-'}`;
    
    autoTable(doc, {
      startY: currentY,
      head: [[n('Wymagane Narzedzia'), n('Wykorzystano?')]],
      body: [
        [n(toolsText), service.status === 'completed' ? '[ X ] TAK    [   ] NIE' : '[   ] TAK    [   ] NIE']
      ],
      theme: 'grid',
      headStyles: { fillColor: [140, 140, 140] },
      columnStyles: { 1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' } }
    });
    currentY = doc.lastAutoTable.finalY + 10;

    const partsRows = (service.requiredParts || []).map(p => {
      const partObj = allParts.find(item => item.id === p.partId);
      const unit = partObj?.unit || p.unit || 'szt.';
      const qty = p.quantity || 1;
      const sn = p.serialNumber || partObj?.serialNumber || partObj?.code || '-';
      return [
        n(`${p.name || partObj?.name || '-'} (Kod/SN: ${sn})`),
        n(`${qty} ${unit}`),
        service.status === 'completed' ? '[ X ] TAK    [   ] NIE' : '[   ] TAK    [   ] NIE'
      ];
    });

    if (partsRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Wymagane Czesci Zamienne (Wg Planu)'), n('Ilosc'), n('Wykorzystano?')]],
        body: partsRows,
        theme: 'grid',
        headStyles: { fillColor: [140, 140, 140] },
        columnStyles: {
          1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
        }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }

    // Faktycznie pobrane części z magazynu (w tym dodatkowe)
    if (serviceTransactions.length > 0) {
      if (currentY > 245) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n(`Faktycznie Pobrane Czesci z Magazynu (${serviceTransactions.length})`), 14, currentY);
      currentY += 4;

      const txRows = serviceTransactions.map(tx => {
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

      txRows.push(['', n('LACZNY KOSZT CZESCI SERWISU:'), '', '', n(`${totalServicePartsCost.toFixed(2)} PLN`)]);

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Wydania'), n('Nazwa Czesci'), n('Ilosc'), n('Pobral(a)'), n('Koszt (PLN)')]],
        body: txRows,
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [16, 120, 80] }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }

    const finalCompletionNotes = service.completionNotes || service.completionDetails?.notes;
    if (finalCompletionNotes) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Uwagi Wykonawcy / Podsumowanie'), 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const splitNotes = doc.splitTextToSize(n(finalCompletionNotes), doc.internal.pageSize.getWidth() - 28);
      doc.text(splitNotes, 14, currentY);
      
      currentY += splitNotes.length * 5 + 10;
    }

    if (machine && machine.techNotes && machine.techNotes.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text(n('Notatki Dzialu Technicznego Maszyny'), 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      machine.techNotes.forEach(note => {
        if (currentY > 270) { doc.addPage(); currentY = 20; }
        const date = safeParseDate(note.createdAt || note.date)?.toLocaleString('pl-PL') || '-';
        doc.setFont(undefined, 'bold');
        doc.text(n(`${note.createdBy || note.user || 'Nieznany'} - ${date}`), 14, currentY);
        currentY += 5;
        doc.setFont(undefined, 'normal');
        const splitNote = doc.splitTextToSize(n(note.text || note.note || ''), doc.internal.pageSize.getWidth() - 28);
        doc.text(splitNote, 14, currentY);
        currentY += splitNote.length * 4 + 6;
      });
      currentY += 5;
    }

    const allNotes = [...(service.history || []), ...(service.futureNotes || [])]
      .map(entry => ({
        ...entry,
        photos: Array.isArray(entry.photos) ? [...entry.photos] : []
      }))
      .sort(
        (a, b) => new Date(a.date || a.createdAt || a.timestamp || 0) - new Date(b.date || b.createdAt || b.timestamp || 0)
      );
    
    if (allNotes.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Historia Realizacji i Lista Kontrolna'), 14, currentY);
      currentY += 6;

      const historyRows = allNotes.map(h => {
        const d = safeParseDate(h.date || h.timestamp || h.createdAt);
        let detailsStr = h.note || h.comment || h.text || '';
        
        if (h.checklistSummary && h.checklistSummary.length > 0) {
          detailsStr += (detailsStr ? '\n\n' : '') + 'LISTA KONTROLNA:\n';
          h.checklistSummary.forEach(item => {
             detailsStr += `- ${item.taskName || item.step}: `;
             if (item.type === 'CHECKBOX') detailsStr += (item.answer ? 'Wykonano' : 'Pominieto');
             else if (item.type === 'PHOTO') detailsStr += (item.answer ? 'Zdjecie dolaczone' : 'Brak zdjecia');
             else detailsStr += (item.answer || 'Brak danych');
             
             if (item.note) detailsStr += ` (Notatka: ${item.note})`;
             detailsStr += '\n';
             
             if (item.photos && item.photos.length > 0) {
               h.photos = [...(h.photos || []), ...item.photos];
             }
             if (item.type === 'PHOTO' && item.answer && typeof item.answer === 'string') {
               h.photos = [...(h.photos || []), item.answer];
             }
          });
        }
        
        return [
          d ? d.toLocaleString('pl-PL') : '-',
          n(h.user || h.userName || h.author || h.createdBy || '-'),
          n(h.action || 'Notatka'),
          n(detailsStr || '-')
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data'), n('Autor'), n('Akcja'), n('Szczegoly')]],
        body: historyRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 100, 100] }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      for (const h of allNotes) {
         if (h.photos && h.photos.length > 0) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(12);
            const dStr = safeParseDate(h.date || h.timestamp || h.createdAt)?.toLocaleString('pl-PL') || '';
            doc.text(n(`Zdjecia z logu (${dStr}):`), 14, currentY);
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

    const clientSig = service.clientSignature || service.completionDetails?.clientSignature;
    const clientSigner = service.clientSignerName || service.completionDetails?.clientSignerName;
    const execName =
      service.completionDetails?.completedBy ||
      service.completedBy ||
      service.assignedService ||
      'Serwis';

    doc.setDrawColor(180, 180, 180);
    doc.line(14, currentY + 22, 90, currentY + 22);
    doc.line(115, currentY + 22, 195, currentY + 22);

    if (clientSig && typeof clientSig === 'string' && clientSig.startsWith('data:image')) {
      try {
        doc.addImage(clientSig, 'PNG', 120, currentY + 2, 65, 18, '', 'FAST');
      } catch (sigErr) {
        console.warn('Blad osadzania podpisu w PDF serwisu:', sigErr);
      }
    }

    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(n(`${profileConfig.techSignatureLabel} (${execName})`), 14, currentY + 27);
    if (inspectorLicense) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(n(`Uprawnienia: ${inspectorLicense}`), 14, currentY + 32);
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
    }
    doc.text(
      n(`${profileConfig.clientSignatureLabel}${clientSigner ? ' (' + clientSigner + ')' : ''}`),
      115,
      currentY + 27
    );

    const safeServiceFileName = n(service.name || 'Planowany').replace(/[^a-zA-Z0-9_-]/g, '_');
    await savePdfWithPrompt(doc, `Serwis_${safeServiceFileName}.pdf`);
  } catch (error) {
    console.error('Błąd generowania PDF serwisu:', error);
    alert('Wystąpił błąd podczas generowania raportu PDF.');
  }
};
