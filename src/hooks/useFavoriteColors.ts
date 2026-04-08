import { useState } from 'react';

export function useFavoriteColors() {
  const LS_KEY = 'altair-favorite-colors';
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch { return []; }
  });

  const save = (colors: string[]) => {
    setFavorites(colors);
    localStorage.setItem(LS_KEY, JSON.stringify(colors));
  };

  const addColor = (color: string) => {
    save([color, ...favorites.filter(c => c !== color)].slice(0, 12));
  };

  const removeColor = (color: string) => {
    save(favorites.filter(c => c !== color));
  };

  const updateColor = (oldColor: string, newColor: string) => {
    save(favorites.map(c => c === oldColor ? newColor : c));
  };

  return { favorites, addColor, removeColor, updateColor };
}
