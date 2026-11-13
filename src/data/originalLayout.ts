import { againstWall, ROOM } from './room'
import { CATALOG } from './catalog'
import type { FurnitureType, Item } from './types'

/** Bump when the reconstructed original layout changes, so stale browser storage is discarded. */
export const LAYOUT_VERSION = 1

type Pose = { x: number; z: number; rot: number }

function make(id: string, type: FurnitureType, pose: Pose, extra: Partial<Item> = {}): Item {
  const c = CATALOG[type]
  return { id, type, name: c.label, w: c.w, d: c.d, h: c.h, y: c.y ?? 0, ...pose, ...extra }
}

const K = CATALOG
const HALF_PI = Math.PI / 2

/**
 * Original furniture arrangement, reconstructed from the sketch (positions along the walls)
 * and cross-checked against the photographs.
 */
export function buildOriginalLayout(): Item[] {
  const dresser = againstWall('window', 3.55, K.dresser.d, 0.03)
  const tv = againstWall('window', 3.4, K.tv.d, 0.0)
  const table = againstWall('window', 1.9, K.coffeeTable.d, 0.3)
  const fan = againstWall('window', 4.55, K.fan.d, 0.1)
  const basket = againstWall('window', 4.06, K.basket.d, 0.1)
  const stools = againstWall('window', 3.06, K.stools.d, 0.04)

  return [
    // kitchen wall (x = 0): door zone z 0…0.94, kitchenette z 0.94…2.84
    make('kitchen', 'kitchen', { x: K.kitchen.d / 2 + 0.005, z: 0.94 + K.kitchen.w / 2, rot: HALF_PI }, { locked: true }),
    // long sofa wall (z = 0), from the door towards the bed
    make('fridge', 'fridge', { x: 1.22, z: 0.3, rot: 0 }),
    make('microwave', 'microwave', { x: 1.22, z: 0.3, rot: 0 }),
    make('sofa', 'sofa', { x: 2.4, z: 0.42, rot: 0 }),
    make('painting', 'painting', { x: 2.2, z: 0.018, rot: 0 }),
    make('floorPlate', 'floorPlate', { x: 3.72, z: 0.45, rot: 0 }),
    make('stove', 'stove', { x: 3.72, z: 0.47, rot: 0 }),
    make('heatShield', 'heatShield', { x: 4.03, z: 0.285, rot: HALF_PI }),
    make('wardrobe', 'wardrobe', { x: 4.04 + K.wardrobe.w / 2, z: 0.285, rot: 0 }),
    // bed niche
    make('bed', 'bed', { x: ROOM.length - K.bed.d / 2 - 0.005, z: 0.86, rot: -HALF_PI }),
    make('wallCabinets', 'wallCabinets', { x: ROOM.length - K.wallCabinets.d / 2, z: 0.84, rot: -HALF_PI }),
    // window wall
    make('coffeeTable', 'coffeeTable', table),
    make('stools', 'stools', stools),
    make('dresser', 'dresser', dresser),
    make('tv', 'tv', tv),
    make('basket', 'basket', basket),
    make('fan', 'fan', { ...fan, rot: fan.rot + 0.35 }),
  ]
}

export const ORIGINAL_LAYOUT: Item[] = buildOriginalLayout()
export const originalById = (id: string) => ORIGINAL_LAYOUT.find((i) => i.id === id)
