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

interface ImageGalleryProps {
  refreshTrigger?: number;
}

export default function ImageGallery({ refreshTrigger }: ImageGalleryProps) {
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
  }, [refreshTrigger]);


  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        padding: '2rem', 
        textAlign: 'left',
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
        textAlign: 'left',
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
        textAlign: 'left',
        fontSize: '0.875rem',
        color: 'var(--foreground)'
      }}>
        No images found
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .gallery-image {
          width: 120px !important;
          height: 120px !important;
        }
        
        @media (min-width: 640px) {
          .gallery-image {
            width: 180px !important;
            height: 180px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .gallery-image {
            width: 240px !important;
            height: 240px !important;
          }
        }
      `}</style>
      <div style={{ 
        width: '100%', 
        padding: '1rem 0.5rem 0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: 'auto'
      }}>
      <h3 style={{ 
        textAlign: 'left', 
        marginBottom: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        opacity: '0.8',
        padding: '0.25rem',
        paddingBottom: '0'
      }}>
        recently generated
      </h3>
      <div 
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          padding: '0.25rem',
          scrollbarWidth: 'none'
        }}
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="gallery-image"
            style={{
              flexShrink: 0,
              width: '120px',
              height: '120px',
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}
          >
            <Image
              src={`http://localhost:3000/images/${image.filename}`}
              alt={image.original_name}
              width={240}
              height={240}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              loading="eager"
              unoptimized
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+JNHmsx2WlNrtyRZXC4YjlYH7KIYBklNKAYxhJ0xCAxBcDKEOp0xg6peD9eOhczQCM7zC2B9cEOp7K6FKn5y2GxEEIyTbQVEQtjCKmWj/2Q=="
            />
          </div>
        ))}
      </div>
    </div>
    </>
  );
}