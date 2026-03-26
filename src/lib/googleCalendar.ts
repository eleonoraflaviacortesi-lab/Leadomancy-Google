import { Appointment } from "@/src/types";

const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';

/**
 * Crea un evento su Google Calendar per un appuntamento.
 */
export async function createCalendarEvent(appointment: Appointment): Promise<string | null> {
  try {
    const event = {
      'summary': appointment.title,
      'location': appointment.location,
      'description': appointment.description,
      'start': {
        'dateTime': appointment.start_time,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': appointment.end_time,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'reminders': {
        'useDefault': true
      }
    };

    const request = (window as any).gapi.client.calendar.events.insert({
      'calendarId': CALENDAR_ID,
      'resource': event
    });

    const response = await request;
    return response.result.id;
  } catch (error) {
    console.error('[GoogleCalendar] Error creating event:', error);
    return null;
  }
}

/**
 * Aggiorna un evento esistente su Google Calendar.
 */
export async function updateCalendarEvent(eventId: string, appointment: Appointment): Promise<void> {
  try {
    const event = {
      'summary': appointment.title,
      'location': appointment.location,
      'description': appointment.description,
      'start': {
        'dateTime': appointment.start_time,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': appointment.end_time,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const request = (window as any).gapi.client.calendar.events.patch({
      'calendarId': CALENDAR_ID,
      'eventId': eventId,
      'resource': event
    });

    await request;
  } catch (error) {
    console.error('[GoogleCalendar] Error updating event:', error);
  }
}

/**
 * Elimina un evento da Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const request = (window as any).gapi.client.calendar.events.delete({
      'calendarId': CALENDAR_ID,
      'eventId': eventId
    });

    await request;
  } catch (error: any) {
    // Ignore 404 errors as the event might have been deleted manually
    if (error.status !== 404) {
      console.error('[GoogleCalendar] Error deleting event:', error);
    }
  }
}

/**
 * Genera un URL per creare manualmente un promemoria su Google Calendar.
 */
export function generateReminderUrl(title: string, dateISO: string, notes?: string): string {
  const start = dateISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
  // Default to 1 hour duration for the reminder link
  const endDate = new Date(new Date(dateISO).getTime() + 60 * 60 * 1000);
  const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: title,
    dates: `${start}/${end}`,
    details: notes || '',
  });

  return `${baseUrl}&${params.toString()}`;
}
