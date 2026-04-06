import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { CicloProduttivo } from "@/src/types";
import { 
  getSheetData, 
  appendRow, 
  updateRow, 
  findRowIndex, 
  SHEETS 
} from "@/src/lib/googleSheets";

export function useDailyData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['daily_reports', user?.sede || 'all'];

  const { data: rawData = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getSheetData<CicloProduttivo>(SHEETS.daily_reports);
      return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const myData = useMemo(() => {
    const userId = user?.user_id || user?.id;
    if (!userId) return [];
    return rawData.filter(r => String(r.user_id).toLowerCase() === String(userId).toLowerCase());
  }, [rawData, user]);

  const allData = useMemo(() => {
    if (!user?.sede) return rawData;
    return rawData.filter(r => String(r.sede).toLowerCase() === String(user.sede).toLowerCase());
  }, [rawData, user?.sede]);

  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return myData.find(r => r.date === today) || null;
  }, [myData]);

  const saveDailyDataMutation = useMutation({
    mutationFn: async ({ data, date }: { data: Partial<CicloProduttivo>, date: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const userId = user.user_id || user.id;
      // Check if record exists for user_id + date
      const allReports = await getSheetData<CicloProduttivo>(SHEETS.daily_reports);
      const existingReport = allReports.find(r => 
        String(r.user_id).toLowerCase() === String(userId).toLowerCase() && 
        r.date === date
      );

      if (existingReport) {
        const rowIndex = await findRowIndex(SHEETS.daily_reports, existingReport.id);
        if (rowIndex) {
          await updateRow(SHEETS.daily_reports, rowIndex, {
            ...data,
            sede: user.sede || existingReport.sede, // Keep existing sede if user's is missing
            updated_at: new Date().toISOString()
          });
        }
      } else {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newReport: CicloProduttivo = {
          ...data,
          id,
          user_id: userId,
          sede: user.sede || 'Firenze', // Default to Firenze if missing
          date,
          created_at: now,
          updated_at: now,
        } as CicloProduttivo;
        await appendRow(SHEETS.daily_reports, newReport);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.refetchQueries({ queryKey });
      toast.success("Ciclo salvato ✓");
    },
    onError: (error) => {
      console.error('[useDailyData] Save failed:', error);
      toast.error("Errore nel salvataggio del ciclo");
    },
  });

  return {
    myData,
    allData,
    todayData,
    isLoading,
    saveDailyData: saveDailyDataMutation.mutate,
  };
}
