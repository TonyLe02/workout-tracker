# Product truth

Durable context for anyone (human or agent) picking this repo up. Facts only — visual decisions live in the code, which is the design authority.

## What it is

A rep counter with gamification. The problem it solves, in the author's words: *"I lose count. 'Was that 40 or 50 reps?' I don't care about sets or complicated workout plans — I just want to know my total reps at the end of the day."*

Everything else in the app exists to make coming back tomorrow feel worth it: XP, levels, 100 achievements, daily goals, and a rest timer.

Live at https://workout-tracker-two-kappa.vercel.app/

## Who uses it

One person, plus whoever opens the public link. There is no team, no admin console, no onboarding funnel to optimise. The Spotify widgets only work for whitelisted accounts (Spotify dev-mode limit of 5 users), so for everyone else they are permanently in their connect state — that is expected, not a bug.

## The use scene

**A phone, held one-handed, mid-workout.** This is the deciding constraint for anything new:

- Controls that get tapped between sets are ≥44px and within thumb reach.
- Live state belongs in the sticky mobile surfaces (`StickyMobileHeader`, the bottom dock in `MobileQuickAdd`) so it survives scrolling.
- Anything that commits a change gives haptic feedback (`src/lib/haptics.ts`).

Desktop is the second-class citizen but a real one: every logging action has a keyboard path (`?` lists them).

## Mode

**Operate.** People come here to complete a task — log reps, log calories, see whether today is on track. Scanability, honest numbers, and consistency beat expression. The personality lives in the achievement names and the copy, not in layout invention.

## Rules of the domain

- **Reps accumulate** across entries for a day.
- **Calories** are summed per day as `max(sum of active, sum of total)` — a tracker's "total" already contains its "active", so adding them would double count (`src/lib/kcal.ts`).
- **XP**: 1 per rep, 0.5 per calorie, plus achievement rewards. Achievement rewards feed back into total XP, so unlocks are evaluated repeatedly until a pass unlocks nothing new (`src/store/workout-store.ts`).
- **Levels** follow a cumulative curve: level *L* needs `100 × (L−1)L / 2` total XP.
- **Achievements** never state their threshold in data, only a `requirement` predicate. Progress is recovered from the predicate itself and verified before display (`src/lib/milestones.ts`) — do not duplicate thresholds by hand.
- **Storage**: localStorage when signed out; Supabase `profiles` + `workouts` when signed in with Google. Local and remote are merged by entry id, never replaced.

## Standing constraints

- **No streak features.** Deliberately absent; `StreakCard.tsx` is orphaned on purpose.
- **Additive by default.** New work slots into the existing three-column dashboard rather than reorganising it, unless the change is asked for.
- **New borders and dividers use the dark `border-border` token** (#2a2a2a), not `border-white/X`.
- **Backdated logging is out of scope** — offered 2026-08-22 and declined; entries land on today.
- Code and identifiers in English; achievement flavour text is deliberately meme-heavy (anime, LoL, Souls, Twitch).
