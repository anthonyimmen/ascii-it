'use client';

import Image from 'next/image';
import ImageUploadEdit from './components/ImageUploadEdit';
import ImageGallery from './components/ImageGallery';
import { useImageRefresh } from './hooks/useImageRefresh';

export default function Home() {
  const { refreshTrigger, triggerRefresh } = useImageRefresh();
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
      }}
    >
      <div
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
          just ascii it. convert an image to ascii art.
        </p>
        <ImageUploadEdit onImageUploaded={triggerRefresh} />
      </div>
      <ImageGallery refreshTrigger={refreshTrigger} />
    </div>
  );
}
