import { NextRequest } from 'next/server'
import { db } from '../../../../../lib/firebaseAdmin'
import puppeteer from 'puppeteer'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const snap = await db.collection('offers').doc(params.id).get()
  if (!snap.exists) return new Response('Not found', { status: 404 })
  const offer = { id: snap.id, ...snap.data() } as any

  const html = `<html><body><h1>Nabídka – NZÚ (MVP)</h1></body></html>`

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({ format: 'A4' })
  await browser.close()

  return new Response(pdf, {
    status: 200,
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="nabidka-${offer.id}.pdf"` }
  })
}
