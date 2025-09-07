
import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebaseAdmin'
import { computeOfferSubsidy } from '../../../lib/calculator/subsidy'
import type { OfferItem } from '../../../lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientDetails, eligibility, program, items: rawItems, bonus } = body

    const items: OfferItem[] = (rawItems || []).map((it: any) => ({
      assemblyId: it.assemblyId || 'MVP',
      assemblyName: it.assemblyName || it.categoryKey,
      categoryKey: it.categoryKey,
      quantity: Number(it.quantity || 0),
      unit: it.unit,
      unitPriceCZK: Number(it.unitPriceCZK || 0),
      subtotalCZK: Math.round(Number(it.quantity || 0) * Number(it.unitPriceCZK || 0)),
      subsidyCZK: 0,
    }))

    const calc = computeOfferSubsidy(program, items, bonus || {})
    const cost = items.reduce((s, it) => s + (it.subtotalCZK || 0), 0)
    const subsidyTotal = calc.totals.subsidyCZK
    const net = Math.max(0, cost - subsidyTotal)

    if (!process.env.GCP_PROJECT_ID || process.env.LOCAL_MODE === '1') {
      const offer = {
        id: `local-${Date.now()}`,
        clientDetails, eligibility, program, bonus: bonus || {},
        items: calc.items,
        totals: { costCZK: cost, subsidyCZK: subsidyTotal, netCZK: net, breakdown: calc.totals.breakdown, warnings: calc.totals.warnings },
        createdAt: Date.now(), status: 'DRAFT',
      }
      return NextResponse.json({ ok: true, offer })
    }

    const doc = await db.collection('offers').add({
      clientDetails, eligibility, program, bonus: bonus || {},
      items: calc.items,
      totals: { costCZK: cost, subsidyCZK: subsidyTotal, netCZK: net, breakdown: calc.totals.breakdown, warnings: calc.totals.warnings },
      createdAt: Date.now(), status: 'DRAFT',
    })
    const offer = { id: doc.id, ...((await doc.get()).data() as any) }
    return NextResponse.json({ ok: true, offer })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
