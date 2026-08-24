import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { safeParseDate } from '../dateHelpers';
import { getBrandingLogoBase64, getImageDimensions } from './pdfHelpers';

const n = (text) => {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L').replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z').replace(/Ż/g, 'Z');
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
  if (!service) return;

  try {
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
      doc.text('CRIST S.A.', doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(n('System Utrzymania Ruchu VexoNT'), doc.internal.pageSize.getWidth() - 14, 38, { align: 'right' });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(n('Karta Serwisu Planowanego'), 14, 22);
    
    doc.setFontSize(14);
    const isCompleted = service.status === 'completed';
    doc.setTextColor(isCompleted ? 30 : 200, isCompleted ? 150 : 100, 50);
    doc.text(n(isCompleted ? 'Zakonczony' : 'Oczekujacy / W trakcie'), 14, 30);

    let currentY = 45;

    autoTable(doc, {
      startY: currentY,
      head: [[n('Informacje o Serwisie'), '']],
      body: [
        [n('Nazwa Serwisu:'), n(service.name || 'Brak')],
        [n('Maszyna:'), n(service.machineName || machine?.name || 'Nieznana')],
        [n('Typ Wyzwalacza:'), n(service.triggerType === 'calendar' ? 'Czasowy (Kalendarz)' : service.triggerType === 'hours' ? 'Licznikowy (RBG)' : 'Mieszany')],
        [n('Data Planowana:'), service.nextDate ? safeParseDate(service.nextDate)?.toLocaleDateString('pl-PL') : '-'],
        [n('Wykonano Dnia:'), service.completedAt ? safeParseDate(service.completedAt)?.toLocaleString('pl-PL') : '-'],
        [n('Wykonawca:'), n(service.completionDetails?.completedBy || service.completedBy || '-')],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 140, 80] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    if (service.completionDetails?.checklistSummary) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Wyniki Listy Kontrolnej'), 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const splitChecklist = doc.splitTextToSize(n(service.completionDetails.checklistSummary), doc.internal.pageSize.getWidth() - 28);
      doc.text(splitChecklist, 14, currentY);
      
      currentY += splitChecklist.length * 5 + 10;
    }

    if (service.completionDetails?.notes) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Uwagi Wykonawcy'), 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const splitNotes = doc.splitTextToSize(n(service.completionDetails.notes), doc.internal.pageSize.getWidth() - 28);
      doc.text(splitNotes, 14, currentY);
      
      currentY += splitNotes.length * 5 + 10;
    }

    const allNotes = [...(service.history || []), ...(service.futureNotes || [])].sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
    
    if (allNotes.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(n('Historia i Notatki'), 14, currentY);
      currentY += 6;

      const historyRows = allNotes.map(h => {
        const d = safeParseDate(h.date || h.timestamp || h.createdAt);
        return [
          d ? d.toLocaleString('pl-PL') : '-',
          n(h.user || h.userName || h.author || h.createdBy || '-'),
          n(h.action || 'Notatka'),
          n(h.note || h.comment || h.text || '-')
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
              }
            }
            currentY += maxHeightInRow + 10;
         }
      }
    }

    doc.save(n(`Serwis_${service.name?.replace(/\s+/g, '_') || 'Karta'}_${new Date().toISOString().split('T')[0]}.pdf`));
  } catch (error) {
    console.error('Błąd generowania PDF serwisu:', error);
    alert('Wystąpił błąd podczas generowania dokumentu.');
  }
};
