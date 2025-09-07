
export type Role = 'ADMIN' | 'REP';
export type MeasureCategoryKey =
  | 'FACADE' | 'ROOF' | 'FLOOR' | 'WINDOWS' | 'DOORS'
  | 'FVE' | 'HEATING' | 'HOT_WATER' | 'VENTILATION'
  | 'RAINWATER' | 'GREEN_ROOF' | 'WASTE_WATER_HEAT';
export interface Assembly {
  id: string; categoryKey: MeasureCategoryKey; code: string; name: string;
  description?: string; unit: 'm2'|'ks'|'kWp'|'kWh'|'bm'; unitPriceCZK: number;
  uValueTarget?: number; eligibleForSubsidy: boolean; supplierCode?: string; imageUrl?: string;
}
export interface OfferItem {
  assemblyId: string; assemblyName: string; categoryKey: MeasureCategoryKey;
  quantity: number; unit: 'm2'|'ks'|'kWp'|'kWh'|'bm'; unitPriceCZK: number; subtotalCZK: number; subsidyCZK: number;
}
export interface Offer {
  id: string; clientName: string; propertyAddress: string; createdByUserId: string;
  program: 'NZU_LIGHT'|'OPRAV_DUM'; items: OfferItem[];
  totals: { costCZK: number; subsidyCZK: number; netCZK: number; estimatedAnnualSavingsCZK?: number; };
  createdAt: number; status: 'DRAFT'|'SENT'|'ACCEPTED'|'REJECTED';
}
export interface SubsidyRule {
  id: string; program: 'NZU_LIGHT'|'OPRAV_DUM';
  categoryKey: MeasureCategoryKey; unit: 'm2'|'kWp'|'kWh'|'ks'|'bm';
  rateCZK: number; minCZK?: number; maxCZK?: number; notes?: string; version: string; criteria?: Record<string, unknown>;
}
