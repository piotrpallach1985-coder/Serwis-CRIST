const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Helper do pobierania tokenów na podstawie uprawnień z ról.
 * Zwraca tablicę unikalnych tokenów FCM.
 */
async function getTokensForPermission(permissionId) {
  const tokens = new Set();
  
  // Pobieramy wszystkie role, które mają to uprawnienie
  const rolesSnap = await db.collection('roles').get();
  const validRoleIds = [];
  rolesSnap.forEach(doc => {
    const data = doc.data();
    if (data.permissions && data.permissions.includes(permissionId) && !data.isDeleted) {
      validRoleIds.push(doc.id);
    }
  });

  if (validRoleIds.length === 0) return [];

  // Pobieramy użytkowników z tymi rolami, którzy mają fcmTokens
  const usersSnap = await db.collection('users').where('roleId', 'in', validRoleIds).get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
      data.fcmTokens.forEach(t => tokens.add(t));
    }
  });

  return Array.from(tokens);
}

exports.onTicketCreated = functions.region('europe-west1').firestore
  .document('tenants/{tenantId}/tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticket = snap.data();
    const isCritical = ticket.isCritical;
    
    // Zależnie od krytyczności, wysyłamy do innych grup
    const targetPermission = isCritical ? 'push_new_critical' : 'push_new_all';
    let tokens = await getTokensForPermission(targetPermission);
    
    // Jeśli to awaria zwykła, dodajemy też tokeny tych co chcą krytyczne (bo to zazwyczaj nadrzędne), 
    // ale możemy zostawić ekskluzywne wg uprawnień (user ma zaznaczone oba)
    if (!tokens.length) return null;

    const payload = {
      notification: {
        title: isCritical ? 'KRYTYCZNA AWARIA!' : 'Nowa Awaria Zgłoszona',
        body: `Zgłaszający: ${ticket.reporterName}\nTemat: ${ticket.topic}`,
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

exports.onTicketStatusUpdated = functions.region('europe-west1').firestore
  .document('tenants/{tenantId}/tickets/{ticketId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    if (newValue.status === previousValue.status) return null;
    
    // Szukamy osób zainteresowanych zmianą statusu (albo przypisanych, albo wszystkich z uprawnieniem push_status_updates)
    // Zgodnie ze wskazówkami, wysyłamy do przypisanego technika, i osób powiązanych.
    const tokens = new Set();
    
    // Jeśli jest przypisany technik, pobierz jego token
    if (newValue.assignedTo) {
      const userDoc = await db.collection('users').doc(newValue.assignedTo).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        if (uData.fcmTokens) uData.fcmTokens.forEach(t => tokens.add(t));
      }
    }
    
    // Zgłaszający: jeśli ma konto (nie obsługiwane jeszcze w tej wersji, bazujemy na Imię/Nazwisko tekstowym)
    
    // Opcjonalnie wszyscy z uprawnieniem ogólnym (np. koordynatorzy)
    const coordTokens = await getTokensForPermission('push_status_updates');
    coordTokens.forEach(t => tokens.add(t));
    
    const uniqueTokens = Array.from(tokens);
    if (!uniqueTokens.length) return null;
    
    const statusMap = {
      1: 'Nowa', 2: 'W trakcie', 3: 'Wstrzymana', 4: 'Odrzucona', 5: 'Zakończona'
    };

    const payload = {
      notification: {
        title: 'Aktualizacja Zgłoszenia',
        body: `Status awarii został zmieniony na: ${statusMap[newValue.status]}`,
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
const { VertexAI } = require('@google-cloud/vertexai');
const speech = require('@google-cloud/speech').v2;
const speechClient = new speech.SpeechClient({ apiEndpoint: "europe-west4-speech.googleapis.com" });

exports.transcribeAudio = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Wymagane uwierzytelnienie");
  const { audioBase64, model, mimeType } = data;
  if (!audioBase64) throw new functions.https.HttpsError("invalid-argument", "Brak pliku audio");
  
  try {
    const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
    let actualModel = (globalDoc.exists && globalDoc.data().transcribeModel) ? globalDoc.data().transcribeModel : (model || "gemini-3.8-flash");
    actualModel = actualModel.trim().toLowerCase().replace(/\s+/g, "-");
    
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "serwis-crist";
    let text = "";
    
    if (actualModel.includes("chirp")) {
      // Use Cloud Speech-to-Text V2 API
      const request = {
        recognizer: `projects/${projectId}/locations/europe-west4/recognizers/_`,
        config: {
          autoDecodingConfig: {},
          languageCodes: ["pl-PL"],
          model: actualModel
        },
        content: audioBase64
      };
      
      const [response] = await speechClient.recognize(request);
      if (response.results && response.results.length > 0) {
        text = response.results.map(r => r.alternatives[0].transcript).join(" ");
      } else {
        text = "";
      }
    } else {
      // Use Vertex AI Generative Model
      const vertex_ai = new VertexAI({ project: projectId, location: "europe-west4" });
      const generativeModel = vertex_ai.preview.getGenerativeModel({ model: actualModel });
      const req = {
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } },
            { text: "Dokonaj dokladnej transkrypcji tego nagrania audio. Zwracaj wylacznie sam tekst z transkrypcja, bez zadnego dodatkowego formatowania ani powitan." }
          ]
        }]
      };
      const resp = await generativeModel.generateContent(req);
      text = resp.response.candidates[0].content.parts[0].text;
    }
    
    const durationSeconds = data.durationSeconds || 0;
    if (durationSeconds > 0) {
      const tenantId = context.auth?.token?.tenantId || data.tenantId;
      if (tenantId) {
        const transcribePricePerMinute = globalDoc.exists ? (globalDoc.data().transcribePrice || 0.40) : 0.40;
        const cost = (durationSeconds / 60) * transcribePricePerMinute;
        await db.collection("tenants").doc(tenantId).collection("stats").doc("ai_usage").set({
          whisperSeconds: FieldValue.increment(durationSeconds),
          groqCost: FieldValue.increment(cost)
        }, { merge: true });
      }
    }
    return { text };
  } catch (err) {
    console.error("Transcription error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Blad transkrypcji");
  }
});

exports.chatWithDTR = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Wymagane uwierzytelnienie");
  const { messages, documentPaths, machineName } = data;
  if (!messages || !messages.length) throw new functions.https.HttpsError("invalid-argument", "Brak wiadomosci");
  
  try {
    const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
    const actualModel = (globalDoc.exists && globalDoc.data().geminiModel) ? globalDoc.data().geminiModel : "gemini-3.8-flash";
    
    const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "serwis-crist", location: "europe-central2" });
    const generativeModel = vertex_ai.preview.getGenerativeModel({ 
      model: actualModel,
      systemInstruction: "Jesteś eksperckim asystentem technicznym dla mechaników. Opieraj swoje odpowiedzi wyłącznie na załączonych dokumentach PDF. Zawsze podawaj nazwę dokumentu i numer strony, z której wziąłeś informację, jeśli to możliwe. Bądź zwięzły i konkretny, mechanik stoi przy maszynie i nie ma czasu czytać elaboratów."
    });

    const parts = [];
    if (documentPaths && documentPaths.length > 0) {
      documentPaths.forEach(path => {
        parts.push({
          fileData: {
            fileUri: `gs://${process.env.GCLOUD_PROJECT || "serwis-crist"}.firebasestorage.app/${path}`,
            mimeType: "application/pdf"
          }
        });
      });
    }

    const chatHistoryText = messages.filter(m => m.role !== "system").map(m => `${m.role === "user" ? "Mechanik" : "Asystent"}: ${m.text}`).join("\n");
    parts.push({ text: `Historia czatu:\n${chatHistoryText}\n\nAktualne zapytanie mechanika: ${messages[messages.length - 1].text}` });

    const req = { contents: [{ role: "user", parts }] };
    const resp = await generativeModel.generateContent(req);
    
    let text = resp.response.candidates[0].content.parts[0].text;
    const tokens = resp.response.usageMetadata?.totalTokenCount || 0;
    
    return { text, tokens };
  } catch (err) {
    console.error("DTR Chat error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Blad czatu DTR");
  }
});

exports.processDictationText = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Wymagane uwierzytelnienie");
  const { rawText, mode, lang, tenantId } = data;
  if (!rawText) throw new functions.https.HttpsError("invalid-argument", "Brak tekstu wejsciowego");
  
  try {
    const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
    const actualModel = (globalDoc.exists && globalDoc.data().geminiModel) ? globalDoc.data().geminiModel : "gemini-3.8-flash";
    
    const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "serwis-crist", location: "europe-central2" });
    const generativeModel = vertex_ai.preview.getGenerativeModel({ model: actualModel });
    
    let result = rawText;
    
    if (mode === "smart") {
      const prompt = `Jesteś asystentem uzupełniającym formularz serwisowy. Otrzymasz transkrypcję głosu mechanika.
Twoim zadaniem jest wyciągnięcie danych i zwrócenie ich w formacie JSON.
Zasady mapowania:
1. "czas_pracy": wyciągnij liczbę godzin (jako float).
2. "zuzyto_wymagane_czesci": ustaw na true, jeśli mechanik potwierdził użycie części.
3. "czysta_notatka": to absolutnie najważniejsze! Zignoruj polecenia wydawane do Ciebie (np. "wpisz", "dodaj", "notatka to"). Zapisz tu tylko faktyczną treść techniczną dotyczącą maszyny.
4. "tematy_do_realizacji": ustaw na true, jeśli mechanik zlecił kolejne kroki.
5. "szczegoly_tematu": opis kolejnych kroków/tematu jeśli mechanik podał.

Zwróć TYLKO czysty obiekt JSON bez znaczników formatowania (np. markdown) i bez dodatkowego tekstu.

Format wyjściowy:
{
  "czas_pracy": 2.0,
  "zuzyto_wymagane_czesci": true,
  "czysta_notatka": "Maszyna w dobrym stanie ogólnym.",
  "tematy_do_realizacji": true,
  "szczegoly_tematu": "Wymagana wymiana paska napędowego za dwa tygodnie."
}

Surowy tekst od mechanika: "${rawText}"`;
      
      const resp = await generativeModel.generateContent(prompt);
      let jsonText = resp.response.candidates[0].content.parts[0].text;
      jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
      result = JSON.parse(jsonText);
    } else {
      const language = lang || "polski";
      const prompt = `Jesteś asystentem technicznym. Otrzymasz surowy tekst podyktowany przez pracownika stoczni. 
1. Jeśli oryginalny tekst jest w języku ${language} (albo bardzo do niego zbliżonym), sformatuj go poprawnie (dodaj interpunkcję) i zwróć TYLKO sam sformatowany tekst.
2. Jeśli oryginalny tekst jest w INNYM języku, przetłumacz go na ${language}. Zwróć wynik w formacie:
[Oryginalny podyktowany tekst]
---
Tłumaczenie (${language}):
[Przetłumaczony tekst]

Oto notatka:
"${rawText}"`;

      const resp = await generativeModel.generateContent(prompt);
      result = resp.response.candidates[0].content.parts[0].text.trim();
    }
    
    return { result };
  } catch (err) {
    console.error("Dictation processing error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Blad przetwarzania tekstu");
  }
});

exports.logAIUsage = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { HttpsError } = functions.https;
  if (!context.auth) throw new HttpsError("unauthenticated", "User not authenticated.");
  const tenantId = context.auth.token.tenantId || (data && data.tenantId);
  if (!tenantId) throw new HttpsError("invalid-argument", "Missing tenantId.");

  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data().tenantId !== tenantId) {
    if (!userDoc.exists || userDoc.data().role !== "superadmin") {
      throw new HttpsError("permission-denied", "Unauthorized tenant access.");
    }
  }

  const { geminiTokens } = data || {};
  if (!geminiTokens || geminiTokens <= 0) return { success: true };

  const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
  const globalData = globalDoc.exists ? globalDoc.data() : {};
  const geminiPrice = globalData.geminiPrice || 0.60;
  const safeTokens = Math.max(0, parseInt(geminiTokens, 10));

  await db.collection("tenants").doc(tenantId).collection("stats").doc("ai_usage").set({
    geminiTokens: FieldValue.increment(safeTokens),
    geminiCost: FieldValue.increment((safeTokens / 1000000) * geminiPrice)
  }, { merge: true });

  return { success: true };
});

// --- Skalowalnosc: Automatyczne przeglady planowane (Cron o 2:00 w nocy) ---
exports.scheduledCheckPlannedMaintenance = functions.region('europe-west1').pubsub.schedule('0 2 * * *')
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
                  alertMessage = 'Zbli�a si� termin planowanego przegl�du "' + (data.name || 'Brak nazwy') + '" (zosta�o ' + Math.max(0, Math.ceil(daysLeft)) + ' dni).';
                }
              }
            }

            // ROBOCZOGODZINY
            if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
              if (data.targetWorkHours && machine.currentWorkHours) {
                const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
                if (hoursLeft <= CRITICAL_HOURS_WARNING && hoursLeft >= 0) {
                  shouldAlert = true;
                  alertMessage = 'Zbli�a si� termin przegl�du liczonego w roboczogodzinach "' + (data.name || 'Brak nazwy') + '" (zosta�o ' + hoursLeft + ' rbg).';
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
                title: 'Zbli�aj�cy si� Przegl�d',
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

// --- Skalowalnosc: Agregacja KPI na ��danie (zmniejszenie pobierania danych do przegl�darki) ---
exports.getKPIStats = functions.region('europe-west1').https.onCall(async (data, context) => {
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
    // Odczyt z bazy (tylko na serwerze - nie zatykamy sieci u�ytkownika)
    let q = db.collection('tenants').doc(tenantId).collection('tickets').where('isDeleted', '!=', true);
    
    // Optymalizacja: je�li Firestore ma index, mo�na by tu filtrowa� po dacie, 
    // ale dla uproszczenia (bo tickets mo�e nie mie� indeks�w) wyci�gamy na serwerze i filtrujemy w RAM serwera.
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

      // MTTR dla zako�czonych (status 5)
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
      .slice(-10); // Ostatnie 10 dni aktywno�ci

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
    throw new functions.https.HttpsError('internal', 'B��d podczas liczenia KPI', err);
  }
});

// --- Skalowalnosc: Agregacja KPI Serwis�w Planowanych ---
exports.getPlannedKPIStats = functions.region('europe-west1').https.onCall(async (data, context) => {
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
    throw new functions.https.HttpsError('internal', 'B��d liczenia Planned KPI', err);
  }
});
