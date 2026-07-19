'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
    console.log('PWA install choice:', outcome);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="card" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem' }}>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        Install Eolas for faster access, offline-ready capture, and a native app feel.
      </p>
      <button type="button" onClick={handleInstall} style={{ marginTop: '1rem' }}>
        Install Eolas
      </button>
    </div>
  );
}
