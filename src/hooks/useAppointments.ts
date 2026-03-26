import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gapi } from "gapi-script";
import { useAuth } from "@/src/hooks/useAuth";
import { Appointment } from "@/src/types";
import { 
  getSheetData, 
  appendRow, 
  updateRow, 
  deleteRow, 
  findRowIndex, 
  SHEETS 
} from "@/src/lib/googleSheets";
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from "@/src/lib/googleCalendar";

export function useAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['appointments', user?.id];

  const { data: appointments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const data = await getSheetData<Appointment>(SHEETS.appointments);
      return data
        .filter(a => a.user_id === user.id)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    },
    staleTime: 0,
    refetchInterval: 5000,
    enabled: !!user,
  });

  const appointmentsByDate = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    appointments.forEach(a => {
      const date = a.start_time.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    });
    return groups;
  }, [appointments]);

  const addAppointmentMutation = useMutation({
    mutationFn: async (newApp: Partial<Appointment>) => {
      if (!user) throw new Error("User not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const appointment: Appointment = {
        ...newApp,
        id,
        user_id: user.id,
        completed: false,
        google_calendar_synced: false,
        google_event_id: null,
        created_at: now,
        updated_at: now,
      } as Appointment;

      await appendRow(SHEETS.appointments, appointment);
      
      // Sync with Google Calendar
      const eventId = await createCalendarEvent(appointment);
      if (eventId) {
        const rowIndex = await findRowIndex(SHEETS.appointments, id);
        if (rowIndex) {
          await updateRow(SHEETS.appointments, rowIndex, {
            google_event_id: eventId,
            google_calendar_synced: true
          });
        }
      }
      
      return appointment;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });
      toast.success("Appuntamento aggiunto");
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async (updates: Partial<Appointment> & { id: string }) => {
      const rowIndex = await findRowIndex(SHEETS.appointments, updates.id);
      if (!rowIndex) {
        console.warn(`[useAppointments] Appointment ${updates.id} not found in sheet, skipping update.`);
        return;
      }
      
      const appointment = appointments.find(a => a.id === updates.id);
      const finalUpdates = { ...updates, updated_at: new Date().toISOString() };

      const promises: Promise<any>[] = [
        updateRow(SHEETS.appointments, rowIndex, finalUpdates)
      ];

      if (appointment?.google_event_id) {
        promises.push(updateCalendarEvent(appointment.google_event_id, { ...appointment, ...updates } as Appointment));
      }

      await Promise.allSettled(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Appuntamento aggiornato");
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const rowIndex = await findRowIndex(SHEETS.appointments, id);
      if (!rowIndex) {
        console.warn(`[useAppointments] Appointment ${id} not found in sheet, skipping delete.`);
        return;
      }
      
      const appointment = appointments.find(a => a.id === id);
      const promises: Promise<any>[] = [
        deleteRow(SHEETS.appointments, rowIndex)
      ];

      if (appointment?.google_event_id) {
        promises.push(deleteCalendarEvent(appointment.google_event_id));
      }

      await Promise.allSettled(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Appuntamento eliminato");
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const rowIndex = await findRowIndex(SHEETS.appointments, id);
      if (!rowIndex) throw new Error('Appointment not found');
      await updateRow(SHEETS.appointments, rowIndex, { 
        completed, 
        updated_at: new Date().toISOString() 
      });
      return { id, completed };
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData<Appointment[]>(queryKey, old =>
        old?.map(a => a.id === id ? { ...a, completed } : a)
      );
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error('Errore nel salvataggio');
    },
    onSettled: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey }), 2000);
    }
  });

  return {
    appointments,
    appointmentsByDate,
    isLoading,
    addAppointment: addAppointmentMutation.mutate,
    updateAppointment: updateAppointmentMutation.mutate,
    deleteAppointment: deleteAppointmentMutation.mutate,
    toggleComplete: toggleCompleteMutation.mutate,
  };
}
