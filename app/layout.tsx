
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'NZÚ Kalkulátor — MVP',
  description: 'Kalkulace dotací, rozpočty a nabídky',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <div className="container py-8 md:py-12">
          <header className="ring-card glass glass-ink p-4 md:p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" />
              <div className="text-lg md:text-xl font-semibold">NZÚ Kalkulátor</div>
            </div>
            <nav className="text-sm flex items-center gap-3 md:gap-5">
              <a className="underline/30 hover:underline" href="/">Domů</a>
              <a className="underline/30 hover:underline" href="/wizard">Nová kalkulace</a>
              <a className="underline/30 hover:underline" href="/admin">Admin</a>
            </nav>
          </header>

          <main className="mt-8 md:mt-10">{children}</main>

          <footer className="mt-10 md:mt-14 text-xs text-white/60">
            © {new Date().getFullYear()} SFERIS česká konstrukční s.r.o.
          </footer>
        </div>
      </body>
    </html>
  )
}
