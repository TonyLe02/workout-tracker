# Workout Tracker 💪

A gamified workout tracker with a calculator-style rep counter, heart rate calorie tracking, and progression system. Built with a clean, dark glassy UI.

## Features

- **Calculator Rep Counter** - Numpad-style input for counting reps
- **Heart Rate Calories** - Manual input for active/total kcal from Airpods or fitness tracker
- **XP & Leveling System** - Earn XP from every rep and calorie burned
- **Session Tracking** - Track total workout sessions and average reps per session
- **Adjustable Daily Goals** - Set your own rep and calorie targets
- **35+ Achievements** - Unlock badges across bronze, silver, gold, and diamond tiers
- **Progress Rings** - Visual daily goal tracking
- **Weekly Charts** - See your reps and calories over the past 7 days
- **Dark Glassy UI** - Clean grey/white design with glassmorphism and orange accents

## Prerequisites

### Spotify Integration (Optional)

To enable Spotify Now Playing with playback controls:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://127.0.0.1:8000/callback` as a Redirect URI in your app settings
4. Copy your Client ID
5. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server (port 8000 for Spotify callback)
npm run dev
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

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

All data is stored locally in your browser using localStorage. No account required!
