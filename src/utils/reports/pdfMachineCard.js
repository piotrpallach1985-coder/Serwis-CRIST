import { savePdfWithPrompt } from '../pdfHelper';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64 } from './pdfHelpers';
import { TICKET_STATUS } from '../constants';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../tenantHelper';
import { fetchTransactionsForMachine } from '../../hooks/usePartTransactions';
import {
  CKOB_CATEGORIES,
  REFRIGERANT_TYPES,
  getIndustryProfileConfig,
  getDtrDocCategoryInfo,
  isVehicleAsset,
  getMachineCounterUnit,
} from '../fieldServiceHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z')
    .replace(/[\u2013\u2014]/g, '-').replace(/\u00b1/g, '+/-').replace(/\u00b2/g, '2').replace(/\u00b3/g, '3');
};

const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
};

export const generateMachineHistoryPDF = async (machine, tickets = [], services = []) => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  if (!machine) return;

  try {
    const state = useManagerStore.getState();
    const allMachines = state.machines || [];
    const allParts = state.parts || [];
    const allRegions = state.regions || [];
    const allActionItems = state.actionItems || [];

    const parentMachine = machine.parentId ? allMachines.find(m => m.id === machine.parentId) : null;
    const childMachines = allMachines.filter(m => m.parentId === machine.id && !m.isDeleted);
    const bomParts = allParts.filter(p => !p.isDeleted && (p.compatibleMachines || []).includes(machine.id));
    const machineActionItems = allActionItems.filter(a => a.machineId === machine.id && !a.isDeleted);
    const regionObj = allRegions.find(r => r.id === machine.regionId || r.name === machine.regionId);
    const regionLabel = regionObj?.name || machine.regionName || 'Nieznany';

    // Pobierz transakcje części dla maszyny
    let partTransactions = [];
    try {
      partTransactions = await fetchTransactionsForMachine(getCurrentTenant(), machine.id);
    } catch (e) {
      console.warn('Nie udalo sie pobrac transakcji czesci do PDF:', e);
    }

    const ticketIds = new Set((tickets || []).map(t => t.id));
    const serviceIds = new Set((services || []).map(s => s.id));

    const usedPartsTx = (partTransactions || [])
      .filter(tx => {
        if (!['issue_planned', 'issue_adhoc', 'issue'].includes(tx.type)) return false;
        if (tx.machineId === machine.id) return true;
        if (tx.referenceId && (ticketIds.has(tx.referenceId) || serviceIds.has(tx.referenceId))) return true;
        if (tx.machineName && machine.name && tx.machineName.toLowerCase().includes(machine.name.toLowerCase())) return true;
        return false;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const totalPartsCost = usedPartsTx.reduce(
      (sum, tx) => sum + Number(tx.totalCost || Math.abs(Number(tx.quantity || 0)) * Number(tx.price || 0) || 0),
      0
    );

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
    
    const industryProfile = state.branding?.industryProfile || 'industrial';
    const profileConfig = getIndustryProfileConfig(industryProfile);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      n(`System Utrzymania Ruchu VexoNT (${profileConfig.shortName})`),
      doc.internal.pageSize.getWidth() - 14,
      38,
      { align: 'right' }
    );

    // Tytuł dokumentu zależny od profilu branżowego
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(n(profileConfig.machinePdfTitle || 'Karta Urzadzenia PDF (Pelny Raport)'), 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(n(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`), 14, 27);

    let currentY = 34;

    // ----- 1. Dane podstawowe urządzenia -----
    const showCkob = industryProfile === 'facility';
    const showFGas =
      industryProfile === 'hvac' ||
      (industryProfile === 'facility' && machine.inspectionCategory === 'hvac_kotlownia');
    const showContact = industryProfile === 'facility' || industryProfile === 'hvac';

    const ckobLabel =
      showCkob && machine.inspectionCategory
        ? CKOB_CATEGORIES.find(c => c.id === machine.inspectionCategory)?.label ||
          machine.inspectionCategory
        : null;
    const refLabel =
      showFGas && machine.refrigerantType
        ? REFRIGERANT_TYPES[machine.refrigerantType]?.name || machine.refrigerantType
        : null;
    const counterUnit = getMachineCounterUnit(machine, industryProfile);
    const isVehicle = isVehicleAsset(machine, industryProfile);
    const baseInfoRows = [
      [
        n(`${profileConfig.machineLabel}:`),
        n(`${machine.name || 'Brak'}${machine.licensePlate ? ' [' + machine.licensePlate + ']' : ''}`),
      ],
      [
        n('Numer Wewnetrzny / ID QR:'),
        n(`${machine.internalId || '-'} / ${machine.qrCode || machine.id || '-'}`),
      ],
      [
        n(`${profileConfig.regionLabel} / ${profileConfig.bayLabel}:`),
        n(`${regionLabel}${machine.bay ? ' / ' + machine.bay : ''}`),
      ],
      [
        n('Urzadzenie Nadrzedne (ISO 55000):'),
        n(
          parentMachine
            ? `${parentMachine.name} (${parentMachine.internalId || parentMachine.id})`
            : 'Brak (Urzadzenie glowne)'
        ),
      ],
      [n('Aktualny Stan Licznika:'), n(`${machine.currentWorkHours || 0} ${counterUnit}`)],
      [n('Laczny Koszt Zuzytych Czesci (TCO):'), n(`${totalPartsCost.toFixed(2)} PLN`)],
      [n('Dodatkowy Opis:'), n(machine.additionalDescription || machine.description || '-')],
    ];
    if (isVehicle) {
      baseInfoRows.push([
        n('Dane Pojazdu (Nr rej. / VIN / 1. Rej. / Paliwo):'),
        n(
          `${machine.licensePlate || '-'} | VIN: ${machine.vinNumber || '-'} | 1. Rej.: ${
            machine.firstRegistrationDate || '-'
          } | Paliwo: ${machine.fuelType || '-'}`
        ),
      ]);
      baseInfoRows.push([
        n('Terminy Pojazdu (SKP / Polisa OC/AC / Kierowca):'),
        n(
          `SKP: ${machine.techInspectionDate || '-'} | OC/AC: ${
            machine.insuranceExpiryDate || '-'
          } | Kierowca: ${machine.assignedDriver || '-'}`
        ),
      ]);
    }
    if (machine.address || machine.mapAddress || (machine.gpsLat && machine.gpsLng)) {
      const gpsSuffix =
        machine.gpsLat && machine.gpsLng
          ? ` (GPS: ${Number(machine.gpsLat).toFixed(5)}, ${Number(machine.gpsLng).toFixed(5)})`
          : '';
      baseInfoRows.push([
        n('Adres Lokalizacji / GPS:'),
        n(`${machine.address || machine.mapAddress || '-'}${gpsSuffix}`),
      ]);
    }
    if (showContact && (machine.contactPerson || machine.contactPhone || machine.accessNotes)) {
      const contactParts = [
        machine.contactPerson,
        machine.contactPhone ? `Tel: ${machine.contactPhone}` : null,
        machine.accessNotes ? `Dostep: ${machine.accessNotes}` : null,
      ].filter(Boolean);
      baseInfoRows.push([
        n(industryProfile === 'facility' ? 'Lokator / Kontakt / Domofon:' : 'Klient / Kontakt / Dostep:'),
        n(contactParts.join(' | ')),
      ]);
    }
    if (ckobLabel) {
      baseInfoRows.push([n('Kategoria Obiektu (c-KOB):'), n(ckobLabel)]);
    }
    const hasCkobMetric =
      showCkob ||
      machine.buildingType ||
      machine.constructionYear ||
      machine.usableAreaM2 ||
      machine.cubatureM3 ||
      machine.floorsCount ||
      machine.pinbAuthority ||
      machine.legalTitleDoc;
    if (hasCkobMetric && industryProfile !== 'industrial') {
      if (machine.buildingType) {
        baseInfoRows.push([n('Rodzaj i funkcja obiektu (c-KOB art. 60j):'), n(machine.buildingType)]);
      }
      if (machine.constructionYear || machine.floorsCount) {
        baseInfoRows.push([
          n('Rok oddania / Liczba kondygnacji:'),
          n(`${machine.constructionYear || '-'} / ${machine.floorsCount || '-'}`),
        ]);
      }
      if (machine.usableAreaM2 || machine.cubatureM3) {
        baseInfoRows.push([
          n('Powierzchnia uzytkowa / Kubatura:'),
          n(
            `${machine.usableAreaM2 ? machine.usableAreaM2 + ' m2' : '-'} / ${
              machine.cubatureM3 ? machine.cubatureM3 + ' m3' : '-'
            }`
          ),
        ]);
      }
      if (machine.hasAsbestos || machine.pinbAuthority) {
        const asbStr =
          machine.hasAsbestos === true || machine.hasAsbestos === 'Występuje'
            ? 'Wystepuje'
            : 'Brak';
        baseInfoRows.push([
          n('Wyroby z azbestem / Organ PINB:'),
          n(`${asbStr} / ${machine.pinbAuthority || '-'}`),
        ]);
      }
      if (machine.legalTitleDoc) {
        baseInfoRows.push([n('Tytul prawny / Ksiega Wieczysta:'), n(machine.legalTitleDoc)]);
      }
    }
    if (refLabel) {
      const fGasSummary = `${refLabel}${
        machine.refrigerantChargeKg ? ` | Ilosc: ${machine.refrigerantChargeKg} kg` : ''
      }${
        machine.co2EquivalentTons ? ` | CO2e: ${machine.co2EquivalentTons} t` : ''
      } | ${machine.requiresCroCard ? 'Wymagana karta CRO (>= 5 t CO2e)' : 'Ponizej progu CRO'}`;
      baseInfoRows.push([n('Parametry F-Gaz (UE 2024/573 & CRO):'), n(fGasSummary)]);
    }

    const headerColor =
      industryProfile === 'facility'
        ? [180, 83, 9]
        : industryProfile === 'hvac'
        ? [14, 116, 144]
        : [30, 41, 59];

    autoTable(doc, {
      startY: currentY,
      head: [[n('Dane Podstawowe Urzadzenia'), '']],
      body: baseInfoRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: headerColor },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // ----- 2. Podzespoły (Drzewo aktywów ISO 55000) -----
    if (childMachines.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n(`Podzespoly / Urzadzenia Podrzedne (${childMachines.length})`), 14, currentY);
      currentY += 4;

      const childRows = childMachines.map(cm => [
        n(cm.name || '-'),
        n(cm.internalId || cm.qrCode || cm.id || '-'),
        n(`${cm.currentWorkHours || 0} RBG`),
        n(cm.bay || '-')
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[n('Nazwa Podzespolu'), n('Nr Wewnetrzny / ID'), n('Licznik RBG'), n('Lokalizacja / Info')]],
        body: childRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [70, 110, 180] }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // ----- 3. Części zamienne przypisane do urządzenia (BOM) -----
    if (bomParts.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n(`Przypisane Czesci Zamienne - BOM (${bomParts.length})`), 14, currentY);
      currentY += 4;

      const bomRows = bomParts.map(p => [
        n(p.name || '-'),
        n(p.serialNumber || p.code || '-'),
        n(p.category || '-'),
        n(`${p.stock || 0} ${p.unit || 'szt.'}`),
        n(`${p.minStock || 0} ${p.unit || 'szt.'}`),
        n(p.location || '-')
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[n('Nazwa Czesci'), n('Kod / Nr Katalogowy'), n('Kategoria'), n('Stan Mag.'), n('Stan Min.'), n('Lokalizacja')]],
        body: bomRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 140, 100] }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // ----- 4. Historia zużytych części i materiałów eksploatacyjnych -----
    if (currentY > 245) { doc.addPage(); currentY = 20; }
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text(n(`Historia Zuzytych Czesci i Materialow (${usedPartsTx.length})`), 14, currentY);
    currentY += 4;

    if (usedPartsTx.length > 0) {
      const txRows = usedPartsTx.map(tx => {
        const partObj = allParts.find(p => p.id === tx.partId);
        const unit = partObj?.unit || tx.unit || 'szt.';
        const qty = Math.abs(Number(tx.quantity || 0));
        const cost = Number(tx.totalCost || qty * Number(tx.price || 0) || 0);
        const dateStr = safeParseDate(tx.date)?.toLocaleString('pl-PL') || '-';
        const typeLabel = tx.type === 'issue_planned' ? 'Serwis planowany' : 'Naprawa / Awaria';
        return [
          dateStr,
          n(tx.partName || partObj?.name || 'Nieznana czesc'),
          n(`${qty} ${unit}`),
          n(typeLabel),
          n(tx.user || '-'),
          n(`${cost.toFixed(2)} PLN`)
        ];
      });

      txRows.push([
        '',
        n('SUMA KOSZTOW CZESCI (TCO):'),
        '',
        '',
        '',
        n(`${totalPartsCost.toFixed(2)} PLN`)
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Wydania'), n('Nazwa Czesci'), n('Ilosc'), n('Typ Zlecenia'), n('Pobral(a)'), n('Koszt (PLN)')]],
        body: txRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 120, 80] }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else {
      currentY += 5;
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(n('Brak zarejestrowanych pobran czesci zamiennych dla tego urzadzenia.'), 14, currentY);
      currentY += 10;
    }

    // ----- 5. Notatki techniczne i dokumentacja DTR -----
    if (machine.dtrFiles && machine.dtrFiles.length > 0) {
      if (currentY > 255) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n(`Zalaczone Pliki Dokumentacji DTR (${machine.dtrFiles.length})`), 14, currentY);
      currentY += 4;

      const dtrRows = machine.dtrFiles.map(f => {
        const catInfo = getDtrDocCategoryInfo(f.docCategory || 'DTR');
        return [
          n(catInfo.shortLabel),
          n(f.name || '-'),
          f.size ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : '-',
          safeParseDate(f.uploadedAt)?.toLocaleDateString('pl-PL') || '-',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[n('Kategoria'), n('Nazwa Pliku PDF'), n('Rozmiar'), n('Data Wgrania')]],
        body: dtrRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [90, 90, 120] },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    if (machine.techNotes && machine.techNotes.length > 0) {
      if (currentY > 255) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Notatki Dzialu Technicznego'), 14, currentY);
      currentY += 4;
      
      const techNoteRows = machine.techNotes.map(tn => {
        const date = safeParseDate(tn.createdAt || tn.date);
        return [
          date ? date.toLocaleString('pl-PL') : '-',
          n(tn.createdBy || tn.user || '-'),
          n(tn.text || tn.note || '-')
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data'), n('Dodany przez'), n('Notatka')]],
        body: techNoteRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [100, 100, 100] },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // ----- 6. Tematy do realizacji (Action Items) -----
    if (machineActionItems.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(n(`Tematy do Realizacji /Zalecenia (${machineActionItems.length})`), 14, currentY);
      currentY += 4;

      const actionRows = machineActionItems.map(a => [
        safeParseDate(a.createdAt)?.toLocaleDateString('pl-PL') || '-',
        n(a.problem || '-'),
        a.dueDate ? safeParseDate(a.dueDate)?.toLocaleDateString('pl-PL') : '-',
        n(a.status === 'completed' ? 'Wykonane' : 'Oczekujace'),
        n(a.completedBy || a.createdBy || '-')
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Zgloszenia'), n('Opis Tematu / Zalecenia'), n('Termin'), n('Status'), n('Osoba')]],
        body: actionRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [217, 119, 6] }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // ----- 7. Tabela Awarii (Tickets) -----
    if (currentY > 245) { doc.addPage(); currentY = 20; }
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text(n(`Historia Zgloszonych Awarii (${(tickets || []).length})`), 14, currentY);
    currentY += 4;

    const ticketRows = (tickets || []).map(t => {
      const date = safeParseDate(t.createdAt);
      const problemDesc = t.topic ? `${t.topic}${t.description ? ' - ' + t.description : ''}` : (t.description || '-');
      const techNotes = t.history && t.history.length > 0
        ? t.history.filter(h => h.note && h.note.trim() !== '').map(h => h.note.trim()).join('\n')
        : '-';

      return [
        date ? date.toLocaleString('pl-PL') : '-',
        n(t.reportedBy || '-'),
        n(problemDesc),
        n(Number(t.status) === TICKET_STATUS.CLOSED ? 'Zamkniete' : 'W toku'),
        n(t.completedBy || t.assignedTo || (t.history?.length ? t.history[t.history.length - 1].user : '-')),
        n(techNotes)
      ];
    });

    if (ticketRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Data Zgloszenia'), n('Zglaszajacy'), n('Opis Usterki'), n('Status'), n('Wykonawca'), n('Przebieg i Notatki')]],
        body: ticketRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 50, 50] },
      });
      currentY = doc.lastAutoTable.finalY + 12;
    } else {
      currentY += 5;
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(n('Brak zgloszonych awarii dla tej maszyny.'), 14, currentY);
      currentY += 12;
    }

    // ----- 8. Tabela Serwisów (Planned) -----
    if (currentY > 245) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text(n(`Historia Serwisow Planowanych (${(services || []).length})`), 14, currentY);
    currentY += 4;

    const serviceRows = (services || []).map(s => {
      const date = safeParseDate(s.completedAt || s.nextDate || s.createdAt);
      const historyNotes = (s.history || [])
        .filter(h => h.note && h.note.trim() !== '')
        .map(h => h.note.trim())
        .join('\n');
      const serviceNotes = s.completionNotes || s.completionDetails?.notes || historyNotes || '-';
      return [
        date ? date.toLocaleString('pl-PL') : '-',
        n(s.name || '-'),
        n(s.triggerType === 'hours' ? 'RBG' : (s.triggerType === 'calendar' ? 'Czasowy' : 'RBG + Czas')),
        n(s.status === 'completed' ? 'Zakonczony' : (s.status === 'in_progress' ? 'W trakcie' : 'Oczekujacy')),
        n(s.completionDetails?.completedBy || s.completedBy || s.assignedService || '-'),
        n(serviceNotes)
      ];
    });

    if (serviceRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[n('Data / Termin'), n('Rodzaj Serwisu'), n('Tryb'), n('Status'), n('Wykonawca'), n('Notatki / Podsumowanie')]],
        body: serviceRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [50, 100, 200] },
      });
    } else {
      currentY += 5;
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(n('Brak zaplanowanych lub zrealizowanych serwisow dla tej maszyny.'), 14, currentY);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        n(`Wygenerowano z systemu VexoNT © 2026 | Strona ${i} z ${pageCount}`),
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    const safeMachineFileName = n(machine.name || machine.qrCode || 'Nieznana').replace(/[^a-zA-Z0-9_-]/g, '_');
    await savePdfWithPrompt(doc, `Karta_Urzadzenia_PDF_${safeMachineFileName}.pdf`);
  } catch (error) {
    console.error('Błąd generowania PDF:', error);
    alert('Wystąpił błąd podczas generowania dokumentu.');
  }
};
