'use client';

// React/Next.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Utils/Helpers
import { getCodeFromUrl, exchangeCodeForToken } from '@/lib/spotify';

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Connecting to Spotify...');

  useEffect(() => {
    async function handleCallback() {
      const code = getCodeFromUrl();
      
      if (code) {
        setStatus('Exchanging code for token...');
        const token = await exchangeCodeForToken(code);
        
        if (token) {
          localStorage.setItem('spotify_access_token', token);
          setStatus('Connected!');
        } else {
          setStatus('Failed to connect');
        }
      }
      
      // Redirect to home after a short delay
      setTimeout(() => router.push('/'), 500);
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">{status}</div>
    </div>
  );
}
