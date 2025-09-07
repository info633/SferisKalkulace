// energy-mvp.js — velmi zjednodušený odhad roční úspory energie (kWh/rok a Kč/rok)
// Používá jen agregované položky z vybranaOpatreni + typ opatření (dotaceMeasure).
// Není to energetický posudek — slouží obchodně orientovanému odhadu v MVP.

const HDD = 3100;              // degree-days CZ (K*d)
const DEG_HOURS = HDD * 24;    // K*h
const PRICE_KWH = window.ENERGY_PRICE_KWH || 5.0;   // Kč/kWh (lze přepsat)

// tabulkové U_before a U_after pro různé opatření
const U_TABLE = {
  stenyStrechyPodlahy: { before: 1.30, after: { default: 0.22, mv: 0.19, eps: 0.20, sede: 0.19 } },
  stropNevytap:        { before: 0.80, after: { default: 0.12, v1: 0.12, v2: 0.11, v3: 0.08 } },
  konstrukceKZemini:   { before: 1.00, after: { default: 0.22, pir: 0.15 } },
  vyplneOtvory:        { before: 2.70, after: { default: 0.90, w1: 0.90, w2: 1.10, w3: 1.10 } }
};

function guessKeyFromVariant(op){
  const v = (op.variant || '').toLowerCase() + ' ' + (op.opatreni || '').toLowerCase();
  if (v.includes('minerální') || v.includes('mv')) return 'mv';
  if (v.includes('šedý') || v.includes('sede')) return 'sede';
  if (v.includes('eps')) return 'eps';
  if (v.includes('pir')) return 'pir';
  if (v.includes('základní') || v.includes('ekonom')) return 'v1';
  if (v.includes('standard') || v.includes('doporu')) return 'v2';
  if (v.includes('komfort') || v.includes('pasiv')) return 'v3';
  if (v.includes('plast')) return 'w1';
  if (v.includes('hliník')) return 'w2';
  if (v.includes('dřevo')) return 'w3';
  return 'default';
}

export function computeEnergySavings(){
  const items = Array.isArray(window.vybranaOpatreni) ? window.vybranaOpatreni : [];
  let saved_kwh = 0;
  const details = [];

  items.forEach(op => {
    const key = op.dotaceMeasure;
    const area = parseFloat(op.area || 0);
    if (!key || !area || !U_TABLE[key]) return;
    const vKey = guessKeyFromVariant(op);
    const before = U_TABLE[key].before;
    const after = (U_TABLE[key].after[vKey] ?? U_TABLE[key].after.default);
    const deltaU = Math.max(0, before - after);
    const kwh = (area * deltaU * DEG_HOURS) / 1000;   // Wh -> kWh
    saved_kwh += kwh;
    details.push({ opatreni: op.opatreni, area, before, after, kwh: Math.round(kwh) });
  });

  const saved_czk = saved_kwh * PRICE_KWH;
  window.energyResult = {
    saved_kwh: Math.round(saved_kwh),
    saved_czk: Math.round(saved_czk),
    hdd: HDD,
    price_kwh: PRICE_KWH,
    details
  };

  // volitelně aktualizace UI (pokud existují prvky)
  const boxKwh = document.getElementById('energySavedKwh');
  const boxCzk = document.getElementById('energySavedCzk');
  if (boxKwh) boxKwh.textContent = window.energyResult.saved_kwh.toLocaleString('cs-CZ') + ' kWh/rok';
  if (boxCzk) boxCzk.textContent = window.energyResult.saved_czk.toLocaleString('cs-CZ') + ' Kč/rok';

  return window.energyResult;
}

// Přepočítej po každém přidání položky do vybranaOpatreni
// (Jednoduše hookneme addToSummary, pokud existuje)
const _origAddToSummary = window.addToSummary;
if (typeof _origAddToSummary === 'function'){
  window.addToSummary = function(...args){
    const result = _origAddToSummary.apply(this, args);
    try { computeEnergySavings(); } catch(e){ /* noop */ }
    return result;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  try { computeEnergySavings(); } catch(e){ /* noop */ }
});
