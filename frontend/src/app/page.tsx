'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import ImageUploadEdit from './components/ImageUploadEdit';
import ImageGallery from './components/ImageGallery';
import Login from './components/Login';
import { useImageRefresh } from './hooks/useImageRefresh';
import { auth } from './firebase/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

export default function Home() {
  const { refreshTrigger, triggerRefresh } = useImageRefresh();
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);
  
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
        color: 'var(--foreground)',
        padding: "1rem .5rem 0",
        overflow: "auto",
        position: 'relative',
      }}
    >
      <button
        onClick={() => setShowLogin(true)}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: user ? '0' : '8px 16px',
          border: '1px solid white',
          borderRadius: user ? '9999px' : '6px',
          background: 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 10,
          width: user ? 40 : undefined,
          height: user ? 40 : undefined,
          overflow: 'hidden',
        }}
        aria-label={user ? 'Account' : 'Log in'}
      >
        {user ? (
          <img
            src={user.photoURL || '/logo.jpeg'}
            alt={user.displayName || 'User avatar'}
            width={40}
            height={40}
            style={{ borderRadius: '50%', display: 'block', objectFit: 'cover' }}
          />
        ) : (
          'Log In'
        )}
      </button>
      <div
        className="content-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/logo.jpeg"
            alt="Logo"
            width="320"
            height="320"
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '320px',
              display: 'block',
            }}
            priority
          />
        </div>
        <p style={{ margin: '0.25rem', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', padding: '1rem 0rem', textAlign: 'center' }}>
          just ascii it. convert your twitter or an image to ascii art.
        </p>
        <ImageUploadEdit onImageUploaded={triggerRefresh} />
      </div>
      <ImageGallery refreshTrigger={refreshTrigger} />
      
      {showLogin && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowLogin(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative'}}>
              <button
                onClick={() => setShowLogin(false)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '40px',
                  cursor: 'pointer',
                  zIndex: 101,
                }}
              >
                ×
              </button>
              <Login onSuccess={() => setShowLogin(false)} onClose={() => setShowLogin(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
