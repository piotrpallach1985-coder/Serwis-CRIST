const functions = require('firebase-functions');
const admin = require('firebase-admin');

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

exports.onTicketCreated = functions.firestore
  .document('tickets/{ticketId}')
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
      const response = await messaging.sendToDevice(tokens, payload);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

exports.onTicketStatusUpdated = functions.firestore
  .document('tickets/{ticketId}')
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

    return messaging.sendToDevice(uniqueTokens, payload);
  });
