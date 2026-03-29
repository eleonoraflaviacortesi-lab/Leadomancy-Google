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
  const queryKey = ['daily_reports', user?.id];

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['daily_reports', user?.sede],
    queryFn: async () => {
      if (!user?.sede) return [];
      const data = await getSheetData<CicloProduttivo>(SHEETS.daily_reports);
      // Filter by office to ensure "Ufficio" view is office-specific
      return data
        .filter(r => r.sede === user.sede)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.sede,
  });

  const myData = useMemo(() => {
    return allData.filter(r => r.user_id === user?.id);
  }, [allData, user]);

  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return myData.find(r => r.date === today) || null;
  }, [myData]);

  const saveDailyDataMutation = useMutation({
    mutationFn: async ({ data, date }: { data: Partial<CicloProduttivo>, date: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Check if record exists for user_id + date
      const allReports = await getSheetData<CicloProduttivo>(SHEETS.daily_reports);
      const existingReport = allReports.find(r => r.user_id === user.id && r.date === date);

      if (existingReport) {
        const rowIndex = await findRowIndex(SHEETS.daily_reports, existingReport.id);
        if (rowIndex) {
          await updateRow(SHEETS.daily_reports, rowIndex, {
            ...data,
            sede: user.sede, // Ensure sede is updated/present
            updated_at: new Date().toISOString()
          });
        }
      } else {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newReport: CicloProduttivo = {
          ...data,
          id,
          user_id: user.id,
          sede: user.sede,
          date,
          created_at: now,
          updated_at: now,
        } as CicloProduttivo;
        await appendRow(SHEETS.daily_reports, newReport);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Dati salvati");
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
