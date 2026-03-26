import { useState, useEffect, useCallback } from 'react';

export interface PropertyMatch {
  id: string;
  cliente_id: string;
  property_name: string;
  property_url: string;
  match_score: number;
  notes: string;
  reaction: 'positive' | 'negative' | null;
  suggested: boolean;
  created_at: string;
}

export function usePropertyMatches(clienteId: string) {
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `leadomancy-matches-${clienteId}`;

  const loadMatches = useCallback(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMatches(JSON.parse(stored));
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const addMatch = (match: Omit<PropertyMatch, 'id' | 'cliente_id' | 'created_at'>) => {
    const newMatch: PropertyMatch = {
      ...match,
      id: crypto.randomUUID(),
      cliente_id: clienteId,
      created_at: new Date().toISOString(),
    };

    const updated = [newMatch, ...matches];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setMatches(updated);
    return newMatch;
  };

  const updateMatch = (id: string, updates: Partial<PropertyMatch>) => {
    const updated = matches.map(m => m.id === id ? { ...m, ...updates } : m);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setMatches(updated);
  };

  const deleteMatch = (id: string) => {
    const updated = matches.filter(m => m.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setMatches(updated);
  };

  return {
    matches,
    isLoading,
    addMatch,
    updateMatch,
    deleteMatch,
    refreshMatches: loadMatches
  };
}
