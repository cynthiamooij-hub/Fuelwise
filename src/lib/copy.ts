// Every user-facing explanatory string lives here so the copy rules can be audited in one place.
import type { ActivityLevel, Goal } from './types'
import type { Phase } from './nutrition'

export const TAGLINE = 'Food that works for you'

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; example: string }[] = [
  { value: 'sedentary', label: 'Mostly desk-based', example: 'Office or study days, short walks' },
  { value: 'light', label: 'On my feet some of the day', example: 'Errands, a daily walk, light exercise a few times a week' },
  { value: 'moderate', label: 'Active most days', example: 'Regular workouts or a job that keeps you moving' },
  { value: 'active', label: 'Training hard most days', example: 'Intense sessions five or more days a week' },
]

export const GOAL_OPTIONS: { value: Goal; label: string; line: string }[] = [
  { value: 'fat_loss', label: 'Eat for fat loss', line: 'Plenty of protein and filling foods, with a gentle, sustainable energy level.' },
  { value: 'muscle_gain', label: 'Eat for muscle', line: 'Generous protein and enough energy for your body to build and recover.' },
  { value: 'energy', label: 'Eat for steady energy', line: 'Balanced meals that keep you going evenly through the day.' },
]

export const PHASE_NAME: Record<Phase, string> = {
  menstrual: 'Period',
  follicular: 'Follicular phase',
  ovulatory: 'Around ovulation',
  luteal: 'Luteal phase',
}

/** One normalising sentence shown under the cycle strip. */
export const PHASE_LINE: Record<Phase, string> = {
  menstrual:
    'Energy often dips during your period, and your body is replacing iron — so today’s plate includes iron-rich foods, each paired with vitamin C to help absorb it.',
  follicular: 'Many people feel energy rising in this phase. Your plate today follows your goal with no special emphasis.',
  ovulatory: 'Energy often peaks around now. Your plate today follows your goal with no special emphasis.',
  luteal:
    'Appetite is often higher in the days before your period — that is physiological. Today includes a little extra energy and more filling foods.',
}

export const GOAL_WHY: Record<Goal, string> = {
  fat_loss:
    'Your figure sits a moderate 15% under your estimated daily energy use. Protein stays high because it keeps you full and protects muscle; fat stays at a steady base for hormones; carbohydrate fills the rest so you still have energy to enjoy your day.',
  muscle_gain:
    'Your figure sits 10% above your estimated daily energy use, because building muscle needs a little extra. Protein is set generously to give your muscles the building blocks; fat stays at a steady base; carbohydrate fuels your training.',
  energy:
    'Your figure matches your estimated daily energy use. Protein and fat are set at a steady base, and carbohydrate — your body’s quickest fuel — makes up the rest for even energy across the day.',
}

export const PHASE_WHY: Record<Phase, string> = {
  menstrual:
    'During your period your body replaces the iron it loses. Iron from plants and eggs is absorbed better alongside vitamin C, which is why each iron-rich option comes with something like peppers, broccoli or fruit.',
  follicular: 'In this phase there is no evidence that changing what you eat makes a difference, so the plate simply follows your goal.',
  ovulatory: 'Around ovulation there is no evidence that changing what you eat makes a difference, so the plate simply follows your goal.',
  luteal:
    'Your resting energy use rises by roughly 3–5% in the luteal phase, so we add 5% — never more. Filling, protein-rich foods help a bigger appetite feel satisfied.',
}

export const TRAINING_WHY =
  'On a training day we add 250 kcal so your body has fuel for the session and for recovery afterwards.'

export const ESTIMATE_NOTE =
  'An estimate to guide you, based on the Mifflin-St Jeor equation. Your body and appetite on the day are just as useful a guide.'

export const PLATE_INTRO = [
  'For each meal, choose one food from each row — snacks, pick two. Portions are a guide; go by your appetite.',
  'Make it delicious: herbs, spices, garlic, lemon, chilli or a splash of soy sauce add loads of flavour.',
  'Veggies are the exception to portions — pile on as many as you like.',
]

export const RECIPES_INTRO =
  'Short on inspiration? Here are the proteins on today’s plate — tap one to search the web for recipe ideas. Links open in a new tab, so take whatever is useful and leave the rest.'

export const APPROXIMATE_LINE = 'A starting point rather than a precise match — mix and swap as you like.'

export const DATA_STATEMENT =
  'Your information is stored securely and used only to generate your personal nutrition guidance. It is never shared with anyone or used for any other purpose. Cycle information is health data — you choose whether to share it, the app works fully without it, and you can delete it at any time. You can request deletion of all your data at any time by contacting [CONTACT EMAIL].'

export const PROFILE_CONSENT =
  'I agree to Fuelwise storing my profile — first name, age, height, weight, activity level and goal — to create my personal guidance.'

export const CYCLE_CONSENT =
  'I explicitly consent to Fuelwise storing and processing my cycle information — cycle length, period length and the start date of my last period. I understand this is health data and that I can switch it off and delete it at any time.'
