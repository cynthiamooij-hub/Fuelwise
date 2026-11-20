export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type Goal = 'fat_loss' | 'muscle_gain' | 'energy'
export type FoodGroup = 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'snack'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any'
export type ContextTag =
  | 'general'
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal'
  | 'training_day'
  | 'returning_user'

export interface Profile {
  user_id: string
  display_name: string
  age: number
  height_cm: number
  weight_kg: number
  activity_level: ActivityLevel
  goal: Goal
  cycle_enabled: boolean
  cycle_length_days: number | null
  period_length_days: number | null
  last_period_start: string | null
  consent_given: boolean
  consent_timestamp: string
  created_at: string
  updated_at: string
}

export interface FoodItem {
  id: string
  name: string
  food_group: FoodGroup
  emoji: string
  portion_description: string
  kcal_per_portion: number
  protein_g: number
  carbs_g: number
  fat_g: number
  iron_rich: boolean
  high_satiety: boolean
  vitamin_c_rich: boolean
  meal_slot: MealSlot
  is_custom: boolean
  owner_id: string | null
}

export interface MotivationalMessage {
  id: string
  message_text: string
  context_tag: ContextTag
}
