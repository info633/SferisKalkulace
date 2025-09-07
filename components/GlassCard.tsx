
import { ReactNode } from 'react'

export default function GlassCard({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="ring-card glass glass-ink p-5 md:p-6 rounded-3xl">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title ? <h2 className="h2">{title}</h2> : <div />}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
