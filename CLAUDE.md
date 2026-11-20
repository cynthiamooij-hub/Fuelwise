# Fuelwise

## Identity
Fuelwise gives a woman a personalised daily calorie and macro estimate for her goal, translates it into concrete food portions from a curated food bank, and optionally layers cycle-aware guidance on top. Invited users sign in by magic link.
Tier: 3 — login required, data persists in Supabase, every row locked to its owner (D3+A2)
Spec version governed: v1.2 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line above, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, bucket, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md and food-bank-seed.csv into it.
2. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · shadcn/ui · Netlify · Supabase
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is active — create the site, set environment variables, and deploy via MCP.

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
VITE_SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / public key — Netlify env var

These are the only two. This build has no server-side functions and no other credentials. At session start, confirm both exist before first use; prompt the builder for any that are missing. No value ever appears in code or in any file committed to GitHub.

## Supabase
Project: "fuelwise" — does not exist yet. At the start of session 1, confirm this name with the builder, then create the project via Supabase MCP before building anything. Region: EU (Frankfurt) — GDPR applies. Plan: Free — pauses after ~1 week without traffic.

Build this schema — authoritative until docs/supabase-setup.md exists:
profiles: user_id (FK to auth.users), display_name, age, height_cm, weight_kg, activity_level, goal, cycle_enabled, cycle_length_days, period_length_days, last_period_start, consent_given, consent_timestamp, created_at, updated_at
food_items: id, name, food_group, emoji, portion_description, kcal_per_portion, protein_g, carbs_g, fat_g, iron_rich, high_satiety, vitamin_c_rich, meal_slot, is_custom, owner_id
motivational_messages: id, message_text, context_tag, created_at

Seed food_items by importing docs/food-bank-seed.csv — 71 rows, is_custom false and owner_id null for every one. Never generate food items or nutritional values; if the CSV is missing, stop and ask the builder for it.

RLS — build these policies, never skip:
profiles: anon has no access at all. Authenticated user: read, insert, update and delete her own row only.
food_items: anon has no access at all. Authenticated user: read seed rows (owner_id is null) plus her own custom rows; insert, update and delete only rows she owns.
motivational_messages: anon has no access at all. Authenticated user: read all rows, no writes.
Auth: magic link — invite-only. Public signup must be disabled in Supabase Auth settings.

After setup, write docs/supabase-setup.md and update it at every save point that touches the database. It must contain: project name, project ID, project URL, plan, every table with field names and types, RLS policies per table, auth configuration, notes for future sessions, and a last-updated line with date and session number. From the moment it exists, that file is the schema source of truth.

## Hard Rules
- API keys never in any frontend file or GitHub commit. This build has no server-side functions; the only browser-exposed values are VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, which are public by design and protected by RLS.
- Supabase service role key: never used, never stored, never referenced in any file. It bypasses all RLS and this build has no use case for it. If something appears to require it, stop and ask the builder rather than adding it.
- Netlify Identity: never. Supabase Auth is the only authentication system in this stack.
- RLS: never disabled on any table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- GDPR: two separate, unticked consent checkboxes required before data is saved — one for profile data, one explicit consent for cycle data, shown only when the cycle layer is on. Personal data collected: first name, email, age, height, weight, activity level, goal, and when the cycle layer is on, cycle length, period length and last period start. Cycle data is Article 9 health data. Supabase region: EU (Frankfurt). Deletion requests go to the contact in the data statement. The statement wording and that contact address are placeholders — the tool must not be given to a real user until both are final.
- Switching the cycle layer off must DELETE cycle_length_days, period_length_days and last_period_start from the row, not hide them in the UI.

## Brand
No brand skill yet. These inline rules apply until one is added to the repo (then install it per First Session Setup and defer to it):
- Background: #FDFAF8 — never white or Tailwind gray defaults
- Accent: #D85A30 · deep text #4A1B0C · light fill #FAECE7 · olive #3B6D11 — never Tailwind blue defaults
- Font: a characterful serif for headings (Fraunces or Bricolage Grotesque), a clean sans (Inter or Outfit) for body text. All calorie and macro numbers render in the sans.
- Food emoji are used in the food bank and meal suggestions only. All UI chrome uses a proper icon library (Lucide or Phosphor) — never emoji.
- WCAG 2.2 AA contrast on all text, 44px minimum tap targets, usable one-handed, readable at 200% zoom.

## Business Rules
- BMR (Mifflin-St Jeor, female): (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161.
- Activity multiplier: sedentary 1.2, light 1.375, moderate 1.55, active 1.725. TDEE = BMR × multiplier.
- Goal adjustment: fat_loss TDEE × 0.85, muscle_gain TDEE × 1.10, energy TDEE × 1.0.
- Training-day toggle on: add 250 kcal and show a pre/post-training suggestion. Never stored; resets to off each day.
- Luteal phase only: add 5% to the calorie figure. Capped at 5% — never more, and no other phase adjusts calories.
- Safety floor, applied last and unconditionally: the displayed figure is never below 1,500 kcal/day. If the floor binds, show it with no warning, no error and no explanation.
- Protein is never reduced to make a deficit fit. Cut carbohydrate first, then fat to its minimum, and let the calorie figure rise rather than protein fall.
- Macro split: fat_loss 1.6 g/kg protein and 0.8 g/kg fat; muscle_gain 1.8 g/kg and 0.9 g/kg; energy 1.4 g/kg and 0.9 g/kg. Protein and fat are floors, not ceilings. Carbohydrate takes the remainder.
- Cycle phase: day_in_cycle = (days since last_period_start mod cycle_length_days) + 1. Menstrual = days 1 to period_length_days, emphasise iron_rich items each paired in the same meal with a vitamin_c_rich item. Follicular and ovulatory = no emphasis. Luteal = final 14 days, emphasise high_satiety items and protein-rich snacks.
- Age under 18 blocks onboarding — show a plain message and create no profile row.
- Weight outside 35–250 kg or height outside 120–220 cm: inline validation, do not calculate.
- cycle_enabled true but last_period_start missing or over 60 days old: hide the cycle strip, show a quiet "Update your cycle dates" prompt, guess no phase, apply no luteal adjustment.
- cycle_length_days outside 21–40: show the strip as informational only, apply no phase logic and no calorie adjustment.
- With cycle_enabled false the dashboard renders with no cycle strip, no empty slot and no prompt to enable it. The app must be complete without cycle data.
- Meal suggestions are always two or three options per slot, never a single mandated meal. Never show an empty meal slot.
- Copy rules — binding on every string in the app. No moralised food language ("good", "bad", "cheat", "guilt", "clean", "earned", "burn off"). No streaks, scores, badges or compliance mechanics. No deficit or remaining-calorie framing. Lead with what to include, never what to avoid. Explain the reasoning behind each emphasis in one line. Normalise rather than correct. The dashboard greets, it never audits absence. No red or warning styling anywhere in the eating flow — red is for destructive account actions only. Never display or request a goal weight.

Out of scope — do not build:
- Push notifications
- AI-generated food suggestions
- Weight logging, trend history, or any chart beyond the cycle strip
- PIN login
- Open self-registration
- Streaks, scores, badges, gamification
- Multi-user rollout beyond invited testers
- Recipe content and meal plans
- Hormonal contraception, PCOS and perimenopause handling
- Server-side account deletion — the in-app action deletes the user's own data only; the builder removes the auth record on request

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full view specs, logic, edge cases, acceptance criteria
- docs/food-bank-seed.csv — the 71 seed food items, imported not generated
- docs/supabase-setup.md — schema source of truth (created in session 1)
PROGRESS.md in the root is read at every session start per the Session Protocol.
