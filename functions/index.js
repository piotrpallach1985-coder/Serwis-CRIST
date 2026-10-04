const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Helper do pobierania tokenÃ³w na podstawie uprawnieÅ„ z rÃ³l.
 * Zwraca tablicÄ™ unikalnych tokenÃ³w FCM.
 */
async function getTokensForPermission(permissionId) {
  const tokens = new Set();
  
  // Pobieramy wszystkie role, ktÃ³re majÄ… to uprawnienie
  const rolesSnap = await db.collection('roles').get();
  const validRoleIds = [];
  rolesSnap.forEach(doc => {
    const data = doc.data();
    if (data.permissions && data.permissions.includes(permissionId) && !data.isDeleted) {
      validRoleIds.push(doc.id);
    }
  });

  if (validRoleIds.length === 0) return [];

  // Pobieramy uÅ¼ytkownikÃ³w z tymi rolami, ktÃ³rzy majÄ… fcmTokens
  const usersSnap = await db.collection('users').where('roleId', 'in', validRoleIds).get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
      data.fcmTokens.forEach(t => tokens.add(t));
    }
  });

  return Array.from(tokens);
}

exports.onTicketCreated = functions.firestore
  .document('tenants/{tenantId}/tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticket = snap.data();
    const isCritical = ticket.isCritical;
    
    // ZaleÅ¼nie od krytycznoÅ›ci, wysyÅ‚amy do innych grup
    const targetPermission = isCritical ? 'push_new_critical' : 'push_new_all';
    let tokens = await getTokensForPermission(targetPermission);
    
    // JeÅ›li to awaria zwykÅ‚a, dodajemy teÅ¼ tokeny tych co chcÄ… krytyczne (bo to zazwyczaj nadrzÄ™dne), 
    // ale moÅ¼emy zostawiÄ‡ ekskluzywne wg uprawnieÅ„ (user ma zaznaczone oba)
    if (!tokens.length) return null;

    const payload = {
      notification: {
        title: isCritical ? 'KRYTYCZNA AWARIA!' : 'Nowa Awaria ZgÅ‚oszona',
        body: `ZgÅ‚aszajÄ…cy: ${ticket.reporterName}\nTemat: ${ticket.topic}`,
      },
      data: {
        click_action: `/?module=master_data&tab=tickets&openTicket=${context.params.ticketId}`
      }
    };

    try {
      const response = await messaging.sendEachForMulticast({ tokens, notification: payload.notification, data: payload.data });
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

exports.onTicketStatusUpdated = functions.firestore
  .document('tenants/{tenantId}/tickets/{ticketId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    if (newValue.status === previousValue.status) return null;
    
    // Szukamy osÃ³b zainteresowanych zmianÄ… statusu (albo przypisanych, albo wszystkich z uprawnieniem push_status_updates)
    // Zgodnie ze wskazÃ³wkami, wysyÅ‚amy do przypisanego technika, i osÃ³b powiÄ…zanych.
    const tokens = new Set();
    
    // JeÅ›li jest przypisany technik, pobierz jego token
    if (newValue.assignedTo) {
      const userDoc = await db.collection('users').doc(newValue.assignedTo).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        if (uData.fcmTokens) uData.fcmTokens.forEach(t => tokens.add(t));
      }
    }
    
    // ZgÅ‚aszajÄ…cy: jeÅ›li ma konto (nie obsÅ‚ugiwane jeszcze w tej wersji, bazujemy na ImiÄ™/Nazwisko tekstowym)
    
    // Opcjonalnie wszyscy z uprawnieniem ogÃ³lnym (np. koordynatorzy)
    const coordTokens = await getTokensForPermission('push_status_updates');
    coordTokens.forEach(t => tokens.add(t));
    
    const uniqueTokens = Array.from(tokens);
    if (!uniqueTokens.length) return null;
    
    const statusMap = {
      1: 'Nowa', 2: 'W trakcie', 3: 'Wstrzymana', 4: 'Odrzucona', 5: 'ZakoÅ„czona'
    };

    const payload = {
      notification: {
        title: 'Aktualizacja ZgÅ‚oszenia',
        body: `Status awarii zostaÅ‚ zmieniony na: ${statusMap[newValue.status]}`,
      },
      data: {
        click_action: `/?module=master_data&tab=tickets&openTicket=${context.params.ticketId}`
      }
    };

    return messaging.sendEachForMulticast({ tokens: uniqueTokens, notification: payload.notification, data: payload.data });
  });

// REST API Integration
const apiModule = require('./api');
exports.api = apiModule.api;

// --- AI Proxy ---
const fetch = require('node-fetch');
const FormData = require('form-data');

exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  // Nawet anonimowi uzytkownicy (QR) musza moc uzyc tej funkcji
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Wymagane uwierzytelnienie');
  }

  const { audioBase64, model, language } = data;
  if (!audioBase64) {
    throw new functions.https.HttpsError('invalid-argument', 'Brak pliku audio');
  }

  try {
    // Odczytaj klucz bezpiecznie z bazy (tylko serwer ma tu dostep)
    const globalDoc = await db.collection('tenant_registry').doc('_global_secrets_').get();
    if (!globalDoc.exists || !globalDoc.data().groqApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Brak skonfigurowanego klucza API');
    }
    const groqApiKey = globalDoc.data().groqApiKey;

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    const formData = new FormData();
    formData.append('file', audioBuffer, { filename: 'audio.webm', contentType: 'audio/webm' });
    formData.append('model', model || 'whisper-large-v3');
    if (language) formData.append('language', language);
    formData.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('Groq API Error:', errorData);
      throw new functions.https.HttpsError('internal', 'Blad zewnetrznego API Groq');
    }

    const result = await res.json();
    
    // Log AI Usage (Whisper)
    const durationSeconds = data.durationSeconds || 0;
    if (durationSeconds > 0) {
      const tenantId = context.auth?.token?.tenantId || data.tenantId;
      if (tenantId) {
        // The frontend expects 'whisperSeconds' and 'groqCost' based on 'groqPrice' per minute
        const groqPricePerMinute = globalDoc.data().groqPrice || 0.40;
        const cost = (durationSeconds / 60) * groqPricePerMinute;
        
        await db.collection('tenants').doc(tenantId).collection('stats').doc('ai_usage').set({
          whisperSeconds: FieldValue.increment(durationSeconds),
          groqCost: FieldValue.increment(cost)
        }, { merge: true });
      }
    }

    return { text: result.text };
  } catch (err) {
    console.error('Transcription error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Blad transkrypcji');
  }
});


exports.extractServiceData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Wymagane uwierzytelnienie');
  }

  const { rawText } = data;
  if (!rawText) {
    throw new functions.https.HttpsError('invalid-argument', 'Brak tekstu wejsciowego');
  }

  try {
    const globalDoc = await db.collection('tenant_registry').doc('_global_secrets_').get();
    if (!globalDoc.exists || !globalDoc.data().groqApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Brak klucza API Groq');
    }
    const apiKey = globalDoc.data().groqApiKey;

    const prompt = `JesteÅ› asystentem technicznym w systemie CMMS.
Otrzymujesz surowÄ… notatkÄ™ z dyktowania od technika utrzymania ruchu po zakoÅ„czeniu serwisu maszyny.
WyciÄ…gnij z niej konkretne informacje i zwrÃ³Ä‡ TYLKO czysty obiekt JSON.
Oto notatka:
"${rawText}"
`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      console.error('Groq Chat Error:', await res.text());
      throw new functions.https.HttpsError('internal', 'Blad zewnetrznego API Groq Chat');
    }

    const jsonRes = await res.json();
    return JSON.parse(jsonRes.choices[0].message.content);
  } catch (err) {
    console.error('Extraction error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Blad ekstrakcji');
  }
});

exports.logAIUsage = functions.https.onCall(async (data, context) => {
  const { HttpsError } = functions.https;
  if (!context.auth) throw new HttpsError('unauthenticated', 'User not authenticated.');
  const tenantId = context.auth.token.tenantId || (data && data.tenantId);
  if (!tenantId) throw new HttpsError('invalid-argument', 'Missing tenantId.');

  // Validate that user belongs to tenant
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data().tenantId !== tenantId) {
    // Check if superadmin
    if (!userDoc.exists || userDoc.data().role !== 'superadmin') {
      throw new HttpsError('permission-denied', 'Unauthorized tenant access.');
    }
  }

  const { geminiTokens } = data || {};
  if (!geminiTokens || geminiTokens <= 0) return { success: true };

  const globalDoc = await db.collection('tenant_registry').doc('_global_secrets_').get();
  const globalData = globalDoc.exists ? globalDoc.data() : {};
  const geminiPrice = globalData.geminiPrice || 0.60;

  const safeTokens = Math.max(0, parseInt(geminiTokens, 10));

  await db.collection('tenants').doc(tenantId).collection('stats').doc('ai_usage').set({
    geminiTokens: FieldValue.increment(safeTokens),
    geminiCost: FieldValue.increment((safeTokens / 1000000) * geminiPrice)
  }, { merge: true });

  return { success: true };
});


// --- Skalowalnosc: Automatyczne przeglady planowane (Cron o 2:00 w nocy) ---
exports.scheduledCheckPlannedMaintenance = functions.pubsub.schedule('0 2 * * *')
  .timeZone('Europe/Warsaw')
  .onRun(async (context) => {
    console.log('Rozpoczecie weryfikacji serwisow planowanych...');
    
    // Pobranie listy firm (tenants)
    const tenantsSnap = await db.collection('tenant_registry').get();
    
    const CRITICAL_DAYS_WARNING = 7;
    const CRITICAL_HOURS_WARNING = 50;
    const now = new Date();
    
    for (const tenantDoc of tenantsSnap.docs) {
      if (tenantDoc.id === '_global_secrets_' || tenantDoc.id === '_global_settings_') continue;
      
      const tenantId = tenantDoc.id;
      console.log('Sprawdzanie dzierzawcy: ' + tenantId);
      
      try {
        // Pobranie maszyn (zeby zderzyc roboczogodziny)
        const machinesSnap = await db.collection('tenants').doc(tenantId).collection('machines').where('isDeleted', '==', false).get();
        const machinesMap = {};
        machinesSnap.docs.forEach(doc => {
          machinesMap[doc.id] = doc.data();
        });
        
        // Pobranie wszystkich zaplanowanych (pending) serwisow
        // W constants.js PENDING ma wartosc 1
        const servicesSnap = await db.collection('tenants').doc(tenantId).collection('planned_services').where('status', '==', 1).get();
        
        let batch = db.batch();
        let writesCount = 0;
        const BATCH_LIMIT = 400; // bezpieczny limit (max 500)
        
        for (const sDoc of servicesSnap.docs) {
          const data = sDoc.data();
          const machine = machinesMap[data.machineId];
          if (!machine) continue; // Maszyna nie istnieje

          let shouldAlert = false;
          let alertMessage = '';
          
          if (!data.notified) {
            // KALENDARZ
            if (data.triggerType === 'calendar' || data.triggerType === 'mixed') {
              if (data.nextDate) {
                const nextDate = data.nextDate.toDate ? data.nextDate.toDate() : new Date(data.nextDate);
                const daysLeft = (nextDate - now) / (1000 * 60 * 60 * 24);
                
                if (daysLeft <= CRITICAL_DAYS_WARNING) {
                  shouldAlert = true;
                  alertMessage = 'Zbli¿a siê termin planowanego przegl¹du "' + (data.name || 'Brak nazwy') + '" (zosta³o ' + Math.max(0, Math.ceil(daysLeft)) + ' dni).';
                }
              }
            }

            // ROBOCZOGODZINY
            if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
              if (data.targetWorkHours && machine.currentWorkHours) {
                const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
                if (hoursLeft <= CRITICAL_HOURS_WARNING && hoursLeft >= 0) {
                  shouldAlert = true;
                  alertMessage = 'Zbli¿a siê termin przegl¹du liczonego w roboczogodzinach "' + (data.name || 'Brak nazwy') + '" (zosta³o ' + hoursLeft + ' rbg).';
                }
              }
            }

            if (shouldAlert) {
              // Aktualizuj status serwisu (1 = PENDING, 2 = IN_PROGRESS - zgodne z SERVICE_STATUS)
              batch.update(sDoc.ref, { status: 2, notified: true });
              writesCount++;
              
              // Wygeneruj powiadomienie
              const notifRef = db.collection('tenants').doc(tenantId).collection('notifications').doc();
              batch.set(notifRef, {
                title: 'Zbli¿aj¹cy siê Przegl¹d',
                message: alertMessage,
                type: 'warning',
                createdAt: FieldValue.serverTimestamp(),
                read: false,
                serviceId: sDoc.id,
                machineId: data.machineId || null
              });
              writesCount++;
              
              if (writesCount >= BATCH_LIMIT) {
                await batch.commit();
                batch = db.batch(); // Re-create batch after commit!
                writesCount = 0;
              }
            }
          }
        }
        
        if (writesCount > 0) {
          await batch.commit();
        }
        
      } catch (err) {
        console.error('Blad dla dzierzawcy ' + tenantId + ':', err);
      }
    }
    
    console.log('Weryfikacja zakonczona sukcesem.');
    return null;
  });

// --- Skalowalnosc: Agregacja KPI na ¿¹danie (zmniejszenie pobierania danych do przegl¹darki) ---
exports.getKPIStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Wymagane uwierzytelnienie');
  const tenantId = context.auth.token.tenantId || (data && data.tenantId);
  if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'Brak tenantId');

  const { period } = data; // '7', '30', '90', 'all'
  const now = new Date();
  let startDate = null;
  
  if (period !== 'all') {
    startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period, 10));
  }

  try {
    // Odczyt z bazy (tylko na serwerze - nie zatykamy sieci u¿ytkownika)
    let q = db.collection('tenants').doc(tenantId).collection('tickets').where('isDeleted', '!=', true);
    
    // Optymalizacja: jeœli Firestore ma index, mo¿na by tu filtrowaæ po dacie, 
    // ale dla uproszczenia (bo tickets mo¿e nie mieæ indeksów) wyci¹gamy na serwerze i filtrujemy w RAM serwera.
    const snapshot = await q.get();
    
    let totalTickets = 0;
    let closedTicketsCount = 0;
    let criticalTicketsCount = 0;
    let totalRepairTimeMinutes = 0;
    const machineFaultCounts = {};
    const statusCounts = {};
    const trendMap = {};

    snapshot.docs.forEach(docSnap => {
      const t = docSnap.data();
      const createdAt = t.createdAt && t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      
      // Filtracja czasu
      if (startDate && createdAt < startDate) return;

      totalTickets++;
      if (t.isCritical) criticalTicketsCount++;
      
      // Status
      const statusNum = Number(t.status);
      statusCounts[statusNum] = (statusCounts[statusNum] || 0) + 1;

      // MTTR dla zakoñczonych (status 5)
      if (statusNum === 5) {
        closedTicketsCount++;
        if (t.closedAt) {
          const closedAt = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
          const diffMins = (closedAt - createdAt) / (1000 * 60);
          if (diffMins > 0) totalRepairTimeMinutes += diffMins;
        }
      }

      // Maszyny
      const mName = t.machineName || 'Nieznana maszyna';
      machineFaultCounts[mName] = (machineFaultCounts[mName] || 0) + 1;

      // Trend (ostatnie dni)
      if (period === '7' || period === '30') {
        const dateKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      }
    });

    const avgRepairMinutes = closedTicketsCount > 0 ? Math.round(totalRepairTimeMinutes / closedTicketsCount) : 0;
    
    // Sort top machines
    const topMachines = Object.entries(machineFaultCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort trend
    const trendData = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // Ostatnie 10 dni aktywnoœci

    return {
      totalTickets,
      closedTicketsCount,
      criticalTicketsCount,
      avgRepairMinutes,
      topMachines,
      statusCounts,
      trendData
    };

  } catch (err) {
    console.error('KPI error:', err);
    throw new functions.https.HttpsError('internal', 'B³¹d podczas liczenia KPI', err);
  }
});

// --- Skalowalnosc: Agregacja KPI Serwisów Planowanych ---
exports.getPlannedKPIStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Wymagane uwierzytelnienie');
  const tenantId = context.auth.token.tenantId || (data && data.tenantId);
  if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'Brak tenantId');

  const { period } = data; // '7', '30', '90', 'all'
  const now = new Date();
  let startDate = null;
  
  if (period !== 'all') {
    startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period, 10));
  }

  try {
    const q = db.collection('tenants').doc(tenantId).collection('planned_services').where('isDeleted', '!=', true);
    const snapshot = await q.get();
    
    let totalServicesCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let onTimeCount = 0;
    let totalDelayDays = 0;
    
    const machineServiceCounts = {};
    const typeCounts = { 'calendar': 0, 'hours': 0, 'mixed': 0 };
    const trendMap = {};

    snapshot.docs.forEach(docSnap => {
      const s = docSnap.data();
      
      const referenceDateRaw = s.completedAt || s.createdAt;
      if (!referenceDateRaw) return;
      const refDate = referenceDateRaw.toDate ? referenceDateRaw.toDate() : new Date(referenceDateRaw);
      
      if (startDate && refDate < startDate) return;

      totalServicesCount++;
      
      const mName = s.machineName || 'Nieznana maszyna';
      machineServiceCounts[mName] = (machineServiceCounts[mName] || 0) + 1;

      if (s.triggerType) {
        typeCounts[s.triggerType] = (typeCounts[s.triggerType] || 0) + 1;
      }

      if (s.status === 'completed') {
        completedCount++;
        
        let delayed = false;
        if (s.nextDate && s.completedAt) {
          const expected = s.nextDate.toDate ? s.nextDate.toDate() : new Date(s.nextDate);
          const actual = s.completedAt.toDate ? s.completedAt.toDate() : new Date(s.completedAt);
          if (actual > expected) {
            delayed = true;
            const diffDays = (actual - expected) / (1000 * 60 * 60 * 24);
            if (diffDays > 0) totalDelayDays += diffDays;
          }
        }
        
        if (delayed) {
          overdueCount++;
        } else {
          onTimeCount++;
        }
        
        // Trend
        if (period === '7' || period === '30') {
          const dateKey = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;
          trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
        }
      }
    });

    const avgDelayDays = overdueCount > 0 ? (totalDelayDays / overdueCount).toFixed(1) : 0;
    const onTimePercentage = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0;

    const topMachines = Object.entries(machineServiceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const trendData = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    return {
      totalServicesCount,
      completedCount,
      overdueCount,
      onTimeCount,
      avgDelayDays,
      onTimePercentage,
      topMachines,
      typeCounts,
      trendData
    };

  } catch (err) {
    console.error('Planned KPI error:', err);
    throw new functions.https.HttpsError('internal', 'B³¹d liczenia Planned KPI', err);
  }
});
