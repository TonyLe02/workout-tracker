# Workout Tracker 💪

A fun, gamified workout tracker with a calculator-style rep counter, heart rate calorie tracking, and progression system.

## Features

- **Calculator Rep Counter** - Numpad-style input for counting reps
- **Heart Rate Calories** - Manual input for active and total kcal from Airpods/fitness tracker
- **XP & Leveling System** - Earn XP from every rep and calorie burned
- **Streak Tracking** - Daily workout streaks with XP bonuses (up to 100%)
- **Achievement Badges** - 20+ achievements across bronze, silver, gold, and diamond tiers
- **Progress Rings** - Visual daily goal tracking
- **Weekly Charts** - See your progress over the past 7 days
- **Dark Glassy UI** - Warp/Vercel-inspired design with glassmorphism

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management with localStorage persistence
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons
- **date-fns** - Date utilities

## XP System

- **1 XP per rep**
- **0.5 XP per active kcal**
- **Streak bonus**: +10% XP per streak day (max 100%)
- **Achievement rewards**: Bonus XP for unlocking achievements

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

All data is stored locally in your browser using localStorage. No account required!
