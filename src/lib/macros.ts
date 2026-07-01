import type { Food } from './types'

export function calcMacros(food: Food, qty: number) {
  const f = food.unit === 'stuk' ? qty : qty / 100
  return {
    kcal: Math.round(food.calories_per_100g * f),
    pro: +(food.protein_per_100g * f).toFixed(1),
    cho: +(food.carbs_per_100g * f).toFixed(1),
    fat: +(food.fat_per_100g * f).toFixed(1),
  }
}
