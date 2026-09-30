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

// Eksportujemy aplikację express jako funkcję chmurową
exports.api = functions.region('europe-west1').https.onRequest(app);
