const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Helper do weryfikacji dostępu użytkownika do wskazanego tenanta.
 */
async function verifyTenantAccess(context, requestedTenantId, options = { allowAnonymous: false }) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Wymagane uwierzytelnienie');
  }

  const isAnon = context.auth.token?.firebase?.sign_in_provider === 'anonymous';
  const tenantId = context.auth.token?.tenantId || requestedTenantId;

  if (isAnon) {
    if (!options.allowAnonymous) {
      throw new functions.https.HttpsError('permission-denied', 'Funkcja niedostępna dla sesji anonimowych.');
    }
    // Anonim (QR) musi mieć sesję powiązaną z firmą aktualnym kluczem QR (spójnie z firestore.rules)
    const sessionDoc = await db.collection('anon_sessions').doc(context.auth.uid).get();
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Zeskanuj kod QR maszyny, aby połączyć urządzenie z firmą.');
    }
    const session = sessionDoc.data();
    const wanted = tenantId || session.tenantId;
    if (session.tenantId !== wanted) {
      throw new functions.https.HttpsError('permission-denied', 'Sesja QR nie jest powiązana z tą firmą.');
    }
    const keyDoc = await db.collection('tenants').doc(wanted).collection('settings').doc('qr_access').get();
    if (!keyDoc.exists || !session.qrKey || keyDoc.data().key !== session.qrKey) {
      throw new functions.https.HttpsError('permission-denied', 'Kod QR firmy wygasł. Zeskanuj aktualny kod QR maszyny.');
    }
    return wanted;
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Brak profilu użytkownika.');
  }
  const userData = userDoc.data();
  if (userData.isDeleted) {
    throw new functions.https.HttpsError('permission-denied', 'Konto użytkownika jest nieaktywne.');
  }

  const userTenant = userData.tenantId || 'crist';
  if (userData.role !== 'superadmin' && tenantId && userTenant !== tenantId) {
    throw new functions.https.HttpsError('permission-denied', 'Brak dostępu do danych tego dzierżawcy.');
  }

  return tenantId || userTenant;
}

/**
 * Helper do pobierania tokenów na podstawie uprawnień z ról w obrębie danego tenanta.
 * Zwraca tablicę unikalnych tokenów FCM.
 */
async function getTokensForPermission(tenantId, permissionId) {
  const tokens = new Set();
  const validRoleIds = [];

  // Pobieramy role z kolekcji tenanta (oraz fallback z głównej kolekcji roles)
  const tenantRolesSnap = await db.collection('tenants').doc(tenantId).collection('roles').get();
  tenantRolesSnap.forEach(doc => {
    const data = doc.data();
    if (data.permissions && data.permissions.includes(permissionId) && !data.isDeleted) {
      validRoleIds.push(doc.id);
    }
  });

  if (validRoleIds.length === 0) {
    const rootRolesSnap = await db.collection('roles').get();
    rootRolesSnap.forEach(doc => {
      const data = doc.data();
      if (data.permissions && data.permissions.includes(permissionId) && !data.isDeleted) {
        validRoleIds.push(doc.id);
      }
    });
  }

  if (validRoleIds.length === 0) return [];

  // Pobieramy użytkowników z tymi rolami należących do danego tenanta
  const usersSnap = await db.collection('users').where('tenantId', '==', tenantId).get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    const userRole = data.role || data.roleId;
    if (!data.isDeleted && validRoleIds.includes(userRole) && data.fcmTokens && Array.isArray(data.fcmTokens)) {
      data.fcmTokens.forEach(t => tokens.add(t));
    }
  });

  return Array.from(tokens);
}

exports.onTicketCreated = functions.region('europe-west1').firestore
  .document('tenants/{tenantId}/tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticket = snap.data();
    const tenantId = context.params.tenantId;
    const isCritical = ticket.isCritical;
    
    const targetPermission = isCritical ? 'push_new_critical' : 'push_new_all';
    let tokens = await getTokensForPermission(tenantId, targetPermission);
    
    if (!tokens.length) return null;

    const payload = {
      notification: {
        title: isCritical ? 'KRYTYCZNA AWARIA!' : 'Nowa Awaria Zgłoszona',
        body: `Zgłaszający: ${ticket.reporterName || ticket.reportedBy || 'Operator'}\nTemat: ${ticket.topic}`,
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
    const tenantId = context.params.tenantId;
    
    if (newValue.status === previousValue.status) return null;
    
    const tokens = new Set();
    
    // Jeśli jest przypisany technik, pobierz jego token
    if (newValue.assignedTo) {
      const userDoc = await db.collection('users').doc(newValue.assignedTo).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        const uTenant = uData.tenantId || 'crist';
        if (uTenant === tenantId && uData.fcmTokens) {
          uData.fcmTokens.forEach(t => tokens.add(t));
        }
      }
    }
    
    // Wszyscy z uprawnieniem ogólnym w tym tenancie (np. koordynatorzy)
    const coordTokens = await getTokensForPermission(tenantId, 'push_status_updates');
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
  const verifiedTenantId = await verifyTenantAccess(context, data?.tenantId, { allowAnonymous: true });
  const { audioBase64, model, mimeType } = data || {};
  if (!audioBase64) throw new functions.https.HttpsError("invalid-argument", "Brak pliku audio");
  if (typeof audioBase64 === 'string' && audioBase64.length > 25 * 1024 * 1024) {
    throw new functions.https.HttpsError("invalid-argument", "Plik audio przekracza dopuszczalny rozmiar");
  }
  
  try {
    const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
    let actualModel = (globalDoc.exists && globalDoc.data().transcribeModel) ? globalDoc.data().transcribeModel : (model || "chirp_2");
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
            { text: "Dokonaj dokładnej transkrypcji tego nagrania audio. Zwracaj wyłącznie sam tekst z transkrypcją, bez żadnego dodatkowego formatowania ani powitań." }
          ]
        }]
      };
      const resp = await generativeModel.generateContent(req);
      text = resp.response.candidates[0].content.parts[0].text;
      const tTokens = resp.response.usageMetadata?.totalTokenCount || 0;
      if (tTokens > 0 && verifiedTenantId) {
        const geminiPrice = (globalDoc.exists && globalDoc.data().geminiPrice) ? globalDoc.data().geminiPrice : 0.60;
        await db.collection("tenants").doc(verifiedTenantId).collection("stats").doc("ai_usage").set({
          vertexTokens: FieldValue.increment(tTokens),
          vertexCost: FieldValue.increment((tTokens / 1000000) * geminiPrice),
          vertexCalls: FieldValue.increment(1)
        }, { merge: true });
      }
    }
    
    const durationSeconds = Math.min(Math.max(0, Number(data.durationSeconds || 0)), 600);
    if (durationSeconds > 0 && verifiedTenantId) {
      const transcribePricePerMinute = globalDoc.exists ? (globalDoc.data().transcribePrice || 0.40) : 0.40;
      const cost = (durationSeconds / 60) * transcribePricePerMinute;
      await db.collection("tenants").doc(verifiedTenantId).collection("stats").doc("ai_usage").set({
        whisperSeconds: FieldValue.increment(durationSeconds),
        groqCost: FieldValue.increment(cost)
      }, { merge: true });
    }
    return { text };
  } catch (err) {
    console.error("Transcription error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Błąd transkrypcji");
  }
});

exports.chatWithDTR = functions.region('europe-west1').https.onCall(async (data, context) => {
  const verifiedTenantId = await verifyTenantAccess(context, data?.tenantId, { allowAnonymous: false });
  const { messages, documentPaths } = data || {};
  if (!messages || !messages.length) throw new functions.https.HttpsError("invalid-argument", "Brak wiadomości");
  
  try {
    const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
    const actualModel = (globalDoc.exists && globalDoc.data().geminiModel) ? globalDoc.data().geminiModel : "gemini-2.5-flash";
    
    const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "serwis-crist", location: "europe-central2" });
    const generativeModel = vertex_ai.preview.getGenerativeModel({ 
      model: actualModel,
      systemInstruction: "Jesteś eksperckim asystentem technicznym dla mechaników. Opieraj swoje odpowiedzi wyłącznie na załączonych dokumentach PDF. Zawsze podawaj nazwę dokumentu i numer strony, z której wziąłeś informację, jeśli to możliwe. Bądź zwięzły i konkretny, mechanik stoi przy maszynie i nie ma czasu czytać elaboratów."
    });

    const parts = [];
    if (documentPaths && documentPaths.length > 0) {
      for (const path of documentPaths) {
        if (typeof path !== 'string' || path.includes('..')) {
          throw new functions.https.HttpsError("permission-denied", "Nieprawidłowa ścieżka dokumentu DTR.");
        }
        const isTenantPath = path.startsWith(`tenants/${verifiedTenantId}/`);
        const isLegacyPath = path.startsWith('dtr_documents/') && (verifiedTenantId === 'crist' || verifiedTenantId === 'default');
        if (!isTenantPath && !isLegacyPath) {
          throw new functions.https.HttpsError("permission-denied", "Brak dostępu do dokumentu DTR innego dzierżawcy.");
        }
        parts.push({
          fileData: {
            fileUri: `gs://${process.env.GCLOUD_PROJECT || "serwis-crist"}.firebasestorage.app/${path}`,
            mimeType: "application/pdf"
          }
        });
      }
    }

    const chatHistoryText = messages.filter(m => m.role !== "system").map(m => `${m.role === "user" ? "Mechanik" : "Asystent"}: ${m.text}`).join("\n");
    parts.push({ text: `Historia czatu:\n${chatHistoryText}\n\nAktualne zapytanie mechanika: ${messages[messages.length - 1].text}` });

    const req = { contents: [{ role: "user", parts }] };
    const resp = await generativeModel.generateContent(req);
    
    let text = resp.response.candidates[0].content.parts[0].text;
    const tokens = resp.response.usageMetadata?.totalTokenCount || 0;
    
    if (tokens > 0 && verifiedTenantId) {
      const geminiPrice = (globalDoc.exists && globalDoc.data().geminiPrice) ? globalDoc.data().geminiPrice : 0.60;
      await db.collection("tenants").doc(verifiedTenantId).collection("stats").doc("ai_usage").set({
        vertexTokens: FieldValue.increment(tokens),
        vertexCost: FieldValue.increment((tokens / 1000000) * geminiPrice),
        vertexCalls: FieldValue.increment(1)
      }, { merge: true });
    }
    
    return { text, tokens };
  } catch (err) {
    console.error("DTR Chat error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err.message || "Błąd czatu DTR");
  }
});

exports.processDictationText = functions.region('europe-west1').https.onCall(async (data, context) => {
  const verifiedTenantId = await verifyTenantAccess(context, data?.tenantId, { allowAnonymous: true });
  const { rawText, mode, lang } = data || {};
  if (!rawText) throw new functions.https.HttpsError("invalid-argument", "Brak tekstu wejściowego");
  
  try {
    const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
    const actualModel = (globalDoc.exists && globalDoc.data().geminiModel) ? globalDoc.data().geminiModel : "gemini-2.5-flash";
    
    const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "serwis-crist", location: "europe-central2" });
    const generativeModel = vertex_ai.preview.getGenerativeModel({ model: actualModel });
    
    let result = rawText;
    let resp = null;
    
    if (mode === "smart") {
      const prompt = `Jesteś asystentem uzupełniającym formularz serwisowy. Otrzymasz transkrypcję głosu mechanika.
Twoim zadaniem jest wyciągnięcie danych i zwrócenie ich w formacie JSON.
Zasady mapowania:
1. "czas_pracy": wyciągnij liczbę godzin (jako float, np. 3.5).
2. "zuzyto_wymagane_czesci": ustaw na true, jeśli mechanik potwierdził zużycie/użycie/wymianę wymaganych części (np. "potwierdzam zużycie wymaganych części"). W przeciwnym razie false.
3. "czysta_notatka": to absolutnie najważniejsze! Zignoruj polecenia wydawane do Ciebie (np. "wpisz", "dodaj", "notatka to"). Zapisz tu tylko faktyczną treść techniczną dotyczącą maszyny i przebiegu prac.
   NIE umieszczaj w notatce informacji, które trafiają do innych pól: potwierdzenia zużycia części, czasu pracy ani zleconych kolejnych kroków/terminów.
4. "tematy_do_realizacji": ustaw na true, jeśli mechanik zlecił kolejne kroki.
5. "szczegoly_tematu": opis kolejnych kroków/tematu jeśli mechanik podał.
6. "termin_dni": liczba dni do terminu realizacji tematu, jeśli mechanik podał termin (np. "za dwa tygodnie" = 14). W przeciwnym razie null.

Zwróć TYLKO czysty obiekt JSON bez znaczników formatowania (np. markdown) i bez dodatkowego tekstu.

Format wyjściowy:
{
  "czas_pracy": 2.0,
  "zuzyto_wymagane_czesci": true,
  "czysta_notatka": "Maszyna w dobrym stanie ogólnym.",
  "tematy_do_realizacji": true,
  "szczegoly_tematu": "Wymagana wymiana paska napędowego.",
  "termin_dni": 14
}

Surowy tekst od mechanika: "${rawText}"`;
      
      resp = await generativeModel.generateContent(prompt);
      let jsonText = resp.response.candidates[0].content.parts[0].text;
      jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : jsonText);
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

      resp = await generativeModel.generateContent(prompt);
      result = resp.response.candidates[0].content.parts[0].text.trim();
    }
    
    const tokens = resp?.response?.usageMetadata?.totalTokenCount || 0;
    const targetTenantId = verifiedTenantId;
    if (tokens > 0 && targetTenantId) {
      const geminiPrice = (globalDoc.exists && globalDoc.data().geminiPrice) ? globalDoc.data().geminiPrice : 0.60;
      await db.collection("tenants").doc(targetTenantId).collection("stats").doc("ai_usage").set({
        vertexTokens: FieldValue.increment(tokens),
        vertexCost: FieldValue.increment((tokens / 1000000) * geminiPrice),
        vertexCalls: FieldValue.increment(1)
      }, { merge: true });
    }
    
    return { result };
  } catch (err) {
    console.error("Dictation processing error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Błąd przetwarzania tekstu");
  }
});

exports.logAIUsage = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { HttpsError } = functions.https;
  const tenantId = await verifyTenantAccess(context, data?.tenantId, { allowAnonymous: false });
  if (!tenantId) throw new HttpsError("invalid-argument", "Missing tenantId.");

  const callerSnap = await db.collection("users").doc(context.auth.uid).get();
  const callerRole = callerSnap.exists ? callerSnap.data().role : null;
  if (callerRole !== "admin" && callerRole !== "superadmin") {
    throw new HttpsError("permission-denied", "Only admins can manually log AI usage.");
  }

  const { geminiTokens } = data || {};
  if (!geminiTokens || geminiTokens <= 0) return { success: true };

  const globalDoc = await db.collection("tenant_registry").doc("_global_secrets_").get();
  const globalData = globalDoc.exists ? globalDoc.data() : {};
  const geminiPrice = globalData.geminiPrice || 0.60;
  const safeTokens = Math.min(Math.max(0, parseInt(geminiTokens, 10)), 1000000);

  await db.collection("tenants").doc(tenantId).collection("stats").doc("ai_usage").set({
    geminiTokens: FieldValue.increment(safeTokens),
    geminiCost: FieldValue.increment((safeTokens / 1000000) * geminiPrice)
  }, { merge: true });

  return { success: true };
});

// --- Skalowalność: Automatyczne przeglądy planowane (Cron o 2:00 w nocy) ---
exports.scheduledCheckPlannedMaintenance = functions.region('europe-west1').pubsub.schedule('0 2 * * *')
  .timeZone('Europe/Warsaw')
  .onRun(async (context) => {
    console.log('Rozpoczęcie weryfikacji serwisów planowanych...');
    
    const tenantsSnap = await db.collection('tenant_registry').get();
    
    const CRITICAL_DAYS_WARNING = 7;
    const CRITICAL_HOURS_WARNING = 50;
    const now = new Date();
    
    for (const tenantDoc of tenantsSnap.docs) {
      if (tenantDoc.id === '_global_secrets_' || tenantDoc.id === '_global_settings_') continue;
      
      const tenantId = tenantDoc.id;
      console.log('Sprawdzanie dzierżawcy: ' + tenantId);
      
      try {
        const machinesSnap = await db.collection('tenants').doc(tenantId).collection('machines').where('isDeleted', '==', false).get();
        const machinesMap = {};
        machinesSnap.docs.forEach(doc => {
          machinesMap[doc.id] = doc.data();
        });
        
        // UWAGA: bez where('isDeleted','!=',true) – taki filtr pomija dokumenty BEZ pola isDeleted
        // (addPlannedService go nie ustawia) i wymaga indeksu złożonego. Filtrujemy w kodzie.
        const servicesSnap = await db.collection('tenants').doc(tenantId).collection('planned_services')
          .where('status', 'in', ['pending', 1])
          .get();
        
        let batch = db.batch();
        let writesCount = 0;
        const BATCH_LIMIT = 400;
        
        for (const sDoc of servicesSnap.docs) {
          const data = sDoc.data();
          if (data.isDeleted === true) continue;
          const machine = machinesMap[data.machineId];
          if (!machine) continue;

          let shouldAlert = false;
          let alertMessage = '';
          
          if (!data.notified) {
            if (data.triggerType === 'calendar' || data.triggerType === 'mixed') {
              if (data.nextDate) {
                const nextDate = data.nextDate.toDate ? data.nextDate.toDate() : new Date(data.nextDate);
                const daysLeft = (nextDate - now) / (1000 * 60 * 60 * 24);
                
                if (daysLeft <= CRITICAL_DAYS_WARNING) {
                  shouldAlert = true;
                  alertMessage = 'Zbliża się termin planowanego przeglądu "' + (data.name || 'Brak nazwy') + '" (zostało ' + Math.max(0, Math.ceil(daysLeft)) + ' dni).';
                }
              }
            }

            if (!shouldAlert && (data.triggerType === 'hours' || data.triggerType === 'mixed')) {
              if (data.targetWorkHours && machine.currentWorkHours) {
                const hoursLeft = data.targetWorkHours - machine.currentWorkHours;
                if (hoursLeft <= CRITICAL_HOURS_WARNING && hoursLeft >= 0) {
                  shouldAlert = true;
                  alertMessage = 'Zbliża się termin przeglądu liczonego w roboczogodzinach "' + (data.name || 'Brak nazwy') + '" (zostało ' + hoursLeft + ' rbg).';
                }
              }
            }

            if (shouldAlert) {
              // Aktualizujemy tylko flagę notified (NIE zmieniamy statusu, aby nie pomijać kroków realizacji)
              batch.update(sDoc.ref, { notified: true });
              writesCount++;
              
              const notifRef = db.collection('tenants').doc(tenantId).collection('notifications').doc();
              batch.set(notifRef, {
                title: 'Zbliżający się Przegląd',
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
                batch = db.batch();
                writesCount = 0;
              }
            }
          }
        }
        
        if (writesCount > 0) {
          await batch.commit();
        }
        
      } catch (err) {
        console.error('Błąd dla dzierżawcy ' + tenantId + ':', err);
      }
    }
    
    console.log('Weryfikacja zakończona sukcesem.');
    return null;
  });

// --- Skalowalność: Agregacja KPI na żądanie ---
exports.getKPIStats = functions.region('europe-west1').https.onCall(async (data, context) => {
  const tenantId = await verifyTenantAccess(context, data?.tenantId, { allowAnonymous: false });
  if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'Brak tenantId');

  const { period } = data || {}; // '7', '30', '90', 'all'
  const now = new Date();
  let startDate = null;
  
  if (period && period !== 'all') {
    startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period, 10));
  }

  try {
    const ticketsRef = db.collection('tenants').doc(tenantId).collection('tickets');
    let ticketDocs = [];
    if (startDate) {
      const [isoSnap, tsSnap] = await Promise.all([
        ticketsRef.where('createdAt', '>=', startDate.toISOString()).limit(2500).get(),
        ticketsRef.where('createdAt', '>=', startDate).limit(2500).get()
      ]);
      const seenIds = new Set();
      [...isoSnap.docs, ...tsSnap.docs].forEach(d => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          ticketDocs.push(d);
        }
      });
    } else {
      const snapshot = await ticketsRef.limit(2500).get();
      ticketDocs = snapshot.docs;
    }
    
    let totalTickets = 0;
    let closedTicketsCount = 0;
    let criticalTicketsCount = 0;
    let totalRepairTimeMinutes = 0;
    const machineFaultCounts = {};
    const statusCounts = {};
    const trendMap = {};

    ticketDocs.forEach(docSnap => {
      const t = docSnap.data();
      if (t.isDeleted === true) return;
      const createdAt = t.createdAt && t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      
      if (startDate && createdAt < startDate) return;

      totalTickets++;
      if (t.isCritical) criticalTicketsCount++;
      
      const statusNum = Number(t.status);
      statusCounts[statusNum] = (statusCounts[statusNum] || 0) + 1;

      if (statusNum === 5) {
        closedTicketsCount++;
        if (t.closedAt) {
          const closedAt = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
          const diffMins = (closedAt - createdAt) / (1000 * 60);
          if (diffMins > 0) totalRepairTimeMinutes += diffMins;
        }
      }

      const mName = t.machineName || 'Nieznana maszyna';
      machineFaultCounts[mName] = (machineFaultCounts[mName] || 0) + 1;

      if (!isNaN(createdAt.getTime())) {
        const dateKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      }
    });

    const avgRepairMinutes = closedTicketsCount > 0 ? Math.round(totalRepairTimeMinutes / closedTicketsCount) : 0;
    
    const topMachines = Object.entries(machineFaultCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const trendData = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

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
    throw new functions.https.HttpsError('internal', 'Błąd podczas liczenia KPI', err);
  }
});

// --- Skalowalność: Agregacja KPI Serwisów Planowanych ---
exports.getPlannedKPIStats = functions.region('europe-west1').https.onCall(async (data, context) => {
  const tenantId = await verifyTenantAccess(context, data?.tenantId, { allowAnonymous: false });
  if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'Brak tenantId');

  const { period } = data || {}; // '7', '30', '90', 'all'
  const now = new Date();
  let startDate = null;
  
  if (period && period !== 'all') {
    startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period, 10));
  }

  try {
    const servicesRef = db.collection('tenants').doc(tenantId).collection('planned_services');
    let serviceDocs = [];
    if (startDate) {
      const [activeSnap, completedIsoSnap, completedTsSnap] = await Promise.all([
        servicesRef.where('status', '!=', 'completed').limit(1500).get(),
        servicesRef.where('completedAt', '>=', startDate.toISOString()).limit(1500).get(),
        servicesRef.where('completedAt', '>=', startDate).limit(1500).get()
      ]);
      const seenIds = new Set();
      [...activeSnap.docs, ...completedIsoSnap.docs, ...completedTsSnap.docs].forEach(d => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          serviceDocs.push(d);
        }
      });
    } else {
      const snapshot = await servicesRef.limit(2500).get();
      serviceDocs = snapshot.docs;
    }
    
    let totalServicesCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let onTimeCount = 0;
    let totalDelayDays = 0;
    
    const machineServiceCounts = {};
    const typeCounts = { 'calendar': 0, 'hours': 0, 'mixed': 0 };
    const trendMap = {};

    serviceDocs.forEach(docSnap => {
      const s = docSnap.data();
      if (s.isDeleted === true) return;
      
      const referenceDateRaw = s.completedAt || s.createdAt || s.nextDate;
      const refDate = referenceDateRaw ? (referenceDateRaw.toDate ? referenceDateRaw.toDate() : new Date(referenceDateRaw)) : now;
      
      if (s.status === 'completed' && startDate && refDate < startDate) return;

      totalServicesCount++;
      
      const mName = s.machineName || 'Nieznana maszyna';
      machineServiceCounts[mName] = (machineServiceCounts[mName] || 0) + 1;

      if (s.triggerType) {
        typeCounts[s.triggerType] = (typeCounts[s.triggerType] || 0) + 1;
      }

      const statusNum = Number(s.status);
      if (s.status === 'completed' || statusNum === 5 || statusNum === 3) {
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
    throw new functions.https.HttpsError('internal', 'Błąd liczenia Planned KPI', err);
  }
});
