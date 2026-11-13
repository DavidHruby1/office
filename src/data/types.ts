export type FurnitureType =
  | 'kitchen' | 'fridge' | 'microwave' | 'sofa' | 'stove' | 'floorPlate' | 'heatShield'
  | 'wardrobe' | 'bed' | 'wallCabinets' | 'dresser' | 'tv' | 'coffeeTable' | 'fan'
  | 'basket' | 'stools' | 'painting'
  | 'desk' | 'chair' | 'bookshelf' | 'armchair' | 'plant' | 'rug'

/** One movable object. Everything is serialisable; this is the single source of truth for 2D and 3D. */
export interface Item {
  id: string
  type: FurnitureType
  name: string
  /** footprint centre on the floor plan (metres) */
  x: number
  z: number
  /** rotation about the vertical axis (radians). rot = 0 → the item's front faces +z */
  rot: number
  /** width (local x), depth (local z), height */
  w: number
  d: number
  h: number
  /** elevation of the item's underside above the floor (wall-mounted / stacked items) */
  y: number
  finish?: string
  color?: string
  hidden?: boolean
  locked?: boolean
}

export interface LayoutFile {
  app: 'room-twin'
  version: number
  savedAt: string
  items: Item[]
}
