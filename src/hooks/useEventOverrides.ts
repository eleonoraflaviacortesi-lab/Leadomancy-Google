import { useState, useEffect } from 'react';

interface EventOverrides {
  [eventId: string]: {
    card_color?: string | null;
  };
}

export const useEventOverrides = () => {
  const [overrides, setOverrides] = useState<EventOverrides>(() => {
    const saved = localStorage.getItem('leadomancy-event-overrides');
    return saved ? JSON.parse(saved) : {};
  });

  const updateEventOverride = (eventId: string, data: { card_color?: string | null }) => {
    const newOverrides = {
      ...overrides,
      [eventId]: {
        ...overrides[eventId],
        ...data
      }
    };
    setOverrides(newOverrides);
    localStorage.setItem('leadomancy-event-overrides', JSON.stringify(newOverrides));
  };

  return { overrides, updateEventOverride };
};
