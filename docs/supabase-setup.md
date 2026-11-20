# Supabase setup — Fuelwise

Schema source of truth from session 1 onward. Update at every save point that touches the database.

| Detail | Value |
|---|---|
| Project name | fuelwise |
| Project ID / ref | fkbhdkkkwkqhglgqghsf |
| Project URL | https://fkbhdkkkwkqhglgqghsf.supabase.co |
| Region | eu-central-1 (Frankfurt) — GDPR |
| Plan | Free — pauses after ~1 week without traffic; restore in the dashboard |
| Organisation | cynthiamooij-hub's Org |

Keys: the browser uses only the anon key, read from `VITE_SUPABASE_ANON_KEY`. The service role key is never used, stored or referenced.

## Tables

### profiles — one row per user
| Field | Type | Notes |
|---|---|---|
| user_id | uuid PK | FK → auth.users(id), on delete cascade |
| display_name | text not null | 1–60 chars |
| age | integer not null | check 18–120 (under-18 never stored) |
| height_cm | integer not null | check 120–220 |
| weight_kg | numeric(5,1) not null | check 35–250 |
| activity_level | text not null | sedentary · light · moderate · active |
| goal | text not null | fat_loss · muscle_gain · energy |
| cycle_enabled | boolean not null | default false |
| cycle_length_days | integer null | check 10–90 (21–40 gets phase logic; app decides) |
| period_length_days | integer null | check 1–15 |
| last_period_start | date null | |
| consent_given | boolean not null | check = true |
| consent_timestamp | timestamptz not null | default now() |
| created_at | timestamptz not null | default now() |
| updated_at | timestamptz not null | default now(); trigger `profiles_set_updated_at` |

Constraint `cycle_fields_cleared_when_off`: when `cycle_enabled` is false, all three cycle fields must be null. The database itself rejects a row that keeps cycle data while the layer is off.

### food_items — seed food bank + user custom items
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| name | text not null | 1–80 chars |
| food_group | text not null | protein · carb · fat · vegetable · fruit · snack |
| emoji | text not null | |
| portion_description | text not null | 1–80 chars |
| kcal_per_portion | integer not null | 0–3000 |
| protein_g / carbs_g / fat_g | numeric(6,1) not null | ≥ 0 |
| iron_rich / high_satiety / vitamin_c_rich | boolean not null | default false |
| meal_slot | text not null | breakfast · lunch · dinner · snack · any |
| is_custom | boolean not null | default true |
| owner_id | uuid null | FK → auth.users(id), on delete cascade, default auth.uid() |

Constraint `custom_matches_owner`: `is_custom = (owner_id is not null)`. Index on owner_id.
Seeded: 71 rows imported from docs/food-bank-seed.csv (is_custom false, owner_id null). Verified: 71 rows, Σkcal 8947, Σprotein 620.2 — matches the CSV.

### motivational_messages
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| message_text | text not null | |
| context_tag | text not null | general · menstrual · follicular · ovulatory · luteal · training_day · returning_user |
| created_at | timestamptz not null | default now() |

Seeded: 30 messages (general 9, menstrual 4, follicular 3, ovulatory 2, luteal 4, training_day 4, returning_user 4).

## RLS — enabled on every table

`anon` has all privileges revoked on all three tables (requests fail with permission denied).

| Table | Policy | Command | Rule |
|---|---|---|---|
| profiles | profiles_select_own | select | auth.uid() = user_id |
| profiles | profiles_insert_own | insert | check auth.uid() = user_id |
| profiles | profiles_update_own | update | using + check auth.uid() = user_id |
| profiles | profiles_delete_own | delete | auth.uid() = user_id |
| food_items | food_items_select_seed_or_own | select | owner_id is null OR owner_id = auth.uid() |
| food_items | food_items_insert_own | insert | check owner_id = auth.uid() AND is_custom |
| food_items | food_items_update_own | update | using owner_id = auth.uid(); check same AND is_custom |
| food_items | food_items_delete_own | delete | owner_id = auth.uid() |
| motivational_messages | motivational_messages_select_all | select | true (authenticated only); insert/update/delete revoked |

Verified session 1: anon select is denied; an authenticated user updating seed rows changes 0 rows. Security advisor: no lints.

## Auth configuration
- Method: magic link (email OTP) via Supabase Auth. Client calls `signInWithOtp` with `shouldCreateUser: false`.
- Invite-only: users are invited from Dashboard → Authentication → Users → Invite user.
- Users as of session 1: the builder's own account (added session 1 via SQL into auth.users + auth.identities, email confirmed, no password — signs in by magic link) one invited tester (added session 1 via SQL, same method), and two throwaway test users fw-test-a/b@example.test (to be deleted).
- Session 1 auth log showed `422 Signups not allowed for otp` for an uninvited address — i.e. public signup is already refused for OTP.
- **Manual dashboard steps (the MCP cannot change Auth settings):**
  - [ ] Authentication → Sign In / Providers → turn off "Allow new users to sign up"
  - [ ] Authentication → URL Configuration → Site URL = https://fuelwise-all-day.netlify.app; Redirect URLs include https://fuelwise-all-day.netlify.app/**; add `http://localhost:5173` to Redirect URLs for local testing

## Migrations
1. `initial_schema_and_rls` — tables, constraints, trigger, grants, RLS policies (session 1)

## Notes for future sessions
- Nothing calculated (calories, macros, phase) is ever written to the database.
- Switching the cycle layer off must set the three cycle fields to null in the same update as cycle_enabled = false; the check constraint enforces it.
- "Delete my data" deletes the profiles row and the user's food_items rows; the auth.users record stays (builder removes it on request).
- No separate column stores cycle-consent time; consent to cycle data is gated in the UI at save time. See PROGRESS.md known issues.

_Last updated: 20 November 2026 — session 1_
