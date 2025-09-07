
import rulesAll from '../subsidy_rules_v2025.json'
import type { OfferItem } from '../types'

const round2down = (v:number) => Math.floor((v||0)*100)/100

export type Program = 'NZU_LIGHT' | 'OPRAV_DUM'
export interface BonusInputs {
  isLowIncome?: boolean
  regionBonusPSCCategory?: 'BONUS_5' | 'NONE'
  ecoPoints?: number
  childrenCount?: number
  childrenSharedCount?: number
  fveSharing?: boolean
  fveSmartControl?: boolean
}

function isAcat(cat?: string){
  return ['FACADE','ROOF','FLOOR','WINDOWS','DOORS','GROUND_CONTACT','SHADING','ATTIC'].includes(cat||'')
}
function isCcat(cat?: string){
  return ['HEATING','HOT_WATER','HOT_WATER_SYS','FVE','VENTILATION','WASTE_WATER_HEAT'].includes(cat||'')
}
function isDcat(cat?: string){
  return ['GREEN_ROOF','RAINWATER','GREYWATER'].includes(cat||'')
}

/**
 * Nový výpočet dotace dle metodiky 2025.2 (Oprav dům + Light), včetně bonusů.
 * - Zaokrouhluje vstupy na 2 desetinná místa dolů
 * - Hlídá FVE stropy 100k/140k a Light A strop 250k pro nízkopříjmové
 * - Přičítá základ 50k (Oprav dům) a bonusy (region, kombinační, eco, rodinný)
 */
export function computeOfferSubsidy(
  program: Program,
  items: OfferItem[],
  bonus: BonusInputs = {}
){
  const rules:any = (rulesAll as any).programs[program]
  if (!rules) throw new Error('Pravidla programu nenalezena')

  let aSum = 0, cSum = 0, dSum = 0, fveSum = 0
  const computed = items.map(it=>{
    const qty = round2down(it.quantity || 0)
    let subsidy = 0

    // A – zateplení
    if (program==='OPRAV_DUM' && isAcat(it.categoryKey)){
      const map:any = {
        FACADE:'FACADE_ROOF_FLOOR_EXT', ROOF:'FACADE_ROOF_FLOOR_EXT', FLOOR:'FACADE_ROOF_FLOOR_EXT',
        WINDOWS:'WINDOWS_DOORS', DOORS:'WINDOWS_DOORS',
        GROUND_CONTACT:'GROUND_CONTACT', SHADING:'SHADING', ATTIC:'ATTIC_OTHER'
      }
      const key = map[it.categoryKey]
      const r = rules.areas.A.find((x:any)=>x.categoryKey===key && x.unit===it.unit)
      if (r) subsidy = qty * r.rateCZK
    }
    if (program==='NZU_LIGHT' && isAcat(it.categoryKey)){
      const low = !!bonus.isLowIncome
      const map:any = {
        FACADE:'FACADE_ROOF_FLOOR_EXT', ROOF:'FACADE_ROOF_FLOOR_EXT', FLOOR:'FACADE_ROOF_FLOOR_EXT',
        WINDOWS:'WINDOWS_DOORS', DOORS:'WINDOWS_DOORS',
        GROUND_CONTACT:'GROUND_CONTACT', SHADING:'SHADING', ATTIC:'ATTIC_OTHER'
      }
      let key = map[it.categoryKey]
      if (low && (key==='FACADE_ROOF_FLOOR_EXT'|| key==='ATTIC_OTHER'|| key==='WINDOWS_DOORS'|| key==='GROUND_CONTACT')){
        key = key + '_LOW'
      }
      const r = rules.areas.A.find((x:any)=>x.categoryKey===key && x.unit===it.unit)
      if (r) subsidy = qty * r.rateCZK
    }

    // C.1 – HEATING (fixní dle assemblyName nebo custom cKey)
    if (it.categoryKey==='HEATING'){
      const C1 = rules.areas.C1 || []
      const name = (it.assemblyName||'').toUpperCase()
      const rate = (k:string, withDHW?:boolean)=>{
        const rule = C1.find((x:any)=>x.key===k)
        if (!rule) return 0
        if (withDHW && rule.withDHW) return rule.withDHW
        return rule.rateCZK||0
      }
      subsidy =
        name.includes('KOTEL BIO+') ? rate('KOTEL_BIO_PLUS') :
        name.includes('KOTEL BIO')   ? rate('KOTEL_BIO') :
        name.includes('KAMNA')       ? rate('KAMNA') :
        name.includes('TČ VZDUCH-VZDUCH+') ? rate('TC_A', true) :
        name.includes('TČ VZDUCH-VZDUCH')  ? rate('TC_A') :
        name.includes('TČ VZDUCH-VODA+')   ? rate('TC_V', true) :
        name.includes('TČ VZDUCH-VODA')    ? rate('TC_V') :
        (name.includes('TČ ZEMĚ/VODA+') || name.includes('TČ VODA/VODA+')) ? rate('TC_K', true) :
        (name.includes('TČ ZEMĚ/VODA')  || name.includes('TČ VODA/VODA'))  ? rate('TC_K') :
        name.includes('CZT') ? rate('CZT') : 0
    }

    // C.2 – ohřev vody
    if (it.categoryKey==='HOT_WATER_SYS'){
      const C2 = rules.areas.C2||[]
      const rate = (k:string)=>C2.find((x:any)=>x.key===k)?.rateCZK||0
      const name = (it.assemblyName||'').toUpperCase()
      subsidy =
        name.includes('SOL+')     ? rate('SOL_PLUS') :
        name.includes('SOL')      ? rate('SOL') :
        name.includes('FV')       ? rate('FV') :
        name.includes('TČ-V')     ? rate('TC_DHW') : 0
    }

    // C.3 – FVE (kWp/kWh + wallbox) s limity
    if (it.categoryKey==='FVE'){
      const cfg = rules.areas.C3
      let val = 0
      if (it.unit==='kWp')  val = round2down(qty) * cfg.per_kWp
      if (it.unit==='kWh')  val = round2down(qty) * cfg.per_kWh
      if (it.unit==='ks' && (it.assemblyName||'').toUpperCase().includes('WALLBOX')) val = cfg.wallbox
      subsidy = val
    }

    // C.4 / C.5
    if (it.categoryKey==='VENTILATION'){
      subsidy = (rules.areas.C4?.[0]?.rateCZK)||0
    }
    if (it.categoryKey==='WASTE_WATER_HEAT'){
      subsidy = (rules.areas.C5?.[0]?.rateCZK)||0
    }

    // D.1 – zelená střecha
    if (it.categoryKey==='GREEN_ROOF'){
      const r = rules.areas.D1?.[0]
      subsidy = Math.min(round2down(qty) * r.rateCZK, r.capCZK)
    }

    // D.2 – dešťová / šedá
    if (it.categoryKey==='RAINWATER' || it.categoryKey==='GREYWATER'){
      const r = rules.areas.D2.find((x:any)=>x.key===it.categoryKey)
      subsidy = Math.min(r.baseCZK + r.per_m3 * round2down(qty), r.capCZK)
    }

    // sumarizace
    if (isAcat(it.categoryKey)) aSum += subsidy
    if (isCcat(it.categoryKey)) cSum += subsidy
    if (isDcat(it.categoryKey)) dSum += subsidy
    if (it.categoryKey==='FVE') fveSum += subsidy

    return { ...it, subsidyCZK: Math.round(subsidy) }
  })

  // Specifické stropy
  let baseSupport = 0
  if (program==='OPRAV_DUM'){
    baseSupport = rules.caps.A_base_support || 0
    aSum = Math.min(aSum, rules.caps.A_total_max || 1e9)
  }
  if (program==='NZU_LIGHT'){
    const cap = bonus.isLowIncome ? (rules.caps.A_low_income_max||250000) : (rules.caps.A_total_max||500000)
    aSum = Math.min(aSum, cap)
    if (aSum>0 && aSum < (rules.caps.A_minCZK||50000)) aSum = 0
  }
  // FVE stropy
  if (fveSum>0){
    const cfg = rules.areas.C3
    const fveMax = (bonus.fveSharing && bonus.fveSmartControl) ? cfg.max_with_sharing_and_smart : cfg.max_standard
    fveSum = Math.min(fveSum, fveMax)
  }

  // Dotace bez bonusů
  let subsidyTotal = Math.round(aSum + (cSum) + (dSum) + (fveSum ? 0 : 0) + baseSupport)
  // (pozn.: cSum už zahrnuje fveSum, výše jsme fveSum jen ořezali – ponecháme cSum)

  // Bonusy
  let bonusSum = 0
  // Kombinační
  const comboDefs = rules.bonuses.combo || []
  const hasA = aSum>0
  const hasC1 = computed.some(it=>it.categoryKey==='HEATING' && it.quantity>0)
  const hasC = computed.some(it=>isCcat(it.categoryKey) && it.quantity>0)
  for (const b of comboDefs){
    if (b.when==='A+ C1' && hasA && hasC1) bonusSum += b.amountCZK
    if (b.when==='A+ C(any)' && hasA && hasC) { bonusSum += b.amountCZK; if (b.once) break; }
  }
  // Region
  if (bonus.regionBonusPSCCategory==='BONUS_5'){
    const pct = (rules.bonuses.region_percent||0)/100
    bonusSum += Math.round(subsidyTotal * pct)
  }
  // Env.
  if ((bonus.ecoPoints||0)>0){
    const e = rules.bonuses.eco_points
    bonusSum += Math.min((bonus.ecoPoints||0) * e.perPointCZK, e.capCZK)
  }
  // Rodina
  if (program==='OPRAV_DUM'){
    const fam = rules.bonuses.family
    bonusSum += (bonus.childrenCount||0) * fam.perChild + (bonus.childrenSharedCount||0) * fam.sharedCare
  }

  subsidyTotal += bonusSum

  // Povinnosti: C vyžaduje A (Oprav dům)
  const requiresA = rules.requires?.C_requires_A
  const hasOnlyC = (aSum===0) && computed.some(it=>isCcat(it.categoryKey) && it.quantity>0)
  const warnings:string[] = []
  if (program==='OPRAV_DUM' && requiresA && hasOnlyC){
    warnings.push('V programu Oprav dům lze oblast C čerpat pouze v kombinaci se zateplením (oblast A).')
  }

  return {
    items: computed,
    totals: {
      subsidyCZK: subsidyTotal,
      breakdown: { aSum, cSum, dSum, fveSum, baseSupport, bonusSum },
      warnings
    }
  }
}

// Backward-compatible wrapper (old API)
export function computeSubsidy(items: OfferItem[], program: Program){
  return computeOfferSubsidy(program, items, {})
}
