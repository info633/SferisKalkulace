// lib/dek/types.ts
export type NZUProgram = 'OPRAV_DUM' | 'NZU_LIGHT'

export type MeasureKey =
  | 'FACADE' | 'ROOF' | 'ATTIC' | 'FLOOR' | 'GROUND_CONTACT'
  | 'WINDOWS' | 'DOORS'

export interface CompositionPrice {
  materialCZK_m2: number
  laborCZK_m2: number
}

export interface Composition {
  id: string
  measureKey: MeasureKey
  name: string
  description?: string
  U_W_m2K: number
  price: CompositionPrice
  eligibility?: {
    minProgram?: NZUProgram[]
    minU_W_m2K?: number
    windows_Uw_max?: number
  }
  imageUrl?: string
  datasheetUrl?: string
}
