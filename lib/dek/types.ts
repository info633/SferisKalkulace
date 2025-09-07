
// lib/dek/types.ts

export type NZUProgram = 'OPRAV_DUM' | 'NZU_LIGHT'
export type MeasureKey =
  | 'FACADE' | 'ROOF' | 'ATTIC' | 'FLOOR' | 'GROUND_CONTACT'
  | 'WINDOWS' | 'DOORS'

export interface Layer {
  code?: string            // DEK/BIM code
  name: string
  material: string
  thickness_mm: number
  lambda_W_mK?: number
  density_kg_m3?: number
}

export interface Composition {
  id: string
  bimCode?: string
  measureKey: MeasureKey
  name: string
  description?: string
  layers: Layer[]
  // calculated props
  U_W_m2K: number
  fireClass?: string
  vaporOpen?: boolean
  // pricing (baseline, overridable by admin pricelists)
  price: {
    materialCZK_m2: number
    laborCZK_m2: number
  }
  // NZÚ eligibility constraints metadata (for quick client-side badges)
  eligibility: {
    minProgram?: NZUProgram[]            // if only for specific program
    minU_W_m2K?: number                  // U must be <= this to qualify
    windows_Uw_max?: number              // only for WINDOWS/DOORS
    note?: string
  }
  // assets
  imageUrl?: string
  datasheetUrl?: string
}
