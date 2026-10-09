const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const Joi = require('joi');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

const db = admin.firestore();

// 1. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Przekroczono limit zapytań (Rate Limit). Spróbuj ponownie za 15 minut.' }
});

app.use(apiLimiter);

// 2. MIDDLEWARE AUTORYZACJI (SHA-256 Hash)
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Brak klucza API (x-api-key header)' });
  }

  try {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyDoc = await db.collection('tenant_api_keys').doc(hash).get();
    
    if (!keyDoc.exists) {
      return res.status(403).json({ error: 'Nieprawidłowy klucz API' });
    }

    const keyData = keyDoc.data();
    if (!keyData.active) {
      return res.status(403).json({ error: 'Klucz API jest nieaktywny' });
    }

    req.tenantId = keyData.tenantId;
    next();
  } catch (error) {
    console.error('Błąd weryfikacji API Key:', error);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera podczas autoryzacji' });
  }
};

app.use(authenticateApiKey);

// 3. WALIDACJA PAYLOADU (Joi)
const ticketSchema = Joi.object({
  machineId: Joi.string().required(),
  topic: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  priority: Joi.string().valid('normal', 'high', 'critical').optional(),
  reporterName: Joi.string().allow('').optional()
});

const stockSchema = Joi.object({
  quantity: Joi.number().required(),
  type: Joi.string().valid('add', 'subtract', 'set').required(),
  userId: Joi.string().optional(),
  userName: Joi.string().optional()
});

const telemetrySchema = Joi.object({
  workHours: Joi.number().optional(),
  status: Joi.string().optional(),
  lastReading: Joi.string().optional()
});

/**
 * GET /api/v1/machines
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/tickets
 */
app.post('/v1/tickets', async (req, res) => {
  try {
    const { error, value } = ticketSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    const { machineId, topic, description, priority, reporterName } = value;
    
    const newTicket = {
      machineId,
      topic,
      description: description || '',
      priority: priority || 'normal',
      status: 1,
      isCritical: priority === 'critical',
      reportedBy: reporterName || 'API Integration',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'API_BIM'
    };

    const docRef = await db.collection('tenants').doc(req.tenantId).collection('tickets').add(newTicket);
    res.status(201).json({ success: true, ticketId: docRef.id, message: 'Ticket utworzony pomyślnie' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/parts
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/parts/:id/stock
 */
app.patch('/v1/parts/:id/stock', async (req, res) => {
  try {
    const { error, value } = stockSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    const { quantity, type, userId, userName } = value;
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/machines/:id/telemetry
 */
app.patch('/v1/machines/:id/telemetry', async (req, res) => {
  try {
    const { error, value } = telemetrySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    const { workHours, status, lastReading } = value;
    
    const machineRef = db.collection('tenants').doc(req.tenantId).collection('machines').doc(req.params.id);
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    
    if (workHours !== undefined) updates.currentWorkHours = Number(workHours);
    if (status) updates.status = status;
    if (lastReading) updates.lastReading = lastReading;

    await machineRef.update(updates);
    
    res.status(200).json({ success: true, message: 'Dane telemetryczne zaktualizowane' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.api = functions.region("europe-central2").https.onRequest(app);
