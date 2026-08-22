### Level Up Your Workout

<img width="1920" height="919" alt="bilde" src="https://github.com/user-attachments/assets/c818d5f1-6046-4323-8c8d-8da49c3ae1b7" />

## Why?

I lose count. "Was that 40 or 50 reps?" I don't care about sets or complicated workout plans - I just want to know my total reps at the end of the day.

So I built this. A simple rep counter with gamification to make it fun and addicting.

**Try it:** https://workout-tracker-two-kappa.vercel.app/

## What It Does

- **Count reps** - Calculator-style numpad, punch in your number, done
- **Track calories** - Log kcal from your fitness tracker
- **Rest between sets** - Countdown that starts itself when you log reps, chime and buzz when it's over
- **See your progress** - Daily goals, weekly charts, total stats
- **Know your pace** - Whether today's rate still lands the goal, and where you stood at this hour yesterday
- **Chase the next badge** - Every locked achievement shows exactly how far off it is
- **Level up** - XP system, 100 achievements, unlock tiers from Bronze to Diamond

That's it. Simple.

## How It Works

- **Sign in with Google** to sync your data across devices
- **Without sign in** your data stays on that device only
- **Spotify widget** - Admin only (requires whitelist, RIP users)

## Rest Timer

Log a set and the rest starts on its own - no extra tap. Presets from 30s to 2m, `-15`/`+15` while it runs, and a countdown that keeps running through a reload or a locked screen. Scroll away and it follows you down into the bottom bar next to the quick-rep buttons.

Three rising blips and a buzz when the rest is up. Mute the chime with the speaker icon, turn auto-start off with the `Auto` pill.

## Keyboard

| Key | Action |
|-----|--------|
| `0`-`9` | Type a rep count |
| `Enter` | Add the count |
| `Esc` | Clear the display |
| `T` | Start or pause the rest |
| `Shift` + `T` | Skip the rest |
| `?` | Every shortcut |

## Haptics

Buttons buzz on Android and Chrome. iPhones have no vibration API in the browser, so they get a system haptic tick instead - lighter, but you feel it.

## XP System

- **1 XP per rep**
- **0.5 XP per active kcal**
- **Achievement rewards** - Bonus XP for unlocking achievements

## Achievements

**Sessions**: 5, 25, 100, 365 sessions  
**Reps**: 100, 500, 1K, 2.5K, 5K, 10K, 25K, 50K, 100K reps  
**Calories**: 500, 1K, 5K, 10K, 25K, 50K, 100K kcal  
**XP**: 1K, 5K, 10K, 50K XP  
**Levels**: 10, 25, 50, 100  

## Level Titles

| Level | Title |
|-------|-------|
| 1 | Rookie |
| 5 | Beginner |
| 10 | Regular |
| 15 | Dedicated |
| 20 | Athlete |
| 25 | Beast |
| 30 | Champion |
| 40 | Legend |
| 50 | Immortal |
| 75 | Demigod |
| 100 | Olympian |

## Data Storage
- **Signed out**: data stays in localStorage on that device
- **Signed in with Google**: workouts, goals, name, and avatar sync through Supabase
