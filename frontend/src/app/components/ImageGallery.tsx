'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import TwitterCard from './TwitterCard';
import { storage, auth } from '../firebase/firebase';
import { ref as storageRef, listAll, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, type User } from 'firebase/auth';

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
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [viewMode, setViewMode] = useState<'global' | 'user'>('global');

  const handleImageLoad = (imageId: number) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  // Track auth state (so we can load user-specific images)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setLoadedImages(new Set());
      setImages([]);

      try {
        let items: ImageData[] = [];

        if (viewMode === 'user') {
          if (!user) {
            setImages([]);
            setLoading(false);
            return;
          }
          const dir = `users/${user.uid}/ascii`;
          const folderRef = storageRef(storage, dir);
          const res = await listAll(folderRef);
          const files = await Promise.all(
            res.items.map(async (itemRef) => {
              const url = await getDownloadURL(itemRef);
              return {
                id: 0,
                filename: itemRef.name,
                original_name: itemRef.name,
                file_path: url,
                file_size: 0,
                mime_type: '',
                created_at: new Date().toISOString(),
              } as ImageData;
            })
          );
          items = files;
        } else {
          // Global view: list all users' ascii folders and aggregate
          const usersRef = storageRef(storage, 'users');
          const usersList = await listAll(usersRef);

          const perUserFiles = await Promise.all(
            usersList.prefixes.map(async (userPrefix) => {
              try {
                const asciiRef = storageRef(storage, `${userPrefix.fullPath}/ascii`);
                const asciiList = await listAll(asciiRef);
                const files = await Promise.all(
                  asciiList.items.map(async (itemRef) => {
                    const url = await getDownloadURL(itemRef);
                    return {
                      id: 0,
                      filename: itemRef.name,
                      original_name: itemRef.name,
                      file_path: url,
                      file_size: 0,
                      mime_type: '',
                      created_at: new Date().toISOString(),
                    } as ImageData;
                  })
                );
                return files;
              } catch {
                return [] as ImageData[];
              }
            })
          );
          items = perUserFiles.flat();
        }

        // Sort newest-first by filename (relies on timestamp prefix in names)
        items.sort((a, b) => (a.filename < b.filename ? 1 : -1));
        // Reassign ids after sort
        items = items.map((item, idx) => ({ ...item, id: idx + 1 }));

        if (!cancelled) {
          setImages(items);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('failed to list images from storage', e);
          setError('failed to fetch generated ascii images...');
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [refreshTrigger, user, viewMode]);


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
        {viewMode === 'user' && !user ? 'log in to view your images' : 'no images found'}
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
      <button
        onClick={() => setViewMode((m) => (m === 'global' ? 'user' : 'global'))}
        disabled={!user}
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          textAlign: 'left', 
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          opacity: 0.85,
          padding: '0.25rem 0.5rem',
          paddingBottom: '0',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer'
        }}
        aria-pressed={viewMode === 'user'}
        title={viewMode === 'global' ? 'show your recently generated' : 'show global recently generated'}
      >
        {viewMode === 'global' ? 'global recently generated' : 'your recently generated'}
      </button>
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
                width: '100px',
                height: '100px',
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
