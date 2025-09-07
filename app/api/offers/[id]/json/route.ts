import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../../lib/firebaseAdmin'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const snap = await db.collection('offers').doc(params.id).get()
  if (!snap.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, offer: { id: snap.id, ...snap.data() } })
}
