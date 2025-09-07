import { describe, it, expect } from 'vitest'
import { computeOfferSubsidy } from '../../lib/calculator/subsidy'

describe('computeOfferSubsidy – základ', () => {
  it('A+FVE (sdílení+smart => 140k) + region 5%', () => {
    const items:any = [
      { categoryKey:'FACADE', assemblyName:'ETICS', unit:'m2', quantity: 120, unitPriceCZK: 1500, subtotalCZK: 180000, subsidyCZK: 0 },
      { categoryKey:'FVE', assemblyName:'FVE výkon', unit:'kWp', quantity: 5, unitPriceCZK: 0, subtotalCZK: 0, subsidyCZK: 0 },
      { categoryKey:'FVE', assemblyName:'FVE baterie', unit:'kWh', quantity: 5, unitPriceCZK: 0, subtotalCZK: 0, subsidyCZK: 0 },
    ]
    const res = computeOfferSubsidy('OPRAV_DUM', items, {
      regionBonusPSCCategory:'BONUS_5',
      fveSharing: true,
      fveSmartControl: true
    } as any)
    expect(res.totals.subsidyCZK).toBeGreaterThan(0)
  })
})
