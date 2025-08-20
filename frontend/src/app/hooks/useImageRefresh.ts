'use client';

import { useState, useCallback } from 'react';

// Custom hook to manage image refresh across components
export const useImageRefresh = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { refreshTrigger, triggerRefresh };
};