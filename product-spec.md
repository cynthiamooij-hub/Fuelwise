# Product Spec — Fuelwise

**Version:** 1.1
**Date:** 20 November 2026
**Author:** Cynthia Mooij
**Status:** Confirmed

---

## Section 1 — Tool Summary

**Tool name:** Fuelwise

**What it does:** Fuelwise gives a woman a personalised daily calorie and macro estimate based on her goal, translates that estimate into concrete food portions drawn from a curated Dutch food bank, and optionally layers cycle-aware guidance on top — iron emphasis around menstruation, appetite anticipation in the luteal phase. It does not log, track, or score anything.

**Who uses it:** Adult women who want practical, non-judgemental guidance on what to eat for a specific goal (fat loss, muscle gain, or sustained energy). The first build is for a single invited tester; the architecture supports adding more invited users without a rebuild.

**Why it exists:** Existing tools in this space split into two camps: calorie trackers that turn eating into daily surveillance, and cycle apps built around fertility and period tracking where nutrition is an afterthought. Neither tells a woman what to actually put on her plate tonight. Fuelwise is nutrition-first, reference-not-tracker, and treats the menstrual cycle as useful context rather than a set of rules.

**Build status:** First build — no prior version.

---

## Section 2 — Classification

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** The user enters her profile and cycle information once and returns to a personalised dashboard on later visits, so that data must survive the session.

**D3 is triggered if any of the following are true — check all that apply:**
- [x] Data must be retrievable after the session ends
- [ ] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [ ] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A2

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | No |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | Yes |
| A3 — Authorization | Users must log in and have different roles. | No |

**Reason:** Every user has the same capabilities and sees only her own data; there are no roles, no admin view, and no user who can see another user's information.

> **Promotion rule applied:** A2 requires user accounts, user accounts require a database, therefore D3. This is final and was not reopened in Section 5.

---

### If Access Model is A2 — complete both questions

**Auth reason:** Identity and continuity — the user saves her profile and returns to it across sessions.

**Signup model:** Invite-only — the builder invites specific users through the Supabase dashboard. There is no public registration route in this build.

---

### Tier

**Tier:** 3

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 3 | D3+A2 | Netlify + Supabase (auth + RLS) | Netlify |

Plain language: login plus per-user data isolation. Every row in every table is locked to its owner, so no user can ever read another user's profile or cycle data.

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool.

---

## Section 3 — Arms

### AI API Arm

**Active:** No

Food suggestions come from a curated food bank built and vetted by the builder, not generated at runtime. Deferred to Section 12.

---

### Export Arm

**Active:** No

---

### Email Arm

**Active:** No

> Note: the magic-link login email is sent by Supabase Auth as part of authentication. It is not the Email arm and requires no Resend account and no API key.

---

### Scheduled Automation Arm

**Active:** No

Motivational messages are rendered on the dashboard when the user opens the app, not pushed on a schedule. Push notifications are deferred to Section 12.

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind |
| Deployment target | Netlify |
| Netlify MCP | Active — Netlify is connected via Claude Desktop Connectors. Claude Code will create the site, set environment variables, and deploy automatically. |

**GitHub — pre-build requirement:**
The builder creates the GitHub repo before the first Claude Code session. `product-spec.md`, `CLAUDE.md`, and `PROGRESS.md` must be uploaded to the repo root before Claude Code opens. Claude Code assumes the repo exists, commits regularly, and pushes to main. It does not create or configure the repo.

---

### Supabase project

**Supabase project status:** New — Claude Code will create it at the start of the build session.

**Supabase plan:** Free — pauses after roughly one week of no traffic. Accepted by the builder: the tester uses the app daily during the test period. If the tool goes quiet and then needs to be shown to someone, restore it manually in the Supabase dashboard first.

**If new:**

| Detail | Answer |
|--------|--------|
| Proposed project name | `fuelwise` |
| Confirmed project name | `fuelwise` — confirmed by the builder. Fuelwise is a standalone personal venture, entirely separate from Mooij Sustainability Consulting, so the project is named after the venture rather than a client context. |

> Claude Code pauses at the start of the session, confirms the project name, and creates the Supabase project via MCP before building anything. The project ID is recorded in `docs/supabase-setup.md` once created.

**supabase-setup.md:** Created by Claude Code at the end of the first build session and updated whenever Claude Code touches the database. Lives permanently in `docs/` and records the project name, project ID, all tables and fields, RLS policies, and auth configuration.

---

## Section 5 — Data Architecture

**What data is collected or stored in this tool:**

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| user_id | Linked user account | UUID (FK to auth.users) | Automatic | Yes |
| display_name | First name | Text | User (onboarding) | Yes |
| age | Age in years | Integer | User (onboarding) | Yes |
| height_cm | Height in cm | Integer | User (onboarding) | Yes |
| weight_kg | Weight in kg | Numeric | User (onboarding, editable) | Yes |
| activity_level | Daily activity level | Text (enum: sedentary, light, moderate, active) | User (onboarding) | Yes |
| goal | Primary goal | Text (enum: fat_loss, muscle_gain, energy) | User (onboarding) | Yes |
| cycle_enabled | Cycle guidance on or off | Boolean | User (onboarding, editable in settings) | Yes — defaults to false |
| cycle_length_days | Typical cycle length | Integer | User — only if cycle_enabled | No |
| period_length_days | Typical period length | Integer | User — only if cycle_enabled | No |
| last_period_start | Start date of most recent period | Date | User — only if cycle_enabled | No |
| consent_given | GDPR consent checkbox ticked | Boolean | User (onboarding) | Yes |
| consent_timestamp | When consent was given | Timestamp | Automatic | Yes |
| created_at | Profile created | Timestamp | Automatic | Yes |
| updated_at | Profile last updated | Timestamp | Automatic | Yes |

**Food bank fields:**

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| id | Item ID | UUID | Automatic | Yes |
| name | Food name | Text | Builder (seed) or user (custom) | Yes |
| food_group | Group | Text (enum: protein, carb, fat, vegetable, fruit, snack) | Builder or user | Yes |
| emoji | Display emoji | Text | Builder or user | Yes |
| portion_description | Portion in plain language | Text — e.g. "1 fillet (±150g)", "a handful" | Builder or user | Yes |
| kcal_per_portion | Calories per portion | Integer | Builder or user | Yes |
| protein_g | Protein per portion | Numeric | Builder or user | Yes |
| carbs_g | Carbs per portion | Numeric | Builder or user | Yes |
| fat_g | Fat per portion | Numeric | Builder or user | Yes |
| iron_rich | Notably iron-rich | Boolean | Builder or user | Yes — defaults false |
| high_satiety | Notably filling | Boolean | Builder or user | Yes — defaults false |
| vitamin_c_rich | Notably vitamin C-rich | Boolean | Builder or user | Yes — defaults false |
| meal_slot | Suited to | Text (enum: breakfast, lunch, dinner, snack, any) | Builder or user | Yes |
| is_custom | Added by a user | Boolean | Automatic | Yes |
| owner_id | Who added it | UUID, null for seed items | Automatic | No |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| profiles | One row per user — her profile, goal and cycle settings | user_id, display_name, age, height_cm, weight_kg, activity_level, goal, cycle_enabled, cycle_length_days, period_length_days, last_period_start, consent_given |
| food_items | The curated food bank plus any user-added items | id, name, food_group, emoji, portion_description, kcal_per_portion, protein_g, carbs_g, fat_g, iron_rich, high_satiety, vitamin_c_rich, meal_slot, is_custom, owner_id |
| motivational_messages | The message library, tagged by context | id, message_text, context_tag (general, menstrual, follicular, ovulatory, luteal, training_day, returning_user) |

**Seed data requirement:** Claude Code seeds `food_items` by importing `food-bank-seed.csv` from the repo root. The file contains 71 vetted items — Dutch supermarket staples, named in English — with emoji, plain-language portions, macros, and the iron_rich / high_satiety / vitamin_c_rich flags. Its columns map directly onto the `food_items` schema above; `is_custom` is false and `owner_id` is null for every seeded row. **Do not generate food items or nutritional values.** If the CSV is missing, stop and ask the builder for it rather than inventing substitutes.

`motivational_messages` is seeded with roughly 30 messages written by Claude Code to the copy rules in Section 10.

**File storage:** No

**Derived or calculated data:** Yes — daily calorie target, macro split, and current cycle phase are calculated at runtime from profile fields. Nothing calculated is written to the database. See Section 9.

---

## Section 6 — Access and Permissions

**Auth configuration:**

| Detail | Answer |
|--------|--------|
| Authentication method | Magic link — the user clicks a link in her email and is signed in. Derived recommendation for an invite-only tool with a small, known user group; nobody forgets a password they never had. Confirmed by the builder. |
| Signup model | Invite-only — the builder invites specific users via the Supabase dashboard. Public registration must be disabled in Supabase Auth settings. |

> **Privacy note:** User accounts store email addresses. Because this tool also collects health-related personal data through its own onboarding form, Section 7 applies in full and the standing internal-tool exemption does not cover it.

**RLS rules — who can read and write what:**

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|----------|----------|------------|------------|------------|
| profiles | Unauthenticated (anon) | No | No | No | No |
| profiles | Authenticated user | Own row only | Yes — own row only | Own row only | Own row only |
| food_items | Unauthenticated (anon) | No | No | No | No |
| food_items | Authenticated user | Seed items (owner_id is null) plus own custom items | Yes — own custom items only | Own custom items only | Own custom items only |
| motivational_messages | Unauthenticated (anon) | No | No | No | No |
| motivational_messages | Authenticated user | All rows | No | No | No |

> RLS must be enabled on every table. No table may be left with RLS off. Claude Code builds all policies via Supabase MCP during the build session.

---

## Section 7 — GDPR

**GDPR outcome:** Applies — personal data is collected through the tool's onboarding form.

**Personal data collected:** First name, email address (via Supabase Auth), age, height, weight, activity level, goal, and — when the cycle layer is enabled — typical cycle length, typical period length, and the start date of the most recent period.

> **Special category warning — read before launch.** Menstrual cycle data is health data and therefore a special category of personal data under GDPR Article 9. Processing it requires an Article 9 condition in addition to an ordinary lawful basis; for a tool like this that condition is explicit consent (Art. 9(2)(a)). "Explicit consent" is a higher bar than ordinary consent: it must be a clear, affirmative, specific statement, separate from any other terms, and freely given. Weight data collected alongside it should be treated with the same care.

**Consent checkpoint on the form:** Yes. Two separate, unticked checkboxes appear in onboarding before the profile can be saved:
1. Consent to storing profile data (name, age, height, weight, goal, activity level).
2. Separate explicit consent to storing cycle data — shown only when the user switches the cycle layer on, and worded as explicit consent to processing health data.

Neither checkbox may be pre-ticked, and the form must not submit without the first one. The second is required only when `cycle_enabled` is true. Switching the cycle layer off later must delete the stored cycle fields, not merely hide them.

**Data statement text shown to users at the point of collection:**

> **PLACEHOLDER — the builder must replace this before any real user enters data.**
>
> *Draft for review:* "Your information is stored securely and used only to generate your personal nutrition guidance. It is never shared with anyone or used for any other purpose. Cycle information is health data — you choose whether to share it, the app works fully without it, and you can delete it at any time. You can request deletion of all your data at any time by contacting [CONTACT EMAIL]."

**Deletion mechanism:** Two routes, both required in this build:
1. Self-service — a "Delete my account and all my data" action in Settings, with a confirmation step, which removes the user's row from `profiles`, her custom `food_items`, and her Supabase Auth record.
2. On request — the user emails the contact address in the data statement; the builder processes the deletion manually. **Contact address: PENDING — builder to supply.**

> **Build gate:** Claude Code builds the consent checkboxes, the data statement component, and the deletion flow using the placeholder text above. The build is not blocked, but the tool must not be given to a real tester until the final statement wording and the deletion contact address are in place. This is recorded in Section 15 as a blocking open question for launch.

---

## Section 8 — Screen and UI Structure

### Login

- **Purpose:** Get an invited user into her account with minimum friction.
- **What is visible:** Fuelwise wordmark, one-line tagline, a single email field, a "Send me a link" button, and a short line explaining that a sign-in link will arrive by email. No registration link, no password field.
- **User actions:** Enter email, request link, click the link in the email.
- **What happens next:** First-time users land on Onboarding. Returning users land on the Dashboard.

### Onboarding

- **Purpose:** Collect the minimum needed to generate accurate guidance, in a way that feels like a conversation rather than a medical intake form.
- **What is visible:** Four short steps, one screen each, with a progress indicator:
  1. *About you* — first name, age, height, weight.
  2. *Your days* — activity level, as four plain-language options with examples ("Mostly desk-based", "On my feet some of the day", "Active most days", "Training hard most days"). No jargon, no multipliers shown.
  3. *Your goal* — three cards: eat for fat loss, eat for muscle, eat for steady energy. Each card says in one line what the app will emphasise.
  4. *Cycle guidance* — explained before it is offered: what the app will and will not do with this information, that the app is complete without it, and that it can be switched off at any time. A single toggle, defaulting to off. If switched on: typical cycle length, typical period length, start date of most recent period, and the separate explicit-consent checkbox from Section 7.
- **User actions:** Fill in each step, move forward or back, tick the consent checkboxes, save.
- **What happens next:** Profile is written to `profiles`; the user lands on the Dashboard.

### Dashboard

- **Purpose:** Answer "what should I eat today?" in the first screenful, warmly.
- **What is visible, in order:**
  1. A greeting using her first name, plus a motivational message drawn from `motivational_messages` matched to her current context. The greeting assumes a good day and never references absence negatively.
  2. *Cycle strip* — only when `cycle_enabled` is true. A horizontal graph across the top of the cycle, with the current day marked and the phase named in plain language. Directly beneath it, one short normalising sentence about what is typical in this phase and what the app is therefore suggesting. When `cycle_enabled` is false this element is absent entirely and the layout closes up — no empty slot, no prompt to turn it on.
  3. *Today's fuel* — the calorie estimate and the three macro figures, presented as a guide rather than a target. No progress bar, no remaining-calories figure, no ring to close.
  4. *Training day toggle* — a single switch, "Training today?". Flipping it recalculates the figures above immediately and reveals a pre/post-training suggestion. Resets to off each day; never stored.
  5. *Today's plate* — suggested options for breakfast, lunch, dinner and snacks, drawn from the food bank and matched to her macros, goal and phase. Always presented as two or three alternatives per meal, each with its emoji and plain-language portion. A refresh control swaps the suggestions for different ones.
  6. *Why this* — a short expandable explanation of the reasoning behind today's emphasis, written to teach rather than instruct.
- **User actions:** Toggle training day, refresh suggestions, expand the explanation, navigate to Food bank or Settings.
- **What happens next:** Nothing is saved. The dashboard is a reference view and recalculates on every load.

### Food bank

- **Purpose:** Let her browse what is available and extend it.
- **What is visible:** Items grouped by food group, each group headed by its emoji. Each item shows name, emoji, portion description and macros. Iron-rich and filling items carry a small labelled marker. A search field and an "Add your own" button.
- **User actions:** Browse, search, add a custom item (name, group, emoji, portion, macros), edit or delete her own custom items. Seed items are read-only.
- **What happens next:** Custom items are written to `food_items` with her `owner_id` and appear in her dashboard suggestions from then on.

### Settings

- **Purpose:** Let her change anything she entered, and leave cleanly.
- **What is visible:** Editable profile fields, the cycle layer toggle with its cycle fields, a link to the data statement, and the delete-account action.
- **User actions:** Edit and save profile, switch the cycle layer on or off, delete account and all data (with a confirmation step), sign out.
- **What happens next:** Switching the cycle layer off deletes `cycle_length_days`, `period_length_days` and `last_period_start` from her row and removes the cycle strip from the dashboard. Deleting the account removes her profile row, her custom food items, and her auth record, then returns her to Login.

---

## Section 9 — Logic and Calculations

**What is calculated:** A daily calorie estimate, a macro split, the current cycle phase, and the resulting food suggestions. All calculated at runtime; none of it is stored.

**Inputs:** age, height_cm, weight_kg, activity_level, goal, training-day toggle state, and — when enabled — cycle_length_days, period_length_days, last_period_start, plus today's date.

### Formula

**Step 1 — BMR, Mifflin-St Jeor (female equation):**
`BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161`

**Step 2 — activity multiplier:**

| activity_level | Multiplier |
|---|---|
| sedentary | 1.2 |
| light | 1.375 |
| moderate | 1.55 |
| active | 1.725 |

`TDEE = BMR × multiplier`

**Step 3 — goal adjustment:**

| goal | Adjustment |
|---|---|
| fat_loss | TDEE × 0.85 (a 15% deficit — deliberately moderate) |
| muscle_gain | TDEE × 1.10 |
| energy | TDEE × 1.0 |

**Step 4 — training-day adjustment:** if the training toggle is on, add 250 kcal and surface a pre/post-training suggestion (a banana or oats before, a protein-plus-carb option after).

**Step 5 — cycle adjustment (only when cycle_enabled):** in the luteal phase, add 5% to the calorie figure. This is a deliberate cap. Published evidence puts the luteal rise in resting metabolic rate at roughly 3–5%, or about 30–120 kcal/day, small enough to overlap with normal day-to-day variation. No other phase adjusts calories. Do not exceed 5% under any configuration.

**Step 6 — safety floor, applied last and unconditionally:**
- The final calorie figure must never fall below **1,500 kcal/day**, regardless of what Steps 1–5 produce.
- If the floor binds, the app displays the floor value with no warning, no error, and no explanation of what was overridden.
- Protein grams are **never** reduced to make a deficit fit. If the macro split cannot be satisfied within the calorie figure, carbohydrate is reduced first, then fat down to its own minimum, and the calorie figure rises if necessary rather than protein falling.

**Step 7 — macro split:**

| goal | Protein | Fat | Carbs |
|---|---|---|---|
| fat_loss | 1.6 g per kg bodyweight | 0.8 g per kg bodyweight (minimum) | Remaining calories |
| muscle_gain | 1.8 g per kg bodyweight | 0.9 g per kg bodyweight (minimum) | Remaining calories |
| energy | 1.4 g per kg bodyweight | 0.9 g per kg bodyweight (minimum) | Remaining calories |

Protein and fat are calculated first and are floors, not ceilings. Carbohydrate takes the remainder.

**Step 8 — cycle phase determination (only when cycle_enabled):**
`day_in_cycle = (days since last_period_start mod cycle_length_days) + 1`

| Phase | Days | Guidance emphasis |
|---|---|---|
| Menstrual | 1 to period_length_days | Emphasise iron-rich items (`iron_rich = true`), each paired in the same meal with an item flagged `vitamin_c_rich = true` to aid non-haem iron absorption. Normalising message about lower energy. |
| Follicular | period_length_days + 1 to (cycle_length − 14) | No special emphasis. Standard suggestions for her goal. |
| Ovulatory | The 3 days around (cycle_length − 14) | No special emphasis. |
| Luteal | Final 14 days | +5% calories. Emphasise high-satiety items (`high_satiety = true`) and protein-rich snacks. Normalising message about increased appetite. |

**Step 9 — food suggestion matching:** for each meal slot, select two or three items whose `meal_slot` matches, filtered by the active phase emphasis where one applies, and whose combined macros move the day toward the calculated split. Suggestions are always plural and always framed as options.

### Output

A calorie figure, three macro figures in grams, a named cycle phase with a normalising sentence, and two to three concrete food options per meal slot with emoji and plain-language portions.

### Edge cases

| Case | Behaviour |
|---|---|
| Calculated calories below 1,500 | Display 1,500. No warning shown. |
| Age under 18 | Block onboarding. This tool is designed for adults; the equations and the 1,500 floor are not appropriate for adolescents. Show a plain message and do not create a profile. |
| Age over 65 | Allowed. Mifflin-St Jeor remains valid; no special handling. |
| Weight or height outside plausible range (weight < 35kg or > 250kg; height < 120cm or > 220cm) | Inline validation, ask her to check the value. Do not calculate. |
| cycle_enabled true but last_period_start missing or more than 60 days ago | Hide the cycle strip, show a quiet "Update your cycle dates" prompt in its place. Do not guess a phase, do not apply the luteal adjustment. |
| cycle_length_days outside 21–40 | Accept the value but do not apply phase logic — show the strip as informational only with no calorie adjustment. Cycles outside this range do not map reliably onto the four-phase model. |
| Food bank cannot fill a meal slot within the macro split | Show the best available options and a short neutral line that this is a starting point, not a precise match. Never show an empty meal slot. |
| Profile incomplete | Route to Onboarding rather than rendering a partial dashboard. |

> **Standing rule for the build:** this tool produces guidance, not prescription. It must never display a deficit countdown, a remaining-calories figure, a weight trend, a streak, a compliance score, or any red/warning styling tied to eating. See Section 10.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** No brand skill file. Fuelwise is a standalone venture with no connection to Mooij Sustainability Consulting; no Mooij branding, colours or naming may appear anywhere in the tool.

**Direction: "Warm kitchen"** — feminine through warmth rather than pink, reading as food and cooking rather than fitness tracking.

| Token | Value |
|---|---|
| Primary | Terracotta `#D85A30` |
| Primary dark (text on light fills) | `#993C1D` |
| Light fill / background tint | `#FAECE7` |
| Deep text | `#4A1B0C` |
| Accent | Deep olive `#3B6D11` |
| Surface | Warm off-white `#FDFAF8` |

**Typography:** A characterful serif for headings (Fraunces or Bricolage Grotesque) against a clean sans for body copy and all numbers (Inter or Outfit). Calorie and macro figures always render in the sans. The serif is what keeps this from reading as a generic macro tracker.

**Logo:** Not available. Wordmark set in the heading serif, medium weight, tight letter-spacing.

**Icons and emoji — deliberate split:**
- **Food emoji** are used in the food bank and in meal suggestions, one per item. This is the playfulness.
- **A proper icon library** (Lucide or Phosphor) handles all UI chrome: navigation, settings, the training toggle, the cycle strip. Emoji render inconsistently across devices and must not be used for interface controls.

**Visual feel:** Warm and conversational. Generous whitespace, rounded corners, no clinical greys, no charts beyond the cycle strip.

### Copy and interaction rules — binding on every string in the app

These are not stylistic suggestions. Claude Code must apply them to every piece of text it writes.

1. **No moralised food language.** Never "good" or "bad" foods, "cheat", "guilty", "guilt-free", "clean", "earned", "burn off", "treat" used as transgression. Food is food.
2. **No streaks, scores, or compliance mechanics.** No daily streak, no consistency score, no badge for logging in, no "you missed a day". Nothing in the app may break.
3. **No deficit or remaining-calorie framing.** Show what to eat, never what is left or what is owed.
4. **Lead with adequacy, not restriction.** Every suggestion is phrased as what to include. No "avoid", "limit", "cut out".
5. **Always offer options, not instructions.** "Tonight: salmon, chicken thighs, or a lentil curry" — never a single mandated meal. Autonomy is the point.
6. **Explain the reasoning.** Each emphasis carries a one-line why. She should finish a session knowing something, not just having been told something.
7. **Normalise, don't correct.** The luteal message is the clearest example: appetite is higher this week, that is physiological, here is what satisfies it. Never imply a lack of willpower.
8. **Assume a good day.** The dashboard greets; it does not audit. After an absence: "Good to see you" — never "You've been away 6 days."
9. **No red, no warnings, no error styling** anywhere in the eating flow. Red is reserved for destructive account actions only.
10. **Never display or request a goal weight.** There is no target weight field anywhere in this build.

**Accessibility baseline:** WCAG 2.2 AA contrast on all terracotta-on-light combinations (verify `#D85A30` on `#FAECE7` and darken to `#993C1D` for body text where it fails), minimum 44×44px tap targets, fully usable one-handed on a phone, readable at 200% zoom, every control reachable by keyboard and labelled for screen readers.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database, Auth (magic link), RLS | Anon key (public, browser-safe) + Service role key (server-side only) | Netlify environment variables |

No AI provider. No Resend account. No third-party services beyond Supabase.

> **Security rule — no exceptions:** No API key, token, password, or credential may appear in any HTML file, any JavaScript file, or any file committed to GitHub. The Supabase service role key must never reach the browser bundle.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase anon key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |
| Supabase service role key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |

No pre-build credential tasks. Claude Code creates the Supabase project and both keys during the build session.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Push notifications | Requires PWA installation, and on iOS the user must add the app to her home screen before notifications work at all. Disproportionate plumbing for a single tester. Motivational messages render on the dashboard instead. |
| AI-generated food suggestions | The curated food bank is cheaper, fully controllable, and every suggestion is one the builder can stand behind. Revisit only if the fixed library proves too limiting in testing. |
| Weight logging and trend history | Deliberately excluded. Logging is what turns a nutrition tool into a tracking tool, and trend charts are the mechanic most associated with disordered-eating risk. This is a design decision, not a scoping compromise. |
| PIN login | Hand-rolled auth on a tool storing special-category health data. Magic link via Supabase Auth gives proper session handling and row-level security for the same effort. |
| Open self-registration | Invite-only for the test. Opening signup changes the GDPR posture and needs a published privacy policy first. |
| Streaks, scores, badges, gamification | Excluded by the copy rules in Section 10. Not a future feature — an explicit non-goal. |
| Multi-user rollout beyond invited testers | Architecture supports it; the test does not need it. |
| Recipe content and meal plans | Out of scope. The tool suggests foods and portions, not recipes. |
| Hormonal contraception, PCOS and perimenopause handling | The cycle model assumes a natural cycle. Users on hormonal contraception or with irregular cycles should switch the cycle layer off and use the tool as a pure nutrition app, which it fully supports. Tailored handling is a future build. |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Magic link login | An invited user receives a sign-in email, clicks it, and lands in the app. A non-invited email receives nothing and cannot create an account. | [ ] |
| 2 | Onboarding completes and persists | All four steps save; a row appears in `profiles` with correct values; returning to the app loads the saved profile. | [ ] |
| 3 | Calorie calculation is correct | Hand-check Mifflin-St Jeor against a worked example for each goal and each activity level. Figures match Section 9 exactly. | [ ] |
| 4 | Safety floor holds | Construct an input combination that would calculate below 1,500 kcal (low weight, short, older, sedentary, fat_loss). App displays 1,500. No warning shown. | [ ] |
| 5 | Protein is never cut | In the same low-calorie scenario, protein grams still meet the g/kg figure in Section 9. | [ ] |
| 6 | Cycle layer off is a complete experience | With `cycle_enabled = false`, the dashboard renders with no cycle strip, no empty slot, no prompt to enable it, and full meal suggestions. | [ ] |
| 7 | Cycle phase is correct | For a known `last_period_start` and cycle length, the displayed phase and day number are correct on each of four test dates, one per phase. | [ ] |
| 8 | Luteal adjustment is capped | The luteal calorie figure is exactly 5% above the non-luteal figure, never more. | [ ] |
| 9 | Training toggle recalculates | Flipping it adds 250 kcal immediately, reveals the training suggestion, and stores nothing. It is off again on next load. | [ ] |
| 10 | Food bank renders and extends | Seed items display grouped with emoji and portions. A user can add, edit and delete her own item; it appears in suggestions. She cannot edit a seed item. | [ ] |
| 10b | Seed data imported, not generated | `food_items` contains exactly 71 seed rows and the values match `food-bank-seed.csv` row for row. No invented items. | [ ] |
| 10c | Iron and vitamin C pairing | During the menstrual phase, every meal suggestion containing an `iron_rich` item also contains a `vitamin_c_rich` item. | [ ] |
| 11 | RLS isolation | Create a second test user. Confirm by direct query that neither user can read the other's profile row or custom food items. | [ ] |
| 12 | Consent gates the form | Onboarding cannot be submitted with the profile consent box unticked. The cycle consent box appears only when the cycle toggle is on, and gates saving cycle fields. | [ ] |
| 13 | Cycle data is genuinely deleted | Switching the cycle layer off in Settings removes the three cycle fields from the database row — verify by query, not by UI. | [ ] |
| 14 | Account deletion is complete | The delete action removes the profile row, the user's custom food items, and the auth record. Verify all three by query. | [ ] |
| 15 | Age gate | An age under 18 blocks onboarding and creates no profile row. | [ ] |
| 16 | Copy rules audit | Read every string in the app against the ten rules in Section 10. Zero violations. Specifically grep for: good, bad, cheat, guilt, clean, earned, burn, remaining, left, streak, goal weight, target weight. | [ ] |
| 17 | No forbidden UI elements | Confirm absence of: progress bar toward a calorie target, remaining-calories figure, streak counter, weight trend chart, goal weight field, red styling in the eating flow. | [ ] |
| 18 | Accessibility | Contrast passes WCAG AA on all text; tap targets ≥ 44px; usable one-handed; readable at 200% zoom. | [ ] |
| 19 | Deploys and loads | Live Netlify URL loads correctly on mobile and desktop. | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 3

### Pre-build steps

- [ ] Tool Architect skill — interview complete, this spec written and confirmed
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder
- [ ] product-spec.md uploaded to the GitHub repo root
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] food-bank-seed.csv uploaded to the GitHub repo root
- [ ] Brand skill file — not applicable, brand is defined in Section 10
- [ ] Netlify connected — not applicable, Netlify MCP is active
- [ ] Credentials — none to prepare; Claude Code creates the Supabase project and keys

### Tier 3 — build session

- [ ] Open Claude Code in the project folder
- [ ] Claude Code runs First Session Setup: creates docs/, moves reference files
- [ ] Claude Code reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] Claude Code proposes the project name `fuelwise`, waits for confirmation, creates the Supabase project via MCP
- [ ] Claude Code builds all tables, RLS policies, and magic-link Auth configuration via Supabase MCP, and disables public signup
- [ ] Claude Code imports `food-bank-seed.csv` into `food_items` (71 rows) and seeds `motivational_messages` (~30 messages)
- [ ] Claude Code creates docs/supabase-setup.md
- [ ] Claude Code builds the frontend
- [ ] Test locally against Section 13 before deploying
- [ ] Netlify MCP active: Claude Code sets environment variables and deploys automatically
- [ ] Optional post-build: run Supabase QA skill to verify schema, RLS, and auth

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Final wording of the GDPR data statement | Builder | Not blocking the build — Claude Code uses the placeholder. **Blocking launch:** must be final before any real tester enters data. |
| Deletion contact email address | Builder | Same — not blocking the build, blocking launch. |
| Final tagline: "Eat well, feel better" / "Food that works for you" / "Fuel yourself well" / none | Builder | No — can be set during the build. |
| Whether to publish a short privacy policy page alongside the data statement | Builder | No for an invited test; yes before any wider rollout. |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 20 November 2026 | Initial build |
| v1.1 | 20 November 2026 | Added `vitamin_c_rich` to the `food_items` schema — Section 9 called for pairing iron with vitamin C but the schema had no field to support it. Seed data changed from Claude Code generating ~60 items to importing the vetted 71-row `food-bank-seed.csv`, with an explicit instruction not to invent nutritional values. Acceptance criteria 10b and 10c added. |

---

*This spec is written for Claude Code. It assumes zero prior context.*
