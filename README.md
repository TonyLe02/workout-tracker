# Workout Tracker

### Level Up Your Workout

<img width="1920" height="919" alt="bilde" src="https://github.com/user-attachments/assets/3f46aeb1-2511-4db5-846d-fad82d009ace" />

## Why?

I lose count. "Was that 40 or 50 reps?" I don't care about sets or complicated workout plans - I just want to know my total reps at the end of the day.

So I built this. A simple rep counter with gamification to make it fun and addicting.

**Try it:** https://workout-tracker-two-kappa.vercel.app/

## What It Does

- **Count reps** - Calculator-style numpad, punch in your number, done
- **Track calories** - Log kcal from your fitness tracker
- **See your progress** - Daily goals, weekly charts, total stats
- **Level up** - XP system, 35+ achievements, unlock tiers from Bronze to Diamond

That's it. Simple.

## How It Works

- **Sign in with Google** to sync your data across devices
- **Without sign in** your data stays on that device only
- **Spotify widget** - Admin only (requires whitelist, RIP users)

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
