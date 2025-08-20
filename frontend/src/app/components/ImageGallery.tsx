'use client';

import { useState, useEffect, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (images.length === 0 || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // Calculate the width of one complete set of images
      const itemWidth = 120 + 8; // image width + gap (0.5rem = 8px)
      const totalWidth = images.length * itemWidth;
      
      // Reset position when we've scrolled through one complete set
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0;
      }
      
      container.scrollLeft = scrollPosition;
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [images]);

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
        Recently Generated
      </h3>
      <div 
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'hidden',
          padding: '0.25rem',
          scrollbarWidth: 'none'
        }}
      >
        {/* Duplicate images for seamless loop */}
        {[...images, ...images, ...images].map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            style={{
              flexShrink: 0,
              width: '120px',
              height: '120px',
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Image
              src={`http://localhost:3000/images/${image.filename}`}
              alt={image.original_name}
              width={60}
              height={60}
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