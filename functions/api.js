const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middleware konfigurujące CORS (zabezpieczenie lub otwarcie API)
app.use(cors({ origin: true }));
app.use(express.json());

// Jeśli db nie jest przekazane z index.js, inicjujemy
const db = admin.firestore();

/**
 * MIDDLEWARE AUTORYZACJI
 * Oczekuje nagłówka x-api-key.
 * Sprawdza w Firestore w kolekcji '_api_keys_' (globalna lub per tenant) czy klucz istnieje.
 */
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Brak klucza API (x-api-key header)' });
  }

  try {
    // Sprawdzamy klucz w bazie danych (np. globalna kolekcja tenant_api_keys)
    // Zakładamy strukturę: tenant_api_keys / {keyString} -> { tenantId, active: true, name: "BIM Integration" }
    const keyDoc = await db.collection('tenant_api_keys').doc(apiKey).get();
    
    if (!keyDoc.exists) {
      return res.status(403).json({ error: 'Nieprawidłowy klucz API' });
    }

    const keyData = keyDoc.data();
    if (!keyData.active) {
      return res.status(403).json({ error: 'Klucz API jest nieaktywny' });
    }

    // Przekazujemy tenantId z klucza do obiektu request
    req.tenantId = keyData.tenantId;
    next();
  } catch (error) {
    console.error('Błąd weryfikacji API Key:', error);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera podczas autoryzacji' });
  }
};

app.use(authenticateApiKey);

/**
 * GET /api/v1/machines
 * Zwraca listę maszyn dla danego Tenanta.
 */
app.get('/v1/machines', async (req, res) => {
  try {
    const snapshot = await db.collection('tenants').doc(req.tenantId).collection('machines')
      .where('isDeleted', '!=', true)
      .get();
      
    const machines = [];
    snapshot.forEach(doc => {
      machines.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json({ success: true, count: machines.length, data: machines });
  } catch (err) {
    console.error('Błąd pobierania maszyn:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/tickets
 * Tworzy nowe zgłoszenie awarii z systemu zewnętrznego (np. BIM)
 */
app.post('/v1/tickets', async (req, res) => {
  try {
    const { machineId, topic, description, priority, reporterName } = req.body;
    
    if (!machineId || !topic) {
      return res.status(400).json({ error: 'Brakuje wymaganych pól (machineId, topic)' });
    }

    const newTicket = {
      machineId,
      topic,
      description: description || '',
      priority: priority || 'normal', // normal / high / critical
      status: 1, // 1 = Nowe
      isCritical: priority === 'critical',
      reportedBy: reporterName || 'API Integration',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'API_BIM'
    };

    const docRef = await db.collection('tenants').doc(req.tenantId).collection('tickets').add(newTicket);
    
    res.status(201).json({ success: true, ticketId: docRef.id, message: 'Ticket utworzony pomyślnie' });
  } catch (err) {
    console.error('Błąd tworzenia zgłoszenia API:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * GET /api/v1/parts
 * (ERP) Zwraca listę części magazynowych wraz ze stanami.
 */
app.get('/v1/parts', async (req, res) => {
  try {
    const snapshot = await db.collection('tenants').doc(req.tenantId).collection('parts')
      .where('isDeleted', '!=', true)
      .get();
      
    const parts = [];
    snapshot.forEach(doc => parts.push({ id: doc.id, ...doc.data() }));
    
    res.status(200).json({ success: true, count: parts.length, data: parts });
  } catch (err) {
    console.error('Błąd pobierania części:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/parts/:id/stock
 * (ERP) Aktualizacja stanu magazynowego (np. z dostawy zewnętrznej).
 */
app.patch('/v1/parts/:id/stock', async (req, res) => {
  try {
    const { quantity, type, userId, userName } = req.body;
    // type: 'add' (przyjęcie) / 'subtract' (wydanie) / 'set' (nadpisanie)
    
    if (quantity === undefined || !type) {
      return res.status(400).json({ error: 'Brakuje quantity lub type (add/subtract/set)' });
    }

    const partRef = db.collection('tenants').doc(req.tenantId).collection('parts').doc(req.params.id);
    
    await db.runTransaction(async (t) => {
      const partDoc = await t.get(partRef);
      if (!partDoc.exists) throw new Error('Część nie istnieje');
      
      let newStock = partDoc.data().stock || 0;
      let diff = 0;
      
      if (type === 'add') {
         newStock += Number(quantity);
         diff = Number(quantity);
      } else if (type === 'subtract') {
         newStock -= Number(quantity);
         diff = -Number(quantity);
      } else if (type === 'set') {
         diff = Number(quantity) - newStock;
         newStock = Number(quantity);
      }

      t.update(partRef, { stock: newStock, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

      // Log do part_transactions (widoczny w historii)
      const txRef = db.collection('tenants').doc(req.tenantId).collection('part_transactions').doc();
      t.set(txRef, {
        partId: req.params.id,
        partName: partDoc.data().name,
        type: (type === 'add' || diff > 0) ? 'receive' : 'issue_adhoc',
        quantity: Math.abs(diff),
        date: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId || 'API_ERP',
        user: userName || 'Zewnętrzny System ERP',
        totalCost: Math.abs(diff) * (partDoc.data().price || 0)
      });
    });

    res.status(200).json({ success: true, message: 'Stan magazynowy zaktualizowany' });
  } catch (err) {
    console.error('Błąd aktualizacji stanu ERP:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/machines/:id/telemetry
 * (SCADA / IoT) Aktualizacja motogodzin (RBG) i parametrów urządzenia.
 */
app.patch('/v1/machines/:id/telemetry', async (req, res) => {
  try {
    const { workHours, status, lastReading } = req.body;
    
    const machineRef = db.collection('tenants').doc(req.tenantId).collection('machines').doc(req.params.id);
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    
    if (workHours !== undefined) {
      updates.currentWorkHours = Number(workHours);
    }
    if (status) updates.status = status;
    if (lastReading) updates.lastReading = lastReading;

    await machineRef.update(updates);
    
    res.status(200).json({ success: true, message: 'Dane telemetryczne zaktualizowane' });
  } catch (err) {
    console.error('Błąd IoT/SCADA:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eksportujemy aplikację express jako funkcję chmurową
exports.api = functions.region('europe-west1').https.onRequest(app);

