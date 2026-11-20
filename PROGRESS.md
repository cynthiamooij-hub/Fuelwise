# PROGRESS — Fuelwise

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1
**Last updated:** 20 November 2026 — session 1
**Live URL:** https://fuelwise-all-day.netlify.app (GitHub → Netlify, auto-deploys from main)

## Current state
- Supabase "fuelwise" (fkbhdkkkwkqhglgqghsf, Frankfurt, Free): profiles, food_items (71 CSV seed rows, verified), motivational_messages (30). RLS on all tables, anon revoked. See docs/supabase-setup.md.
- Frontend (React + Vite + Tailwind v4 + shadcn-style Radix components, Lucide icons, self-hosted Fraunces + Inter) at repo root: Login (magic link, shouldCreateUser false), 4-step Onboarding with age gate + two consent boxes, Dashboard (greeting/message, cycle strip, fuel, training toggle, plate, why-this), Food bank (browse/search/add/edit/delete own), Settings (profile, cycle on/off with field deletion, data statement, delete my data, sign out), Privacy and Data-deleted pages, and a Recipes tab (Google search links for today's lunch/dinner proteins).
- Business logic in src/lib/nutrition.ts and src/lib/suggestions.ts; `npm test` runs 34 vitest checks covering criteria 3, 4, 5, 7, 8, 9, 10c, 15 and 2–3 options per slot.
- Verified session 1: criterion 11 (RLS isolation) by SQL impersonation; criteria 2, 6, 9, 10, 12, 13, 14, 15, 17, 18 by a Playwright walkthrough with Supabase mocked (the container cannot reach supabase.co); criterion 16 grep clean.

## Last session
Session 1: moved docs, created Supabase project + schema + RLS + seed, built the whole frontend, tested logic and UI (mocked backend), fixed 200%-zoom overflow; reworked Today's plate into "pick one / build your plate / pick two" at the builder's request.

## Remaining work
- [ ] Builder: Supabase → Authentication → URL Configuration: Site URL = https://fuelwise-all-day.netlify.app, Redirect URLs add https://fuelwise-all-day.netlify.app/** (magic links fell back to localhost:3000 until this is set); optionally turn off "Allow new users to sign up"
- [ ] Live test with a real invited user: criterion 1 (magic link, non-invited email gets nothing), 2, 13 and 14 verified by query against the real DB, 19 (mobile + desktop)
- [ ] Delete the two test auth users fw-test-a@example.test / fw-test-b@example.test (needs builder at desktop to approve the delete prompt)
- [ ] Builder: final data statement wording + deletion contact email (blocks giving the tool to a real user)

## Build decisions
- Save points push directly to main (builder confirmed session 1), so Netlify auto-deploys from main.
- App lives at the repo root (not a subfolder) so `npm install / dev / build` match CLAUDE.md.
- DB check constraint cycle_fields_cleared_when_off forces cycle fields null when cycle_enabled is false.
- Ovulatory = the 3 days ending at day (L−14); luteal = final 14 days (L−13..L), so the two never overlap. Menstrual wins if a long period overlaps.
- Calorie order: training +250 is added before the luteal ×1.05, per spec step order.
- Today's plate is "pick from these" (builder's call, session 1): breakfast = pick one of 3 substantial foods (≥100 kcal, protein/carb); lunch & dinner = build your plate, 3 rows (protein / carb / veg) of 3 choices; snacks = pick two of 3 from snack/fruit/nut foods. Choices are weighted toward phase emphasis and protein density; no per-meal kcal matching.
- Lunch carbs also draw from dinner-slot carbs (seed has only 2 lunch carbs).
- Menstrual phase: lunch/dinner veg row is vitamin C-rich only; breakfast gets a "with some vitamin C" fruit row when an iron-rich choice is shown; snacks become "one iron-rich + one vitamin C fruit". A test checks every combination she could pick (criterion 10c).
- Suggestions are seeded by date so they're stable through the day; each meal has its own "New ideas" button and seed, so refreshing one meal leaves the others alone.
- Recipes tab (builder's call, session 1): links out to Google "healthy <protein> recipe" searches for the proteins on today's lunch + dinner plate; opens in a new tab; only the food name goes into the URL. Spec v1.2 lists recipe content as out of scope — builder accepted external search links as a bonus; fold into the spec at the next revision.
- Plate state (per-meal seeds, training toggle) lives in src/context/PlateContext.tsx, in memory only, shared by Today and Recipes.
- Today's plate opens with a 3-line intro (how to pick, season it well, veg is unlimited) — copy in src/lib/copy.ts PLATE_INTRO.
- Message choice: training_day → phase → returning_user/general, chosen by date.
- #D85A30 fails AA for small text: buttons use #993C1D with white (6.96:1); muted text #7A4A3A; #D85A30 only decorative/large.
- Validation hints use deep text + info icon — no red. Red (#B42318) only on delete-my-data buttons.
- Login shows the same "check your inbox" message whether or not the email is invited.
- Tagline set to "Food that works for you" (builder may change in src/lib/copy.ts).
- Netlify project is "fuelwise-all-day" (id 21641355-ce79-4645-961a-b164fc7e8cc5; created as fuelwise-prjn, renamed by builder), linked to GitHub main by the builder. Env vars VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and SECRETS_SCAN_OMIT_KEYS (for those two public values) set via MCP.
- Fonts self-hosted via @fontsource (no Google Fonts request — GDPR).
- Motivational messages avoid every word on the criterion-16 grep list, including "good".

## Known issues
- One invited tester was given access in session 1 while the data statement and deletion contact are still placeholders — builder's explicit override of the hard rule ("it's just a test"). Finalise both before inviting anyone else.
- Netlify shows a "Powered by Netlify" badge over the bottom-right of the nav (covers Recipes/Settings on phones). Builder to look for a setting in Netlify; fallback is an app-side nav change.
- Recipes tab links to external sites; Fuelwise's copy rules can't be enforced there (some recipes may use moralised wording).
- No DB field for the cycle-consent timestamp; cycle consent is enforced in the UI only. Consider cycle_consent_timestamp for an Article 9 audit trail (spec change).
- Builder's Supabase project "eql-exam-trainer" was paused in session 1 to free a Free-plan slot; restore from the dashboard when needed.
- This cloud container cannot reach supabase.co (builder declined a network change), so live end-to-end tests happen on the deployed site.
- JS bundle is ~615 kB (warning only); code-splitting optional later.
- GDPR data statement wording is a placeholder and the deletion contact address is missing. Both block giving the tool to a real user; neither blocks the build.
- Food bank macro values are standard composition figures, not verified against NEVO. Spot-check the protein sources before real use.
- Supabase Free plan pauses after about a week without traffic; restore it manually in the dashboard if the tool goes quiet.

## Notes for next session
- First tester: Nadja Carrillo, Nadjacarrillo@gmail.com. Builder to invite her in Supabase → Authentication → Users → Invite user. Blocked until (a) Site URL and Redirect URLs are set, or her magic link will point at localhost:3000, and (b) the final data statement wording and deletion contact are in place — she is a real user entering Article 9 health data. Once she is in, she covers the "live test with a real invited user" item above.
  - Update (session 1): she was added as a user via SQL; the Site URL gate is done. The data statement / contact gate was skipped by the builder's explicit choice ("it's just a test") — still to finalise. She signs in at https://fuelwise-all-day.netlify.app with "Send me a link".
