// app/api/dek/compositions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const program = (searchParams.get('program') || 'OPRAV_DUM')
  const measure = searchParams.get('measure')
  const targetU = parseFloat(searchParams.get('targetU') || '')
  const onlyEligible = searchParams.get('eligible') === '1'

  const filePath = path.join(process.cwd(), 'lib', 'dek', 'sample_compositions.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  const all = JSON.parse(raw)

  let list = (all?.compositions || []) as any[]
  if (measure) list = list.filter(c => c.measureKey === measure)
  if (onlyEligible) list = list.filter(c => !c.eligibility?.minProgram || c.eligibility?.minProgram.includes(program))
  if (!Number.isNaN(targetU)) list = list.filter(c => typeof c.U_W_m2K === 'number' && c.U_W_m2K <= targetU)

  return NextResponse.json({ ok: true, items: list })
}
