import * as THREE from 'three'
import {
  dotsTexture, fabricTexture, floorTexture, mottledTexture, noiseBump, paintingTexture, waffleBump, woodTexture,
} from './textures'

/**
 * Shared PBR material library. Materials are created lazily and cached, so every piece of
 * furniture that uses e.g. "oakArtisan" shares one GPU material/texture.
 */

type Factory = () => THREE.MeshStandardMaterial
const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)

const tex = {
  fabric: lazy(() => fabricTexture()),
  fabricBump: lazy(() => noiseBump(11, 0.12)),
  waffle: lazy(() => waffleBump()),
  plaster: lazy(() => noiseBump(9, 0.6, true)),
}

function lazy<T>(f: () => T) {
  let v: T | undefined
  return () => (v ??= f())
}

const wood = (o: Parameters<typeof woodTexture>[0], roughness = 0.62): Factory => () => {
  const map = woodTexture(o)
  // mirrored tiling hides the seams of the non-periodic grain drawing
  map.wrapS = map.wrapT = THREE.MirroredRepeatWrapping
  return std({ map, roughness, metalness: 0 })
}

const fabric = (color: string): Factory => () =>
  std({ color, map: tex.fabric(), bumpMap: tex.fabricBump(), bumpScale: 0.6, roughness: 0.96, metalness: 0 })

export const FINISH_LABELS: Record<string, string> = {
  oakArtisan: 'Artisan oak', oakGrey: 'Grey oak', oakRustic: 'Rustic oak', oakWeathered: 'Weathered oak', plasticGrey: 'Grey lacquer', sonoma: 'Sonoma oak', pine: 'Pine',
  walnut: 'Walnut', white: 'White', cream: 'Cream', black: 'Black', anthracite: 'Anthracite', steel: 'Steel',
  blackSteel: 'Black steel', shieldBrown: 'Brown board', fabricCharcoal: 'Charcoal fabric', fabricGrey: 'Grey fabric',
  fabricBeige: 'Beige fabric', fabricBlue: 'Blue fabric', fabricGreen: 'Green fabric',
  fabricTerracotta: 'Terracotta fabric', fabricDots: 'Polka-dot fabric', sofaThrow: 'Charcoal waffle throw', plateGrey: 'Sheet steel', canvas: 'Canvas print',
}

/** Representative colour of each finish (UI swatches). */
export const FINISH_SWATCH: Record<string, string> = {
  oakArtisan: '#c79a62', oakGrey: '#b3a48e', oakRustic: '#7d6c58', oakWeathered: '#a39483', plasticGrey: '#7d8083', sonoma: '#cbb38e', pine: '#dcae6c',
  walnut: '#6b4a32', white: '#f1f1ee', cream: '#e6dfc6', black: '#1c1c1e', anthracite: '#3b3e42', steel: '#b4b8bc',
  blackSteel: '#232325', shieldBrown: '#5d483c', fabricCharcoal: '#4a5056', fabricGrey: '#8b8f94',
  fabricBeige: '#cdbfa6', fabricBlue: '#2f62b3', fabricGreen: '#55705a', fabricTerracotta: '#b5694a',
  fabricDots: '#a9a696', sofaThrow: '#565c62', plateGrey: '#8e9499', canvas: '#2a2a2c',
}

const FACTORIES: Record<string, Factory> = {
  // woods
  oakArtisan: wood({ base: '#c4ab8a', dark: '#8a6c4e', light: '#d9c5a8', contrast: 0.55, knots: 5, cracks: 9, seed: 11 }),
  oakGrey: wood({ base: '#c4b6a3', dark: '#7a6b5a', light: '#ddd2c3', contrast: 0.7, knots: 2, cracks: 12, seed: 23 }, 0.7),
  oakRustic: wood({ base: '#7a6855', dark: '#463829', light: '#9d8c75', contrast: 0.85, knots: 4, cracks: 7, seed: 31 }, 0.66),
  sonoma: wood({ base: '#c2ad90', dark: '#8a7558', light: '#d9c9b0', contrast: 0.55, knots: 1, cracks: 6, seed: 47 }, 0.68),
  oakWeathered: wood({ base: '#a39483', dark: '#5f5244', light: '#c2b5a4', contrast: 0.9, knots: 2, cracks: 10, seed: 37 }, 0.72),
  pine: wood({ base: '#dcb478', dark: '#b08040', light: '#efd3a2', contrast: 0.45, knots: 3, seed: 53 }, 0.55),
  walnut: wood({ base: '#6d4b33', dark: '#3a2516', light: '#93694a', contrast: 0.7, knots: 2, seed: 61 }, 0.55),
  // paints / lacquers
  white: () => std({ color: '#f3f3f0', roughness: 0.38 }),
  cream: () => std({ color: '#e7e0c8', roughness: 0.45 }),
  black: () => std({ color: '#1b1b1d', roughness: 0.55 }),
  blackGloss: () => std({ color: '#060607', roughness: 0.08, metalness: 0.2 }),
  anthracite: () => std({ color: '#41454a', roughness: 0.6 }),
  shieldBrown: () => std({ color: '#5a463b', roughness: 0.62 }),
  // metals
  steel: () => std({ color: '#c2c6ca', roughness: 0.32, metalness: 1 }),
  steelBrushed: () => std({ color: '#b9bcbf', roughness: 0.45, metalness: 1 }),
  plateGrey: () => std({ color: '#8e9499', roughness: 0.7, metalness: 0.5 }),
  blackSteel: () => std({ color: '#222224', roughness: 0.62, metalness: 0.55 }),
  // textiles
  fabricCharcoal: fabric('#50565c'),
  fabricGrey: fabric('#8f9398'),
  fabricBeige: fabric('#d0c2a9'),
  fabricBlue: fabric('#2c63bd'),
  fabricGreen: fabric('#5a755e'),
  fabricTerracotta: fabric('#b96c4c'),
  fabricDots: () => std({ map: dotsTexture(), roughness: 0.95 }),
  sofaThrow: () => std({ color: '#5b5f64', map: tex.fabric(), bumpMap: tex.waffle(), bumpScale: 2.2, roughness: 0.97 }),
  pillow: () => std({ color: '#cfc5c6', map: tex.fabric(), bumpMap: tex.fabricBump(), bumpScale: 0.4, roughness: 0.95 }),
  sheetOrange: () => std({ color: '#d98a2b', map: tex.fabric(), roughness: 0.95 }),
  blanketBlue: () => std({ color: '#2a5fb5', bumpMap: tex.plaster(), bumpScale: 1.4, roughness: 1 }),
  duvetWhite: () => std({ color: '#ecebe6', map: tex.fabric(), roughness: 0.95 }),
  curtainGrey: () => std({ color: '#8c9095', roughness: 0.92, side: THREE.DoubleSide }),
  sheer: () => std({ color: '#f5f5f2', roughness: 0.9, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
  // architecture
  floor: () => std({ map: floorTexture(), roughness: 0.42, metalness: 0 }),
  wallWhite: () => std({ color: '#f0efec', roughness: 0.94, bumpMap: tex.plaster(), bumpScale: 0.25, shadowSide: THREE.DoubleSide }),
  wallWarm: () => std({ color: '#e7e4dd', roughness: 0.94, bumpMap: tex.plaster(), bumpScale: 0.5, shadowSide: THREE.DoubleSide }),
  ceiling: () => std({ color: '#f3f2ef', roughness: 0.96, shadowSide: THREE.DoubleSide }),
  hall: () => std({ color: '#f0deb4', roughness: 0.95 }),
  baseboard: wood({ base: '#c4914f', dark: '#8a5a26', light: '#deb47a', contrast: 0.4, seed: 71 }, 0.5),
  windowFrame: wood({ base: '#5a3a26', dark: '#2e1c11', light: '#7a5438', contrast: 0.6, seed: 73 }, 0.5),
  concrete: () => std({ map: mottledTexture('#b1b1ae', ['#bfbfbc', '#a2a3a1', '#b8b7b3'], 5, 1.1), roughness: 0.8 }),
  stoneTile: () => std({ map: mottledTexture('#5d554c', ['#84766a', '#3a342e', '#8f7f6b', '#4a433b'], 8, 0.5), roughness: 0.75 }),
  glass: () => std({ color: '#cfe0e6', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16 }),
  glassFrosted: () => std({ color: '#f1efe6', roughness: 0.6, transparent: true, opacity: 0.85, emissive: '#fff3d6', emissiveIntensity: 0.05 }),
  glassSmoke: () => std({ color: '#8a6f63', roughness: 0.2, transparent: true, opacity: 0.75 }),
  stoveGlass: () => std({ color: '#17120f', roughness: 0.12, metalness: 0.3 }),
  sinkSteel: () => std({ color: '#cfd2d4', roughness: 0.34, metalness: 0.35 }),
  canvas: () => std({ map: paintingTexture(), roughness: 0.9 }),
  canvasEdge: () => std({ color: '#e9e7e1', roughness: 0.95 }),
  copperEdge: () => std({ color: '#b98a58', roughness: 0.5 }),
  rubberBlack: () => std({ color: '#141414', roughness: 0.9 }),
  plasticWhite: () => std({ color: '#f1f1ee', roughness: 0.5 }),
  plasticGrey: () => std({ color: '#7d8083', roughness: 0.55 }),
  screen: () => std({ color: '#050506', roughness: 0.12, metalness: 0.4 }),
  leaf: () => std({ color: '#3f6b2f', roughness: 0.7, side: THREE.DoubleSide }),
  soil: () => std({ color: '#3a2c22', roughness: 1 }),
  ceramic: () => std({ color: '#b98f7c', roughness: 0.35 }),
  red: () => std({ color: '#d43a4c', roughness: 0.8 }),
}

const cache = new Map<string, THREE.MeshStandardMaterial>()

/**
 * Get a material by finish key. With `color`, a tinted variant is created (textures are kept, so
 * the colour acts as a stain/tint).
 */
export function mat(key: string, color?: string): THREE.MeshStandardMaterial {
  const id = color ? `${key}|${color}` : key
  let m = cache.get(id)
  if (!m) {
    if (color) {
      m = mat(key).clone()
      // woods keep their grain: tint multiplies the texture; plain paints simply take the colour
      m.color = new THREE.Color(color)
    } else {
      m = (Object.hasOwn(FACTORIES, key) ? FACTORIES[key] : FACTORIES.white)()
    }
    m.name = id
    cache.set(id, m)
  }
  return m
}

export function disposeMaterials() {
  cache.forEach((m) => {
    for (const k of ['map', 'bumpMap', 'roughnessMap'] as const) m[k]?.dispose()
    m.dispose()
  })
  cache.clear()
}
