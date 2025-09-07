
import GlassCard from '../components/GlassCard'

export default function Page() {
  return (
    <div className="grid gap-6 md:gap-8">
      <div className="text-center">
        <h1 className="h1">Kalkulace dotací – iOS Liquid Glass UI</h1>
        <p className="mt-2 text-white/70">Rychlý náhled opatření, dotací a export nabídky pro NZÚ Light / Oprav dům.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <GlassCard title="Nová kalkulace" actions={<a href="/wizard" className="btn btn-primary">Spustit</a>}>
          <p className="text-white/80">Průvodce sběrem údajů o klientovi, způsobilosti a rozsahu opatření s live náhledem.</p>
        </GlassCard>
        <GlassCard title="Admin">
          <p className="text-white/80">Správa pravidel dotací, ceníků a skladeb (v dalším sprintu).</p>
        </GlassCard>
        <GlassCard title="Exporty">
          <p className="text-white/80">Export PDF/JSON nabídky připravený pro Make → Raynet.</p>
        </GlassCard>
      </div>
    </div>
  )
}
