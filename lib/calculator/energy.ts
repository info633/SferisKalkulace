
export interface EnergyInputs {
  degreeDays: number; heatedAreaM2: number; heightM: number;
  uEnvelopeBefore: number; uEnvelopeAfter: number; heatPriceCZKperKWh: number;
}
export function estimateAnnualHeatingKWh(inp: EnergyInputs) {
  const Aref = inp.heatedAreaM2 * 2.2
  const UA_before = Aref * inp.uEnvelopeBefore
  const UA_after  = Aref * inp.uEnvelopeAfter
  const kWh_before = (UA_before * inp.degreeDays * 24) / 1000
  const kWh_after  = (UA_after  * inp.degreeDays * 24) / 1000
  const savingsKWh = Math.max(0, kWh_before - kWh_after)
  const savingsCZK = savingsKWh * inp.heatPriceCZKperKWh
  return { kWh_before, kWh_after, savingsKWh, savingsCZK }
}
