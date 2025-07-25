import Image from 'next/image';

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', justifyContent: 'center' }}>
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={320}
          height={320}
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '320px',
            display: 'block',
          }}
          priority
        />
      </div>
      <input
        type="file"
        style={{
          marginTop: '2rem',
          fontSize: '1rem',
          padding: '0.5rem 1rem',
          width: '100%',
          maxWidth: 320,
        }}
      />
    </div>
  );
}
