'use client';

import Image from 'next/image';
import ImageUploadEdit from './components/ImageUploadEdit';

export default function Home() {
  
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
        color: 'var(--foreground)',
        //padding: "1rem .5rem 0",
        overflow: "auto",
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: "hidden",
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/logo.svg"
            alt="ASCII It logo"
            width="520"
            height="520"
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '500px',
              display: 'block',
            }}
            priority
          />
        </div>
        <p style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', padding: '0rem 0rem 1rem 0rem', textAlign: 'center' }}>
          just ascii it. convert your twitter or an image to ascii art.
        </p>
        <ImageUploadEdit />
      </div>
    </div>
  );
}
