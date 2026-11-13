export interface CameraPose {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}

export interface ReferenceView extends CameraPose {
  id: string
  label: string
  photo: string
}

/** Estimated camera viewpoints of the supplied photographs (used for validation and as quick views). */
export const REFERENCE_VIEWS: ReferenceView[] = [
  { id: 'door', label: 'From the door', photo: '20261112_203041', position: [0.14, 1.55, 0.5], target: [5.5, 0.95, 1.35], fov: 62 },
  { id: 'sofa', label: 'Sofa & stove', photo: '20261112_203101', position: [1.4, 1.55, 1.95], target: [2.6, 0.7, 0.2], fov: 60 },
  { id: 'stove', label: 'Stove & picture', photo: '20261112_203103', position: [2.0, 1.25, 1.75], target: [3.7, 1.25, 0.1], fov: 62 },
  { id: 'living', label: 'Along the room', photo: '20261112_203116', position: [0.72, 1.3, 0.8], target: [5.5, 0.8, 1.25], fov: 56 },
  { id: 'tv', label: 'TV & drawers', photo: '20261112_203123', position: [2.75, 1.45, 0.95], target: [3.75, 1.1, 2.3], fov: 68 },
  { id: 'window', label: 'Window wall', photo: '20261112_203113', position: [0.55, 1.12, 1.2], target: [3.6, 0.95, 2.1], fov: 60 },
  { id: 'wardrobe', label: 'Wardrobe', photo: '20261112_203126', position: [2.95, 1.55, 1.55], target: [4.9, 1.0, 0.45], fov: 64 },
  { id: 'bed', label: 'Bed niche', photo: '20261112_203142', position: [3.45, 1.5, 1.15], target: [6.6, 0.85, 0.9], fov: 55 },
  { id: 'frombed', label: 'From the bed', photo: '20261112_203200', position: [6.72, 1.9, 0.85], target: [2.0, 0.7, 1.3], fov: 88 },
  { id: 'kitchen', label: 'Kitchenette', photo: '20261112_203222', position: [3.0, 1.42, 1.75], target: [0.0, 1.0, 1.45], fov: 55 },
]

export const DEFAULT_VIEW: CameraPose = { position: [-2.3, 5.3, 6.7], target: [3.5, 0.5, 1.1], fov: 42 }
export const ISO_VIEW: CameraPose = { position: [9.6, 6.2, 6.4], target: [3.6, 0.4, 1.2], fov: 38 }
export const TOP_VIEW: CameraPose = { position: [3.6, 10.5, 1.3001], target: [3.6, 0, 1.3], fov: 36 }
