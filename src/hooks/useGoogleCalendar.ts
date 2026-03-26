import { useState, useEffect, useCallback, useRef } from 'react';
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
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  calendarId: string;
  calendarColor: string;
}

export function useGoogleCalendar() {
  const { isAuthenticated } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('leadomancy-visible-calendars');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Ref to always have latest calendars without stale closure
  const calendarsRef = useRef<GoogleCalendar[]>([]);
  calendarsRef.current = calendars;

  const waitForCalendarApi = async (): Promise<boolean> => {
    for (let i = 0; i < 20; i++) {
      if ((gapi.client as any).calendar) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  };

  const fetchEventsForIds = useCallback(async (ids: string[], cals: GoogleCalendar[]) => {
    if (!isAuthenticated) return;
    const ready = await waitForCalendarApi();
    if (!ready || ids.length === 0) { setEvents([]); return; }

    setIsLoading(true);
    try {
      const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
      const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString();

      const results = await Promise.all(
        ids.map(id =>
          (gapi.client as any).calendar.events.list({
            calendarId: id, timeMin, timeMax,
            maxResults: 250, singleEvents: true, orderBy: 'startTime'
          }).then((resp: any) => {
            const cal = cals.find(c => c.id === id);
            return (resp.result.items || []).map((ev: any) => ({
              ...ev,
              calendarId: id,
              calendarColor: cal?.backgroundColor || '#1a73e8'
            }));
          }).catch(() => [])
        )
      );

      const unique = Array.from(
        new Map(results.flat().map(e => [e.id, e])).values()
      );
      setEvents(unique);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [isAuthenticated]);

  const fetchCalendars = useCallback(async (): Promise<GoogleCalendar[]> => {
    if (!isAuthenticated) return [];
    const ready = await waitForCalendarApi();
    if (!ready) return [];

    try {
      const resp = await (gapi.client as any).calendar.calendarList.list();
      const list: GoogleCalendar[] = (resp.result.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary,
        backgroundColor: item.backgroundColor || '#1a73e8',
        foregroundColor: item.foregroundColor || '#ffffff',
        selected: item.selected ?? true,
        primary: item.primary || false,
        accessRole: item.accessRole,
      }));
      setCalendars(list);
      setError(null);

      // Initialize visible IDs on first load only
      const saved = localStorage.getItem('leadomancy-visible-calendars');
      if (!saved && list.length > 0) {
        const ids = list.map(c => c.id);
        setVisibleCalendarIds(ids);
        localStorage.setItem('leadomancy-visible-calendars', JSON.stringify(ids));
        return list;
      }
      return list;
    } catch (err: any) {
      const status = err?.status || err?.result?.error?.code;
      if (status === 403 || status === 404) setError(err);
      setHasAttemptedFetch(true);
      return [];
    }
  }, [isAuthenticated]);

  // EFFECT 1: fetch calendars on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendars();
    }
  }, [isAuthenticated]);

  // EFFECT 2: fetch events whenever visibleCalendarIds OR calendars changes
  // This is the KEY fix — both must be in the dependency array
  useEffect(() => {
    if (!isAuthenticated) return;
    if (calendars.length === 0) return;
    fetchEventsForIds(visibleCalendarIds, calendars);
  }, [visibleCalendarIds, calendars, isAuthenticated]);

  // EFFECT 3: polling every 60s
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchEventsForIds(visibleCalendarIds, calendarsRef.current);
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, visibleCalendarIds]);

  const toggleCalendar = useCallback((id: string) => {
    setVisibleCalendarIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(cid => cid !== id)
        : [...prev, id];
      localStorage.setItem('leadomancy-visible-calendars', JSON.stringify(next));
      return next;
    });
    // NOTE: no need to call fetchEventsForIds here — EFFECT 2 handles it
  }, []);

  const toggleAll = useCallback((show: boolean) => {
    const next = show ? calendars.map(c => c.id) : [];
    setVisibleCalendarIds(next);
    localStorage.setItem('leadomancy-visible-calendars', JSON.stringify(next));
  }, [calendars]);

  const refreshEvents = useCallback(() => {
    fetchEventsForIds(visibleCalendarIds, calendarsRef.current);
  }, [fetchEventsForIds, visibleCalendarIds]);

  return {
    calendars,
    visibleCalendarIds,
    events,
    isLoading,
    error,
    hasAttemptedFetch,
    toggleCalendar,
    toggleAll,
    refreshEvents,
  };
}
