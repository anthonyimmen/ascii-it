'use client';

import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, deleteUser, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/firebase';

interface LoginProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function Login({ onSuccess, onClose }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'failed to sign in with google');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      onClose?.();
    } catch (e: any) {
      setError(e?.message || 'failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        onClose?.();
      } else {
        setError('no authenticated user');
      }
    } catch (e: any) {
      // Likely requires recent login
      setError(e?.message || 'failed to delete account. you may need to reauthenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100dvh',
      width: '100dvw',
      background: 'transparent'
    }}>
      <div style={{
        width: '500px',
        height: '500px',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <h2 style={{ marginBottom: '20px', color: 'white' }}>
          {user ? 'account info' : 'sign in / sign up'}
        </h2>

        {!user ? (
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #e5e5e5',
              background: '#fff',
              color: '#1f1f1f',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            {/* Simple Google G icon */}
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.73 0 6.36 1.61 7.82 2.96l5.33-5.2C33.95 4.42 29.42 2.5 24 2.5 14.82 2.5 6.95 7.98 3.36 15.7l6.79 5.27C11.6 14.67 17.27 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.19-.44-4.67H24v9.02h12.65c-.55 2.95-2.24 5.45-4.77 7.14l7.3 5.67C43.98 37.68 46.5 31.61 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.15 21.06l-6.79-5.27C1.86 18.67 1.5 21.53 1.5 24.5s.36 5.83 1.86 8.71l6.79-5.27C9.35 26.46 9 25.52 9 24.5s.35-1.96 1.15-3.44z"/>
              <path fill="#34A853" d="M24 46.5c5.4 0 9.95-1.79 13.26-4.88l-7.3-5.67c-2.03 1.36-4.64 2.18-7.96 2.18-6.73 0-12.39-5.16-13.85-12.17l-6.79 5.27C6.95 41.02 14.82 46.5 24 46.5z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {loading ? 'signing in...' : 'continue with google'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img
                src={user.photoURL || '/logo.jpeg'}
                alt={user.displayName || 'User avatar'}
                width={40}
                height={40}
                referrerPolicy="no-referrer"
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>
                {user.displayName || user.email}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleSignOut}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e5e5e5',
                  background: 'transparent',
                  color: '#e5e5e5',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                log out
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  //border: '1px solid #ff6b6b',
                  background: 'transparent',
                  color: '#ff6b6b',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                delete account
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: '#ff7b7b', marginTop: '14px', fontSize: '14px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
