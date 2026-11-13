import type { ComponentType } from 'react'
import type { FurnitureType } from '../../data/types'
import { Fan, FloorPlate, Fridge, Microwave, Stove, TV } from './Appliances'
import { Bookshelf, Chair, CoffeeTable, Desk, Dresser, HeatShield, WallCabinets, Wardrobe } from './Casegoods'
import { Kitchen } from './Kitchen'
import { Armchair, Basket, Bed, Painting, Plant, Rug, Sofa, Stools } from './Soft'
import type { ModelProps } from './types'

export const MODELS: Record<FurnitureType, ComponentType<ModelProps>> = {
  kitchen: Kitchen, fridge: Fridge, microwave: Microwave, sofa: Sofa, stove: Stove, floorPlate: FloorPlate,
  heatShield: HeatShield, wardrobe: Wardrobe, bed: Bed, wallCabinets: WallCabinets, dresser: Dresser, tv: TV,
  coffeeTable: CoffeeTable, fan: Fan, basket: Basket, stools: Stools, painting: Painting,
  desk: Desk, chair: Chair, bookshelf: Bookshelf, armchair: Armchair, plant: Plant, rug: Rug,
}
