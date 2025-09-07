// components/CompositionsPicker.tsx
'use client'
import { useEffect, useState } from 'react'
import type { NZUProgram, MeasureKey, Composition } from '../../lib/dek/types'

export default function CompositionsPicker({
  program,
  measure,
  targetU,
  selectedId,
  onSelect
}:{
  program: NZUProgram
  measure: MeasureKey
  targetU?: number
  selectedId?: string
  onSelect: (c: Composition)=>void
}){
  const [list, setList] = useState<Composition[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true)
      const params = new URLSearchParams({ program, measure, eligible: '1' })
      if (targetU) params.set('targetU', String(targetU))
      const res = await fetch(`/api/dek/compositions?${params.toString()}`)
      const data = await res.json()
      setList(data.items||[])
      setLoading(false)
    }
    load()
  }, [program, measure, targetU])

  if (loading) return <div className="text-white/70 text-sm">Načítám skladby…</div>
  if (list.length===0) return <div className="text-white/70 text-sm">Pro tuto kombinaci nejsou dostupné skladby.</div>

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {list.map(c => (
        <button key={c.id}
          className={`text-left p-3 rounded-2xl border ${selectedId===c.id?'border-white/70 bg-white/10':'border-white/20 bg-white/5'}`}
          onClick={()=>onSelect(c as any)}>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-white/70">{c.description}</div>
          <div className="mt-2 text-xs text-white/80">
            U = {c.U_W_m2K} W/m²K · cena ≈ {(c.price.materialCZK_m2 + c.price.laborCZK_m2).toLocaleString('cs-CZ')} Kč/m²
          </div>
        </button>
      ))}
    </div>
  )
}
