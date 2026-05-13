import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Display font only renders in the h1 greeting — skip preload to avoid the
// "preloaded but not used within a few seconds" console warning.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Workout Tracker | Level Up Your Fitness',
  description: 'Track your reps, calories, and level up with achievements',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-background text-text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
