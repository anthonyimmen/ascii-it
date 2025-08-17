'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageData {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/images');
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        const data = await response.json();
        setImages(data.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        padding: '2rem', 
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--foreground)'
      }}>
        Loading images...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        padding: '2rem', 
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--foreground)'
      }}>
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        padding: '2rem', 
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--foreground)'
      }}>
        No images found
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      padding: '2rem 1rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        fontSize: '1.125rem',
        fontWeight: '600'
      }}>
        Recent Images
      </h3>
      <div style={{
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        padding: '0.5rem',
        scrollbarWidth: 'thin'
      }}>
        {images.map((image) => (
          <div
            key={image.id}
            style={{
              flexShrink: 0,
              width: '120px',
              height: '120px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Image
              src={`http://localhost:3000/images/${image.filename}`}
              alt={image.original_name}
              width={120}
              height={120}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}