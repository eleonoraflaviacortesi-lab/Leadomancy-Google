import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

export type CategoryType = 'appointment' | 'task' | 'cliente_reminder' | 'notizia_reminder';

interface CategoryColors {
  appointment: string;
  task: string;
  cliente_reminder: string;
  notizia_reminder: string;
}

const DEFAULT_COLORS: CategoryColors = {
  appointment: '#1A1A18',
  task: '#6DC88A',
  cliente_reminder: '#EDE8FD',
  notizia_reminder: '#FEF5D0',
};

export const useCategoryColors = () => {
  const { user } = useAuth();
  const storageKey = useMemo(() => 
    user?.email ? `leadomancy-category-colors-${user.email}` : 'leadomancy-category-colors'
  , [user?.email]);

  const [colors, setColors] = useState<CategoryColors>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setColors(JSON.parse(saved));
    } else {
      setColors(DEFAULT_COLORS);
    }
  }, [storageKey]);

  const updateCategoryColor = (category: CategoryType, color: string) => {
    const newColors = { ...colors, [category]: color };
    setColors(newColors);
    localStorage.setItem(storageKey, JSON.stringify(newColors));
  };

  return { colors, updateCategoryColor };
};
