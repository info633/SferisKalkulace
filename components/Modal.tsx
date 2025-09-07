
'use client'
import { ReactNode, useEffect } from 'react'

export default function Modal({
  open,
  title,
  children,
  onClose
}:{
  open: boolean
  title?: string
  children: ReactNode
  onClose: () => void
}){
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="glass glass-ink rounded-3xl border w-full max-w-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h2">{title}</div>
            <button onClick={onClose} className="btn">Zavřít</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
