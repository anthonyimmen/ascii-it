import Image from 'next/image';
import ImageUploadEdit from './components/ImageUploadEdit';

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
        padding: "1rem",
        overflow: "auto"
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
      <p style={{ margin: '0.25rem', fontSize: '1rem', padding: '1rem', textAlign: 'center' }}>
        just ascii it. convert an image to ascii art.
      </p>
      <ImageUploadEdit />
    </div>
  );
}
