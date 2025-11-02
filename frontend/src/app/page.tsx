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
        <p
          style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            padding: '0 1.25rem 1rem',
            textAlign: 'center',
            margin: '0 auto',
            maxWidth: 'min(32rem, 92vw)',
            overflowWrap: 'anywhere'
          }}
        >
          just ascii it. convert your twitter or an image to ascii art.
        </p>
        <ImageUploadEdit />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          width: '100%',
          color: '#ffffff',
          marginTop: 'auto',
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
        }}
      >
        <a
          href="https://x.com/anthonyimmen"
          target="_blank"
          rel="noopener noreferrer"
          className="footerLink"
        >
          // by anthonyimmen
        </a>
        <a
          href="https://github.com/anthonyimmen/ascii-it"
          target="_blank"
          rel="noopener noreferrer"
          className="footerLink"
        >
          view the code
        </a>
      </div>
      <style jsx>{`
        .footerLink {
          color: inherit;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .footerLink:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
