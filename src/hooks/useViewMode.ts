import { useState, useEffect } from 'react';
import { ViewMode } from '@/components/ViewSwitcher';

const STORAGE_KEY = 'card-tracker-view-mode';

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'standard' || stored === 'compact' || stored === 'table') {
        return stored;
      }
    }
    return 'standard';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return [viewMode, setViewMode] as const;
}
