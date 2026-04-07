import { useState, useEffect, useCallback } from 'react';

export interface ClienteActivity {
  id: string;
  cliente_id: string;
  activity_type: 'call' | 'email' | 'visit' | 'proposal' | 'status_change' | 'assignment' | 'comment';
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export function useClienteActivities(clienteId: string) {
  const [activities, setActivities] = useState<ClienteActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `altair-activities-${clienteId}`;

  const loadActivities = useCallback(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setActivities(JSON.parse(stored));
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const addActivity = (activity: Omit<ClienteActivity, 'id' | 'cliente_id' | 'created_at'>) => {
    const newActivity: ClienteActivity = {
      ...activity,
      id: crypto.randomUUID(),
      cliente_id: clienteId,
      created_at: new Date().toISOString(),
    };

    const updated = [newActivity, ...activities];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setActivities(updated);
    return newActivity;
  };

  const deleteActivity = (id: string) => {
    const updated = activities.filter(a => a.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setActivities(updated);
  };

  return {
    activities,
    isLoading,
    addActivity,
    deleteActivity,
    refreshActivities: loadActivities
  };
}
