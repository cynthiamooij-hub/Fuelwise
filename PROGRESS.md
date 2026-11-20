# PROGRESS — Fuelwise

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1
**Last updated:** 20 November 2026 — session 1
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state
Supabase project "fuelwise" (fkbhdkkkwkqhglgqghsf, Frankfurt, Free) is live: profiles, food_items, motivational_messages with RLS on all three and anon fully revoked. food_items holds the 71 CSV seed rows (verified against the file); motivational_messages holds 30 messages. docs/supabase-setup.md written. No frontend yet.
[Rule: this section describes what exists and works right now — never what is
planned. Completed checklist items get absorbed here in compressed form.]

## Last session
Session 1: moved spec + CSV into docs/. Paused the eql-exam-trainer project (builder's choice) to free a Free-plan slot, created Supabase "fuelwise", built schema + RLS, imported seed, seeded messages, wrote docs/supabase-setup.md.
[Rule: 3–5 lines maximum. Replace each session — what was built, changed, or fixed.]

## Remaining work
- [ ] Builder: in Supabase dashboard turn off "Allow new users to sign up", set Site URL and redirect URLs (MCP cannot change Auth settings)
- [ ] Build Login — email field, magic link request, no password and no registration route
- [ ] Build Onboarding — four steps: about you, your days, your goal, cycle guidance with its own toggle and consent
- [ ] Build Dashboard — greeting and message, cycle strip when enabled, calories and macros, training toggle, meal options, why-this explainer
- [ ] Build Food bank — browse by group, search, add and edit her own items, seed items read-only
- [ ] Build Settings — edit profile, cycle layer toggle with real field deletion, data statement link, delete my data, sign out
- [ ] Add the two GDPR consent checkboxes and the data statement to onboarding
- [ ] Local test pass — full walkthrough of every view, cycle layer both on and off
- [ ] Acceptance criteria pass — verify every criterion in spec Section "Acceptance Criteria" before deploy
- [ ] Deploy to Netlify via MCP, set environment variables
[Rule: completed items leave this list and are absorbed into Current state. This
list only shrinks.]

## Build decisions
- DB check constraint cycle_fields_cleared_when_off forces cycle fields null when cycle_enabled is false.
- Motivational messages avoid every word on the criterion-16 grep list, including "good".
- Save points push directly to main (builder confirmed session 1), so Netlify auto-deploys from main.
[Rule: one line per decision made during the build that is not in the spec — prompt
structures, field formats, naming choices, library picks. Future sessions depend on
these to stay consistent.]

## Known issues
- The schema has no field for the cycle-consent timestamp; cycle consent is enforced in the UI only. Consider adding cycle_consent_timestamp for an Article 9 audit trail (needs a spec change).
- Builder's other Supabase project "eql-exam-trainer" was paused in session 1 to free a Free-plan slot; restore it from the dashboard when needed.
- GDPR data statement wording is a placeholder and the deletion contact address is missing. Both block giving the tool to a real user; neither blocks the build.
- Food bank macro values are standard composition figures, not verified against NEVO. Spot-check the protein sources before real use — they drive the macro split.
- Tagline not chosen: "Eat well, feel better" / "Food that works for you" / "Fuel yourself well" / none.
- Supabase Free plan pauses after about a week without traffic; restore it manually in the dashboard if the tool goes quiet.
[Rule: bugs, edge cases, and deferred fixes. One line each. Remove when resolved.]

## Notes for next session
None.
[Rule: the builder writes here between sessions. Claude Code reads these aloud at
session start, acts on them, then clears this section.]
