// Minimal seed for a default pricebook and example items/compositions
import { initAdmin, getdb } from './lib/firebase.js';
initAdmin();

const pb = {
  name: 'Default (MVP)',
  effectiveFrom: new Date().toISOString(),
  status: 'published',
  notes: 'Auto-seeded MVP pricebook',
  createdAt: new Date().toISOString()
};

async function main() {
  const pbRef = await db.collection('pricebooks').add(pb);
  const items = [
    { code:'work.cleaning', label:'Vysokotlaké mytí', category:'work', unit:'m2', norm:1, basePriceCZK:40,  vat:12 },
    { code:'work.armovani', label:'Armovací stěrka',  category:'work', unit:'m2', norm:1, basePriceCZK:110, vat:12 },
    { code:'mat.eps200', label:'EPS 200 mm',         category:'material', unit:'m2', norm:1.05, basePriceCZK:360, vat:12 },
    { code:'mat.mv200',  label:'Minerální vata 200', category:'material', unit:'m2', norm:1.05, basePriceCZK:202, vat:12 }
  ];
  const comps = [
    { module:'fasada', variant:'eps', lines:[{ code:'mat.eps200', qtyPerUnit:1 }, { code:'work.armovani', qtyPerUnit:1 }]},
    { module:'fasada', variant:'mv',  lines:[{ code:'mat.mv200', qtyPerUnit:1 },  { code:'work.armovani', qtyPerUnit:1 }]}
  ];

  const itemsCol = db.collection('pricebooks').doc(pbRef.id).collection('items');
  const compsCol = db.collection('pricebooks').doc(pbRef.id).collection('compositions');
  const batch = db.batch();

  items.forEach(r => batch.set(itemsCol.doc(), { ...r, createdAt: new Date().toISOString() }));
  comps.forEach(r => batch.set(compsCol.doc(),  { ...r, createdAt: new Date().toISOString() }));

  await batch.commit();
  console.log('Seeded pricebook', pbRef.id);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
