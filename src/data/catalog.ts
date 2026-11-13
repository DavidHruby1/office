import type { FurnitureType } from './types'

export type Confidence = 'high' | 'medium' | 'low'

export interface CatalogEntry {
  type: FurnitureType
  label: string
  w: number
  d: number
  h: number
  y?: number
  /** thin objects lying on the floor – ignored by collision checks */
  flat?: boolean
  defaultFinish: string
  /** finishes offered in the inspector */
  finishes: string[]
  /** footprint colour in the 2D plan */
  plan: string
  /** part of the photographed room (true) or an extra catalogue piece for experiments */
  original: boolean
  source?: string
  confidence?: Confidence
  notes?: string
}

const WOODS = ['oakArtisan', 'oakGrey', 'oakWeathered', 'oakRustic', 'sonoma', 'pine', 'walnut', 'white', 'anthracite', 'black']
const FABRICS = ['fabricCharcoal', 'fabricGrey', 'fabricBeige', 'fabricBlue', 'fabricGreen', 'fabricTerracotta']
const APPLIANCE = ['white', 'cream', 'steel', 'anthracite', 'black']

export const CATALOG: Record<FurnitureType, CatalogEntry> = {
  kitchen: {
    type: 'kitchen', label: 'Kitchenette', w: 1.9, d: 0.63, h: 2.09, defaultFinish: 'black', finishes: WOODS,
    plan: '#57534e', original: true, source: 'Sketch: 190 × 63 cm. Heights from photos.', confidence: 'high',
    notes: 'Black base fronts, artisan-oak wall units (left one mounted higher with slim hood), grey-oak worktop, 2-zone hob, inset steel sink. Cabinet split 30/60/50/50 cm estimated from photo 203222.',
  },
  fridge: {
    type: 'fridge', label: 'Fridge (Gorenje)', w: 0.52, d: 0.52, h: 1.43, defaultFinish: 'white', finishes: APPLIANCE,
    plan: '#e7e5e4', original: true, source: 'Sketch: 52 × 52 cm. Height estimated.', confidence: 'medium',
    notes: 'Height 143 cm estimated from photos 203057 / 203116 (top is above camera level).',
  },
  microwave: {
    type: 'microwave', label: 'Microwave', w: 0.46, d: 0.34, h: 0.27, y: 1.43, defaultFinish: 'cream', finishes: APPLIANCE,
    plan: '#d6cfb8', original: true, source: 'Estimated from photo 203057.', confidence: 'medium',
    notes: 'Cream LogoStar microwave standing on the fridge.',
  },
  sofa: {
    type: 'sofa', label: 'Sofa bed', w: 1.8, d: 0.8, h: 0.8, defaultFinish: 'sofaThrow', finishes: ['sofaThrow', ...FABRICS],
    plan: '#4b5258', original: true, source: 'Sketch: 180 × 80 cm.', confidence: 'high',
    notes: 'Armless click-clack sofa bed under a charcoal waffle throw, two light pillows. Seat/back heights estimated.',
  },
  stove: {
    type: 'stove', label: 'Wood stove + flue', w: 0.4, d: 0.38, h: 0.88, defaultFinish: 'blackSteel', finishes: ['blackSteel', 'anthracite', 'steel'],
    plan: '#292524', original: true, source: 'Sketch: stove zone 90 × 80 cm incl. clearance. Body estimated.', confidence: 'medium',
    notes: 'Black steel stove with stone side tiles. The flue (vertical piece, elbow, diagonal run to the wall thimble ≈1.95 m high) moves with the stove – in reality the thimble is fixed.',
  },
  floorPlate: {
    type: 'floorPlate', label: 'Stove floor plate', w: 0.55, d: 0.8, h: 0.004, flat: true, defaultFinish: 'plateGrey', finishes: ['plateGrey', 'steel', 'anthracite', 'black'],
    plan: '#a8a29e', original: true, source: 'Estimated from photos 203133 / 203200.', confidence: 'medium',
  },
  heatShield: {
    type: 'heatShield', label: 'Heat-shield board', w: 0.55, d: 0.012, h: 1.15, y: 0.16, defaultFinish: 'shieldBrown', finishes: ['shieldBrown', 'anthracite', 'steel'],
    plan: '#6b4f3f', original: true, source: 'Estimated from photos 203126 / 203147.', confidence: 'medium',
    notes: 'Brown board fixed to the wardrobe side facing the stove.',
  },
  wardrobe: {
    type: 'wardrobe', label: 'Mirror wardrobe', w: 1.15, d: 0.55, h: 1.97, defaultFinish: 'oakRustic', finishes: WOODS,
    plan: '#8a6a4a', original: true, source: 'Sketch: 115 × 55 cm. Height estimated.', confidence: 'high',
    notes: 'Two full-height mirror doors, rustic oak carcass.',
  },
  bed: {
    type: 'bed', label: 'Double bed', w: 1.7, d: 2.0, h: 0.92, defaultFinish: 'pine', finishes: WOODS,
    plan: '#3b6fb5', original: true, source: 'Sketch: 170 × 200 cm.', confidence: 'high',
    notes: 'Solid light-wood frame, slotted headboard with shelf board and a small lamp, orange sheet, two blue blankets.',
  },
  wallCabinets: {
    type: 'wallCabinets', label: 'Wall cabinets (bed)', w: 1.6, d: 0.3, h: 0.42, y: 1.36, defaultFinish: 'sonoma', finishes: WOODS,
    plan: '#c9b79a', original: true, source: 'Estimated from photos 203151 / 203142.', confidence: 'medium',
    notes: 'Three lift-up units with aluminium handles above the headboard.',
  },
  dresser: {
    type: 'dresser', label: 'Chest of drawers', w: 0.6, d: 0.4, h: 0.98, defaultFinish: 'oakArtisan', finishes: WOODS,
    plan: '#b98d55', original: true, source: 'Sketch: 60 × 40 cm. Height estimated.', confidence: 'high',
    notes: 'Anthracite carcass, four handle-less artisan-oak drawer fronts.',
  },
  tv: {
    type: 'tv', label: 'TV (wall-mounted)', w: 0.97, d: 0.4, h: 0.57, y: 1.2, defaultFinish: 'black', finishes: ['black', 'anthracite', 'steel'],
    plan: '#18181b', original: true, source: 'Estimated (≈43″) from photo 203123.', confidence: 'medium',
    notes: 'On a swivel arm on the pier between the two windows, turned about 20° towards the sofa/kitchen. The footprint includes the swing of the arm.',
  },
  coffeeTable: {
    type: 'coffeeTable', label: 'Coffee table', w: 1.0, d: 0.5, h: 0.45, defaultFinish: 'oakWeathered', finishes: WOODS,
    plan: '#a39480', original: true, source: 'Sketch: 100 × 50 cm. Height estimated.', confidence: 'high',
    notes: 'Black steel frame, grey-oak top, lower shelf with drawer. Exact distance from the window wall is uncertain (sketch vs photos).',
  },
  fan: {
    type: 'fan', label: 'Pedestal fan', w: 0.45, d: 0.45, h: 1.25, defaultFinish: 'white', finishes: APPLIANCE,
    plan: '#f5f5f4', original: true, source: 'Estimated from photos 203116 / 203123.', confidence: 'medium',
  },
  basket: {
    type: 'basket', label: 'Fabric basket', w: 0.33, d: 0.33, h: 0.34, defaultFinish: 'fabricDots', finishes: ['fabricDots', ...FABRICS],
    plan: '#b9b5a7', original: true, source: 'Estimated from photo 203123.', confidence: 'medium',
  },
  stools: {
    type: 'stools', label: 'Folding stools', w: 0.36, d: 0.2, h: 0.72, defaultFinish: 'plasticGrey', finishes: ['plasticGrey', 'anthracite', 'steel', 'black', 'white'],
    plan: '#71717a', original: true, source: 'Estimated from photo 203123.', confidence: 'low',
    notes: 'Two folded round stools leaning between the chest of drawers and the coffee table.',
  },
  painting: {
    type: 'painting', label: 'Canvas picture', w: 0.5, d: 0.03, h: 0.38, y: 1.6, defaultFinish: 'canvas', finishes: ['canvas'],
    plan: '#27272a', original: true, source: 'Estimated from photos 203103 / 203133.', confidence: 'medium',
    notes: 'Black-and-white canvas; the motif is an abstract stand-in, not a copy of the real picture.',
  },
  desk: {
    type: 'desk', label: 'Desk', w: 1.2, d: 0.6, h: 0.74, defaultFinish: 'oakGrey', finishes: WOODS, plan: '#bfae94', original: false,
  },
  chair: {
    type: 'chair', label: 'Office chair', w: 0.6, d: 0.6, h: 0.95, defaultFinish: 'fabricCharcoal', finishes: FABRICS, plan: '#52525b', original: false,
  },
  bookshelf: {
    type: 'bookshelf', label: 'Bookshelf', w: 0.8, d: 0.3, h: 1.8, defaultFinish: 'oakArtisan', finishes: WOODS, plan: '#b98d55', original: false,
  },
  armchair: {
    type: 'armchair', label: 'Armchair', w: 0.8, d: 0.82, h: 0.8, defaultFinish: 'fabricGrey', finishes: FABRICS, plan: '#8b8f94', original: false,
  },
  plant: {
    type: 'plant', label: 'Plant', w: 0.45, d: 0.45, h: 1.1, defaultFinish: 'white', finishes: ['white', 'anthracite', 'fabricTerracotta'], plan: '#4d7c0f', original: false,
  },
  rug: {
    type: 'rug', label: 'Rug', w: 1.6, d: 1.1, h: 0.012, flat: true, defaultFinish: 'fabricBeige', finishes: FABRICS, plan: '#d6c7ae', original: false,
  },
}

export const isFlat = (type: FurnitureType) => !!CATALOG[type].flat
