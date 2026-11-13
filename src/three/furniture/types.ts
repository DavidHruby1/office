import type * as THREE from 'three'
import type { Item } from '../../data/types'

export interface ModelProps {
  item: Item
  /** the item's user-selectable main material (finish + optional tint) */
  primary: THREE.MeshStandardMaterial
}
