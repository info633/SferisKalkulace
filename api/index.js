// SFERIS API (MVP) – Express + Firebase Admin
// Endpoints: auth check, calculations CRUD, basic pricebook admin, export to Make
import express from 'express';
import cors from 'cors';
import { initAdmin, getDb } from './lib/firebase.js';

const app = express();
const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.CORS_ORIGIN || '*';
const SFERIS_ADMINS = (process.env.SFERIS_ADMINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

initAdmin(); // initialize firebase-admin
const db = getDb();

app.use(cors({ origin: ORIGIN, credentials: false }));
app.use(express.json({ limit: '5mb' }));

// -------- Auth middleware (Firebase ID token) --------
import { getAuth } from 'firebase-admin/auth';
async function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });
    const decoded = await getAuth().verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    if (!email.endsWith('@sferis.cz')) return res.status(403).json({ error: 'Only @sferis.cz accounts allowed' });
    const role = SFERIS_ADMINS.includes(email) ? 'admin' : 'sales';
    req.user = { uid: decoded.uid, email, role, name: decoded.name || '' };
    next();
  } catch (e) {
    console.error('Auth error', e);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// -------- Health --------
app.get('/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'production' }));

// -------- Me --------
app.get('/v1/me', auth, (req, res) => res.json({ user: req.user }));

// -------- Pricebooks (very small MVP) --------
app.get('/v1/pricebooks', auth, async (req, res) => {
  try {
    const q = await db.collection('pricebooks').orderBy('effectiveFrom', 'desc').limit(10).get();
    const items = q.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list pricebooks' });
  }
});

app.post('/v1/pricebooks', auth, requireAdmin, async (req, res) => {
  try {
    const { name = 'Default', effectiveFrom = new Date().toISOString(), status = 'published', notes = '' } = req.body || {};
    const ref = await db.collection('pricebooks').add({ name, effectiveFrom, status, notes, createdAt: new Date().toISOString() });
    res.status(201).json({ id: ref.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create pricebook' });
  }
});

app.get('/v1/pricebooks/:id/items', auth, async (req, res) => {
  try {
    const snap = await db.collection('pricebooks').doc(req.params.id).collection('items').get();
    res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list items' });
  }
});

app.post('/v1/pricebooks/:id/items', auth, requireAdmin, async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    const batch = db.batch();
    const col = db.collection('pricebooks').doc(req.params.id).collection('items');
    items.forEach(row => batch.set(col.doc(), { ...row, createdAt: new Date().toISOString() }));
    await batch.commit();
    res.status(201).json({ ok: true, inserted: items.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to insert items' });
  }
});

app.get('/v1/pricebooks/:id/compositions', auth, async (req, res) => {
  try {
    const snap = await db.collection('pricebooks').doc(req.params.id).collection('compositions').get();
    res.json({ compositions: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list compositions' });
  }
});

app.post('/v1/pricebooks/:id/compositions', auth, requireAdmin, async (req, res) => {
  try {
    const { compositions = [] } = req.body || {};
    const batch = db.batch();
    const col = db.collection('pricebooks').doc(req.params.id).collection('compositions');
    compositions.forEach(row => batch.set(col.doc(), { ...row, createdAt: new Date().toISOString() }));
    await batch.commit();
    res.status(201).json({ ok: true, inserted: compositions.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to insert compositions' });
  }
});

// -------- Calculations --------
app.post('/v1/calculations', auth, async (req, res) => {
  try {
    const { pricebookId = 'default', schemeId = 'none', measures = [], totals = {}, energy = {}, meta = {} } = req.body || {};
    const doc = {
      ownerUid: req.user.uid,
      ownerEmail: req.user.email,
      pricebookId,
      schemeId,
      measures,
      totals,
      energy,
      meta,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const ref = await db.collection('calculations').add(doc);
    res.status(201).json({ id: ref.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create calculation' });
  }
});

app.get('/v1/calculations', auth, async (req, res) => {
  try {
    const mine = req.query.mine === '1';
    let query = db.collection('calculations').orderBy('createdAt', 'desc').limit(50);
    if (mine) query = query.where('ownerUid', '==', req.user.uid);
    const snap = await query.get();
    res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list calculations' });
  }
});

app.get('/v1/calculations/:id', auth, async (req, res) => {
  try {
    const ref = db.collection('calculations').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    const data = doc.data();
    if (data.ownerUid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json({ id: doc.id, ...data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get calculation' });
  }
});

app.put('/v1/calculations/:id', auth, async (req, res) => {
  try {
    const ref = db.collection('calculations').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    const data = doc.data();
    if (data.ownerUid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const upd = { ...req.body, updatedAt: new Date().toISOString() };
    await ref.set({ ...data, ...upd }, { merge: true });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update calculation' });
  }
});

app.delete('/v1/calculations/:id', auth, async (req, res) => {
  try {
    const ref = db.collection('calculations').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    const data = doc.data();
    if (data.ownerUid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    await ref.delete();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete calculation' });
  }
});

// -------- Export to Make (webhook) --------
app.post('/v1/export/make/:id', auth, async (req, res) => {
  try {
    const url = process.env.MAKE_WEBHOOK_URL;
    if (!url) return res.status(501).json({ error: 'MAKE_WEBHOOK_URL not configured' });
    const ref = db.collection('calculations').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Calculation not found' });
    const data = doc.data();
    if (data.ownerUid !== req.user.uid && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // include customer (if provided in meta.customer) + files passed in body (optional urls)
    const payload = {
      calculationId: doc.id,
      ownerEmail: data.ownerEmail,
      pricebookId: data.pricebookId,
      schemeId: data.schemeId,
      measures: data.measures,
      totals: data.totals,
      energy: data.energy,
      meta: data.meta || {},
      attachments: req.body.attachments || [] // [{type:'pdf', url:'...'}]
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    res.json({ ok: resp.ok, status: resp.status, response: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to export to Make' });
  }
});

// -------- Customers cache (optional MVP) --------
app.get('/v1/customers', auth, async (req, res) => {
  try {
    const q = (req.query.query || '').toString().toLowerCase();
    let query = db.collection('customers').orderBy('updatedAt', 'desc').limit(50);
    const snap = await query.get();
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (q) {
      items = items.filter(x => (x.name || '').toLowerCase().includes(q) || (x.email || '').toLowerCase().includes(q));
    }
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list customers' });
  }
});

// -------------- Start --------------
app.listen(PORT, () => {
  console.log(`SFERIS API listening on :${PORT}`);
});
