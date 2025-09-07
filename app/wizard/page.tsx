'use client'

import { useMemo, useState } from 'react'
import GlassCard from '../../components/GlassCard'
import Modal from '../../components/Modal'
import CompositionsPicker from '../../components/CompositionsPicker'
import type { Composition } from '../../lib/dek/types'
import rulesJson from '../../lib/subsidy_rules_v2025.json'
import measuresJson from '../../lib/measures_v2025.json'

type Program = 'NZU_LIGHT'|'OPRAV_DUM'
type Unit = 'm2'|'ks'|'kWp'|'kWh'|'bm'|'m3'
type Measure = { key:string; label:string; unit:Unit; programs:Program[] }

function formatKc(n?: number) {
  if (typeof n !== 'number' || isNaN(n)) return '-'
  try { return n.toLocaleString('cs-CZ') + ' Kč' } catch { return `${n} Kč` }
}

const U_TARGET_BY_MEASURE: Record<string, number|undefined> = {
  FACADE: 0.30, ROOF: 0.24, ATTIC: 0.30, FLOOR: 0.30, GROUND_CONTACT: 0.30
}
const WINDOWS_UW_MAX = 0.90

export default function Wizard() {
  // ===== Klient =====
  const [client, setClient] = useState({
    firstName:'', lastName:'', phone:'', email:'', birthId:'',
    permAddress:'', corrAddress:'', cadastreInfo:''
  })

  // ===== Způsobilost =====
  const [checks, setChecks] = useState({
    owner1p: true,
    noStateDebt: true,
    kolaudaceBefore2013: true,
    noPrevOpravDum: true,
    maxTwoHomes: true,
    willSetPermanentResidence: true
  })
  const disclaimers = useMemo(() => {
    const d:string[] = []
    if (!checks.owner1p) d.push('Je zapotřebí být vlastníkem nemovitosti. Pokud je vlastníků více, je nutné souhlasné prohlášení spoluvlastníků.')
    if (!checks.noStateDebt) d.push('Nejdříve je potřeba vypořádat exekučně vymáhané pohledávky vůči státu, teprve poté lze žádat o dotaci.')
    if (!checks.kolaudaceBefore2013) d.push('Dům musí mít kolaudaci starší než rok 2013 – jinak není dotace možná.')
    if (!checks.noPrevOpravDum) d.push('Lze žádat pouze na opatření, která v době udržitelnosti nebyla podporována v předchozí žádosti Oprav dům po babičce.')
    if (!checks.maxTwoHomes) d.push('Je nutné splnit majetkový test: nelze vlastnit více než 2 nemovitosti určené k bydlení.')
    if (!checks.willSetPermanentResidence) d.push('Trvalé bydliště není nutné při žádosti, ale po doložení realizace musí mít trvalé bydliště na nemovitosti všechny osoby v domácnosti.')
    return d
  }, [checks])

  // ===== Program & Bonusy =====
  const [program, setProgram] = useState<Program>('OPRAV_DUM')
  const [bonus, setBonus] = useState({
    isLowIncome: false,
    regionBonusPSCCategory: 'NONE' as 'BONUS_5'|'NONE',
    ecoPoints: 0,
    childrenCount: 0,
    childrenSharedCount: 0,
    fveSharing: false,
    fveSmartControl: false,
  })

  // ===== Opatření =====
  const allMeasures = (measuresJson as any).measures as Measure[]
  const visibleMeasures = useMemo(() => allMeasures.filter(m => m.programs.includes(program)), [allMeasures, program])
  const [inputs, setInputs] = useState<Record<string, number>>({})

  // ===== Výběr skladeb (DEK) =====
  const [selectedComp, setSelectedComp] = useState<Record<string, Composition|undefined>>({})
  const [pickerOpen, setPickerOpen] = useState<null | {measure:string}>(null)

  function unitPrice(key:string): number {
    // Pokud máme zvolenou skladbu, použij její cenu
    const comp = selectedComp[key]
    if (comp) return (comp.price.materialCZK_m2 + comp.price.laborCZK_m2)
    // jinak fallback orientační
    const map: Record<string, number> = {
      FACADE: 1500, ROOF: 1200, FLOOR: 1600, ATTIC: 800,
      WINDOWS: 6500, DOORS: 7500, SHADING: 1800,
      HEATING_HP: 120000, HEATING_BIO: 100000, HOT_WATER_HP: 45000,
      SOLAR_THERMAL: 8500, FVE_KWP: 26000, FVE_BATT: 12000,
      VENTILATION_HRV: 90000,
      RAINWATER: 7500, GREYWATER: 80000, WWHR: 50000,
      GREEN_ROOF: 1100, EV_CHARGER: 10000
    }
    return map[key] ?? 0
  }

  const rulesProg:any = (rulesJson as any).programs[program]

  // ===== Lokální náhled =====
  const preview = useMemo(() => {
    const r2 = (v:number)=> Math.floor((v||0)*100)/100
    const rules = rulesProg.areas
    let aSum=0, cSum=0, dSum=0, fveSum=0
    const rows = visibleMeasures.map(m => {
      const q = Number(inputs[m.key] || 0)
      if (!q) return null
      const price = unitPrice(m.key)
      const subtotal = Math.round(q * price)
      const item:any = { key:m.key, unit:m.unit as Unit, quantity:q, subtotal, label:m.label, comp: selectedComp[m.key] }
      const qq = r2(q); let s = 0
      const map:any = {FACADE:'FACADE_ROOF_FLOOR_EXT', ROOF:'FACADE_ROOF_FLOOR_EXT', FLOOR:'FACADE_ROOF_FLOOR_EXT', WINDOWS:'WINDOWS_DOORS', DOORS:'WINDOWS_DOORS', GROUND_CONTACT:'GROUND_CONTACT', SHADING:'SHADING', ATTIC:'ATTIC_OTHER'}
      const isA = ['FACADE','ROOF','FLOOR','WINDOWS','DOORS','GROUND_CONTACT','SHADING','ATTIC'].includes(item.key)
      if (isA){
        if (program==='OPRAV_DUM'){
          const r = rules.A.find((x:any)=>x.categoryKey===map[item.key] && x.unit===item.unit); if (r) s = qq * r.rateCZK
        } else {
          let k = map[item.key]; if (bonus.isLowIncome && (k==='FACADE_ROOF_FLOOR_EXT'||k==='ATTIC_OTHER'||k==='WINDOWS_DOORS'||k==='GROUND_CONTACT')) k = k+'_LOW'
          const r = rules.A.find((x:any)=>x.categoryKey===k && x.unit===item.unit); if (r) s = qq * r.rateCZK
        }
        aSum += s
      } else if (item.key==='FVE_KWP'){ s = qq*(rules.C3.per_kWp||0); cSum += s; fveSum += s }
      else if (item.key==='FVE_BATT'){ s = qq*(rules.C3.per_kWh||0); cSum += s; fveSum += s }
      else if (item.key==='EV_CHARGER'){ s = (rules.C3.wallbox||0); cSum += s; fveSum += s }
      else if (item.key==='VENTILATION_HRV'){ s = (rules.C4?.[0]?.rateCZK)||0; cSum += s }
      else if (item.key==='WWHR'){ s = (rules.C5?.[0]?.rateCZK)||0; cSum += s }
      else if (item.key==='GREEN_ROOF'){ const r = rules.D1?.[0]; s = Math.min(qq*r.rateCZK, r.capCZK); dSum += s }
      else if (item.key==='RAINWATER'){ const r = rules.D2?.find((x:any)=>x.key==='RAINWATER'); s = Math.min(r.baseCZK + r.per_m3*qq, r.capCZK); dSum += s }
      else if (item.key==='GREYWATER'){ const r = rules.D2?.find((x:any)=>x.key==='GREYWATER'); s = Math.min(r.baseCZK + r.per_m3*qq, r.capCZK); dSum += s }
      return {...item, subsidy: Math.round(s)}
    }).filter(Boolean) as any[]

    if (program==='OPRAV_DUM'){
      aSum = Math.min(aSum, rulesProg.caps.A_total_max||1e9)
      aSum += rulesProg.caps.A_base_support||0
    } else {
      const cap = bonus.isLowIncome ? (rulesProg.caps.A_low_income_max||250000) : (rulesProg.caps.A_total_max||500000)
      if (aSum>0){ aSum = Math.min(aSum, cap); if (aSum < (rulesProg.caps.A_minCZK||50000)) aSum = 0 }
    }
    if (fveSum>0){
      const fveMax = (bonus.fveSharing && bonus.fveSmartControl) ? rulesProg.areas.C3.max_with_sharing_and_smart : rulesProg.areas.C3.max_standard
      fveSum = Math.min(fveSum, fveMax)
    }
    const cost = rows.reduce((s:any,x:any)=>s+x.subtotal,0)
    let subsidy = Math.round(aSum + cSum + dSum)
    if (bonus.regionBonusPSCCategory==='BONUS_5') subsidy += Math.round(subsidy * 0.05)
    const net = Math.max(0, cost - subsidy)
    return { rows, totals: { cost, subsidy, net } }
  }, [inputs, program, visibleMeasures, bonus, selectedComp, rulesProg])

  // ===== U badge =====
  function UBadge({measure}:{measure:string}){
    const comp = selectedComp[measure]
    if (!comp) return null
    const u = comp.U_W_m2K
    if (measure==='WINDOWS'){
      const ok = u <= WINDOWS_UW_MAX
      return <span className={`text-xs px-2 py-1 rounded-2xl ${ok?'bg-emerald-500/20 text-emerald-200':'bg-rose-500/20 text-rose-200'}`}>Uw {u} {ok?'✓ NZÚ':'✕ nad limit'}</span>
    }
    const lim = U_TARGET_BY_MEASURE[measure]
    const ok = typeof lim==='number' ? u <= lim : true
    return <span className={`text-xs px-2 py-1 rounded-2xl ${ok?'bg-emerald-500/20 text-emerald-200':'bg-rose-500/20 text-rose-200'}`}>U {u} {ok?'✓ NZÚ':'✕ nad limit'}</span>
  }

  // ===== Submit na backend =====
  const [submitting, setSubmitting] = useState(false)
  const [serverOffer, setServerOffer] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null); setSubmitting(true)
    try {
      const payload = {
        clientDetails: client,
        eligibility: checks,
        program,
        bonus,
        items: visibleMeasures.map(m => {
          const comp = selectedComp[m.key]
          const unitPrice = unitPrice(m.key)
          return {
            assemblyId: comp?.id || 'MVP',
            assemblyName: comp?.name || m.label,
            categoryKey: m.key,
            unit: m.unit,
            quantity: Number(inputs[m.key] || 0),
            unitPriceCZK: unitPrice
          }
        })
      }
      const res = await fetch('/api/offers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setServerOffer(data.offer)
    } catch (e:any) {
      setError('Uložení na server se nezdařilo. Náhled je pouze orientační.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="grid gap-6 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="h1">Nová kalkulace</h1>
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm">Program</span>
          <select className="select" value={program} onChange={e=>setProgram(e.target.value as Program)}>
            <option value="OPRAV_DUM">Oprav dům po babičce</option>
            <option value="NZU_LIGHT">NZÚ Light</option>
          </select>
        </div>
      </div>

      {/* Opatření s výběrem skladby */}
      <GlassCard title="Opatření a rozsah (NZÚ)">
        <div className="grid md:grid-cols-2 gap-4">
          {visibleMeasures.map(m => (
            <div key={m.key} className="block text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/80">{m.label} <span className="text-white/50">({m.unit})</span></span>
                <div className="flex items-center gap-2">
                  {['FACADE','ATTIC','ROOF','FLOOR','GROUND_CONTACT','WINDOWS'].includes(m.key) && (
                    <>
                      <UBadge measure={m.key} />
                      <button className="btn" onClick={()=>setPickerOpen({measure:m.key})}>
                        {selectedComp[m.key]?.name ? 'Změnit skladbu' : 'Vybrat skladbu'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input
                type="number" min={0} step={m.unit==='ks'?1:0.1}
                className="input mt-1"
                value={inputs[m.key]||''}
                onChange={e=>setInputs({...inputs, [m.key]: e.target.value === '' ? 0 : Number(e.target.value)})}
                placeholder="0"
              />
              {selectedComp[m.key]?.name && (
                <div className="mt-1 text-xs text-white/70">
                  {selectedComp[m.key]?.name} · cena ≈ {(unitPrice(m.key)).toLocaleString('cs-CZ')} Kč/{m.unit}
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Náhled + Uložit */}
      <GlassCard title="Okamžitý náhled" actions={<button onClick={submit} disabled={submitting} className="btn btn-primary">{submitting ? 'Ukládám…' : 'Vytvořit nabídku'}</button>}>
        {(() => {
          const { rows, totals } = preview
          return rows.length===0 ? (
            <p className="text-sm text-white/70">Zadejte rozsahy opatření – náhled se zobrazí ihned.</p>
          ) : (
            <div className="space-y-4">
              <table className="table">
                <thead><tr><th>Opatření</th><th>Množství</th><th>Cena</th><th>Dotace (náhled)</th></tr></thead>
                <tbody>{rows.map((r:any,i:number)=>(
                  <tr key={i}>
                    <td>{r.label}{r.comp?.name ? <div className="text-xs text-white/60">{r.comp.name}</div> : null}</td>
                    <td>{r.quantity} {r.unit}</td>
                    <td>{formatKc(r.subtotal)}</td>
                    <td>{formatKc(r.subsidy)}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="text-sm grid md:grid-cols-3 gap-3">
                <div className="glass glass-ink rounded-2xl p-3"><div className="text-white/60">Celkové náklady</div><div className="text-lg font-semibold">{formatKc(totals.cost)}</div></div>
                <div className="glass glass-ink rounded-2xl p-3"><div className="text-white/60">Dotace</div><div className="text-lg font-semibold">{formatKc(totals.subsidy)}</div></div>
                <div className="glass glass-ink rounded-2xl p-3"><div className="text-white/60">Klient doplatí</div><div className="text-lg font-semibold">{formatKc(totals.net)}</div></div>
              </div>
            </div>
          )
        })()}
      </GlassCard>

      {serverOffer?.id && (
        <GlassCard title="Nabídka uložena">
          <div className="text-sm">
            Exporty: <a className="underline" href={`/api/offers/${serverOffer.id}/json`} target="_blank">JSON</a>
            <span className="px-1">·</span>
            <a className="underline" href={`/api/offers/${serverOffer.id}/pdf`} target="_blank">PDF</a>
          </div>
        </GlassCard>
      )}
      {error && <div className="text-sm text-red-400">{error}</div>}

      {/* Modal picker */}
      <Modal
        open={!!pickerOpen}
        title={pickerOpen ? `Výběr skladby — ${pickerOpen.measure}` : ''}
        onClose={()=>setPickerOpen(null)}>
        {pickerOpen && (
          <CompositionsPicker
            program={program}
            measure={pickerOpen.measure as any}
            targetU={U_TARGET_BY_MEASURE[pickerOpen.measure]}
            selectedId={selectedComp[pickerOpen.measure]?.id}
            onSelect={(c)=>{ setSelectedComp({...selectedComp, [pickerOpen.measure!]: c}); setPickerOpen(null) }}
          />
        )}
      </Modal>
    </div>
  )
}
