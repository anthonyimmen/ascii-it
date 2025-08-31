'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import TwitterCard from './TwitterCard';

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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (imageId: number) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  useEffect(() => {
    // Test mode: pull images from public/test-images/standard
    const testFilenames = [
      'IMG_7028.JPG',
      'IMG_7029.JPG',
      'IMG_7030.JPG',
      'aot.jpeg',
      'naruto-pain.avif',
      'test.jpeg',
      'vagabond.webp',
    ];

    const newImages: ImageData[] = testFilenames.map((name, idx) => ({
      id: idx + 1,
      filename: name,
      original_name: name,
      file_path: `/test-images/standard/${name}`,
      file_size: 0,
      mime_type: '',
      created_at: new Date().toISOString(),
    }));

    setImages(newImages);
    setLoadedImages(new Set());
    setError(null);
    setLoading(false);
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
        loading images...
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
        failed to fetch generated ascii images...
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
        no images found
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
        {/* Twitter composite card */}
        <div
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
          <TwitterCard />
        </div>
{images.map((image) => {
          const isLoaded = loadedImages.has(image.id);
          return (
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
                position: 'relative',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out'
              }}
            >
              <Image
                src={image.file_path || `http://localhost:3000/images/${image.filename}`}
                alt={image.original_name}
                width={120}
                height={120}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                loading="eager"
                unoptimized
                priority
                onLoad={() => handleImageLoad(image.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
