import { useState, useEffect, useCallback } from 'react';
import { gapi } from 'gapi-script';
import { useAuth } from '@/src/hooks/useAuth';

export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
  primary: boolean;
  accessRole: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  calendarId: string;
  calendarColor: string;
}

export function useGoogleCalendar() {
  const { isAuthenticated } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('leadomancy-visible-calendars');
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchAllCalendars = useCallback(async () => {
    if (!isAuthenticated) return [];
    
    // Reset error on each attempt
    setError(null);

    // Wait for gapi to be ready
    let attempts = 0;
    while (!(gapi.client as any).calendar && attempts < 10) {
      console.log("[GoogleCalendar] Waiting for Calendar API...");
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!(gapi.client as any).calendar) {
      console.warn("[GoogleCalendar] Calendar API not available after 5s");
      return [];
    }

    try {
      const response = await (gapi.client as any).calendar.calendarList.list();
      const calendarList = response.result.items.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        backgroundColor: item.backgroundColor,
        foregroundColor: item.foregroundColor,
        selected: item.selected,
        primary: item.primary || false,
        accessRole: item.accessRole,
      }));
      setCalendars(calendarList);
      
      // If success, clear error
      setError(null);
      setHasAttemptedFetch(true);
      
      // Initialize visible IDs ONLY if they have never been set in localStorage
      const saved = localStorage.getItem('leadomancy-visible-calendars');
      if (!saved && calendarList.length > 0) {
        const ids = calendarList.map((c: any) => c.id);
        setVisibleCalendarIds(ids);
        localStorage.setItem('leadomancy-visible-calendars', JSON.stringify(ids));
      }
      
      return calendarList;
    } catch (err: any) {
      console.error("[GoogleCalendar] Error fetching calendar list:", err);
      setHasAttemptedFetch(true);
      
      // Only set error if it's a 403 or 404 (API not enabled or not found)
      const status = err.status || err.result?.error?.code;
      if (status === 403 || status === 404) {
        setError(err);
      } else {
        setError(null);
      }
      return [];
    }
  }, [isAuthenticated]);

  const fetchEventsFromAllCalendars = useCallback(async (calendarIds: string[], currentCalendars: GoogleCalendar[]) => {
    if (!isAuthenticated || !(gapi.client as any).calendar) return [];
    
    if (calendarIds.length === 0) {
      setEvents([]);
      return [];
    }

    setIsLoading(true);
    try {
      const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
      const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString();
      
      const promises = calendarIds.map(id => 
        (gapi.client as any).calendar.events.list({
          calendarId: id,
          timeMin,
          timeMax,
          maxResults: 250,
          singleEvents: true,
          orderBy: 'startTime'
        }).then((resp: any) => {
          const calendar = currentCalendars.find(c => c.id === id);
          return (resp.result.items || []).map((event: any) => ({
            ...event,
            calendarId: id,
            calendarColor: calendar?.backgroundColor || '#1a73e8'
          }));
        }).catch((err: any) => {
          console.error(`[GoogleCalendar] Error fetching events for calendar ${id}:`, err);
          return [];
        })
      );

      const results = await Promise.all(promises);
      const allEvents = results.flat();
      
      const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());
      setEvents(uniqueEvents);
      return uniqueEvents;
    } catch (err) {
      console.error("[GoogleCalendar] Error fetching all events:", err);
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const toggleCalendar = (id: string) => {
    setVisibleCalendarIds(prev => {
      const next = prev.includes(id) 
        ? prev.filter(cid => cid !== id) 
        : [...prev, id];
      localStorage.setItem('leadomancy-visible-calendars', JSON.stringify(next));
      return next;
    });
  };

  const toggleAll = (show: boolean) => {
    const next = show ? calendars.map(c => c.id) : [];
    setVisibleCalendarIds(next);
    localStorage.setItem('leadomancy-visible-calendars', JSON.stringify(next));
  };

  const refreshEvents = useCallback(async () => {
    const latestCalendars = await fetchAllCalendars();
    const saved = localStorage.getItem('leadomancy-visible-calendars');
    const currentVisibleIds = saved ? JSON.parse(saved) : visibleCalendarIds;
    
    if (latestCalendars.length > 0) {
      await fetchEventsFromAllCalendars(currentVisibleIds, latestCalendars);
    } else if (calendars.length > 0) {
      await fetchEventsFromAllCalendars(currentVisibleIds, calendars);
    }
  }, [fetchAllCalendars, fetchEventsFromAllCalendars, visibleCalendarIds, calendars]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshEvents();
      const interval = setInterval(refreshEvents, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]); // Removed refreshEvents from dependencies to avoid loop

  return {
    calendars,
    visibleCalendarIds,
    events,
    isLoading,
    error,
    hasAttemptedFetch,
    toggleCalendar,
    toggleAll,
    refreshEvents
  };
}
