# PROGRESS — Fuelwise

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1
**Last updated:** 20 November 2026 — session 1
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state
Nothing built yet. Repo contains CLAUDE.md, PROGRESS.md, docs/product-spec.md, docs/food-bank-seed.csv.
[Rule: this section describes what exists and works right now — never what is
planned. Completed checklist items get absorbed here in compressed form.]

## Last session
Session 1: First Session Setup — moved product-spec.md and food-bank-seed.csv into docs/.
[Rule: 3–5 lines maximum. Replace each session — what was built, changed, or fixed.]

## Remaining work
- [ ] Create Supabase project "fuelwise" via MCP — confirm the name with the builder first, region EU (Frankfurt)
- [ ] Build all tables and RLS policies and Auth configuration (magic link, public signup disabled), then write docs/supabase-setup.md
- [ ] Import docs/food-bank-seed.csv into food_items — 71 rows, no generated values
- [ ] Seed motivational_messages — around 30 messages written to the copy rules in CLAUDE.md
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
- Save points push directly to main (builder confirmed session 1), so Netlify auto-deploys from main.
[Rule: one line per decision made during the build that is not in the spec — prompt
structures, field formats, naming choices, library picks. Future sessions depend on
these to stay consistent.]

## Known issues
- GDPR data statement wording is a placeholder and the deletion contact address is missing. Both block giving the tool to a real user; neither blocks the build.
- Food bank macro values are standard composition figures, not verified against NEVO. Spot-check the protein sources before real use — they drive the macro split.
- Tagline not chosen: "Eat well, feel better" / "Food that works for you" / "Fuel yourself well" / none.
- Supabase Free plan pauses after about a week without traffic; restore it manually in the dashboard if the tool goes quiet.
[Rule: bugs, edge cases, and deferred fixes. One line each. Remove when resolved.]

## Notes for next session
None.
[Rule: the builder writes here between sessions. Claude Code reads these aloud at
session start, acts on them, then clears this section.]
