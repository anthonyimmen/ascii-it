'use client';

import { useState } from 'react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        <h2 style={{ marginBottom: '30px', color: 'white' }}>
          {isSignUp ? 'sign up' : 'sign in'}
        </h2>
        
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'white',
            borderBottom: '1px solid #ccc'
          }}
        />
        
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'white',
            borderBottom: '1px solid #ccc'
          }}
        />
        
        {isSignUp && (
          <input
            type="password"
            placeholder="confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '20px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'white',
              borderBottom: '1px solid #ccc'
            }}
          />
        )}
        
        <div style={{display: 'flex', marginTop: '20px'}}>
          <button
            style={{
              padding: '12px 24px',
              border: '1px solid white',
              borderRadius: '6px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {isSignUp ? 'sign up' : 'sign in'}
          </button>
          
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'sign in?' : 'sign up?'}
          </button>
        </div>
      </div>
    </div>
  );
}