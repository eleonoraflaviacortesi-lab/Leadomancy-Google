import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  organizer?: { email?: string; displayName?: string };
  htmlLink?: string;
  description?: string;
  location?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  due?: string;        // RFC 3339 date
  completed?: string;  // RFC 3339 datetime if completed
  status: 'needsAction' | 'completed';
  notes?: string;
  selfLink?: string;
}

export function useGoogleCalendar() {
  const { isAuthenticated, user } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  
  const storageKey = useMemo(() => 
    user?.email ? `altair-visible-calendars-${user.email}` : 'altair-visible-calendars'
  , [user?.email]);

  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>([]);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Ref to track if we have loaded the initial state for the current storageKey
  const lastLoadedKeyRef = useRef<string | null>(null);

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

  const fetchGoogleTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      // Get task lists
      const listsResp = await (gapi.client as any).request({
        path: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        params: { maxResults: 20 }
      });
      const lists = listsResp.result.items || [];

      // Fetch tasks from all lists
      const allTasks: GoogleTask[] = [];
      await Promise.all(lists.map(async (list: any) => {
        try {
          const tasksResp = await (gapi.client as any).request({
            path: `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`,
            params: {
              maxResults: 100,
              showCompleted: true,
              showHidden: false,
              dueMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              dueMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            }
          });
          const items = tasksResp.result.items || [];
          allTasks.push(...items.filter((t: any) => t.due || t.title));
        } catch { /* skip failing lists */ }
      }));

      setTasks(allTasks);
    } catch (e) {
      console.error('[GoogleTasks] fetch failed:', e);
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

      // If we haven't initialized visible IDs for this user yet, do it now
      const saved = localStorage.getItem(storageKey);
      if (!saved && list.length > 0 && lastLoadedKeyRef.current === storageKey) {
        const ids = list.map(c => c.id);
        setVisibleCalendarIds(ids);
        localStorage.setItem(storageKey, JSON.stringify(ids));
      } else if (saved && list.length > 0 && lastLoadedKeyRef.current === storageKey) {
        // Ensure saved IDs still exist
        const savedIds = JSON.parse(saved) as string[];
        const validIds = savedIds.filter(id => list.some(c => c.id === id));
        if (validIds.length !== savedIds.length) {
          setVisibleCalendarIds(validIds);
          localStorage.setItem(storageKey, JSON.stringify(validIds));
        }
      }
      
      return list;
    } catch (err: any) {
      const status = err?.status || err?.result?.error?.code;
      if (status === 403 || status === 404) setError(err);
      setHasAttemptedFetch(true);
      return [];
    }
  }, [isAuthenticated, storageKey]);

  // EFFECT 1: fetch calendars on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendars();
    }
  }, [isAuthenticated, fetchCalendars]);

  // Update visible IDs when storageKey changes (e.g. user logs in)
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setVisibleCalendarIds(JSON.parse(saved));
      } else {
        // Default to empty until calendars are fetched
        setVisibleCalendarIds([]);
      }
      lastLoadedKeyRef.current = storageKey;
    } catch (err) {
      console.error("Error loading calendar visibility:", err);
    }
  }, [storageKey, isAuthenticated, user?.email]);

  // EFFECT 2: fetch events whenever visibleCalendarIds OR calendars changes
  // This is the KEY fix — both must be in the dependency array
  useEffect(() => {
    if (!isAuthenticated) return;
    if (calendars.length === 0) return;
    fetchEventsForIds(visibleCalendarIds, calendars);
    fetchGoogleTasks();
  }, [visibleCalendarIds, calendars, isAuthenticated, fetchGoogleTasks]);

  // EFFECT 3: polling every 60s
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchEventsForIds(visibleCalendarIds, calendarsRef.current);
      fetchGoogleTasks();
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, visibleCalendarIds, fetchGoogleTasks]);

  const toggleCalendar = useCallback((id: string) => {
    setVisibleCalendarIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(cid => cid !== id)
        : [...prev, id];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    // NOTE: no need to call fetchEventsForIds here — EFFECT 2 handles it
  }, [storageKey]);

  const toggleAll = useCallback((show: boolean) => {
    const next = show ? calendars.map(c => c.id) : [];
    setVisibleCalendarIds(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [calendars, storageKey]);

  const refreshEvents = useCallback(() => {
    fetchEventsForIds(visibleCalendarIds, calendarsRef.current);
  }, [fetchEventsForIds, visibleCalendarIds]);

  const updateEvent = useCallback(async (calendarId: string, eventId: string, updates: { start: Date; end: Date }) => {
    if (!isAuthenticated) return;
    const ready = await waitForCalendarApi();
    if (!ready) return;

    try {
      await (gapi.client as any).calendar.events.patch({
        calendarId,
        eventId,
        resource: {
          start: { dateTime: updates.start.toISOString() },
          end: { dateTime: updates.end.toISOString() },
        },
      });
      refreshEvents();
      return true;
    } catch (err) {
      console.error("Error updating Google Calendar event:", err);
      throw err;
    }
  }, [isAuthenticated, refreshEvents]);

  return {
    calendars,
    visibleCalendarIds,
    events,
    tasks,
    isLoading,
    error,
    hasAttemptedFetch,
    toggleCalendar,
    toggleAll,
    refreshEvents,
    updateEvent,
    fetchGoogleTasks,
  };
}
