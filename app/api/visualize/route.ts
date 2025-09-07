import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { offerId, sourceImageUrl, prompt } = await req.json()
    const doc = await db.collection('visualizationJobs').add({
      offerId, sourceImageUrl, prompt, status: 'QUEUED', createdAt: Date.now()
    })
    return NextResponse.json({ ok: true, jobId: doc.id, status: 'QUEUED' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Bad request' }, { status: 400 })
  }
}
