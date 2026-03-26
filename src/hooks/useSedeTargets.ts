import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { 
  getSheetData, 
  appendRow, 
  updateRow, 
  findRowIndex, 
  SHEETS 
} from "@/src/lib/googleSheets";

interface SedeTarget {
  id: string;
  sede: string;
  month: number;
  year: number;
  contatti_target: number;
  notizie_target: number;
  incarichi_target: number;
  acquisizioni_target: number;
  appuntamenti_target: number;
  vendite_target: number;
  fatturato_target: number;
  trattative_chiuse_target: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TARGETS = {
  contatti_target: 100,
  notizie_target: 40,
  incarichi_target: 4,
  acquisizioni_target: 8,
  appuntamenti_target: 40,
  vendite_target: 4,
  fatturato_target: 500000,
  trattative_chiuse_target: 4
};

export function useSedeTargets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const queryKey = ['sede_targets', user?.sede, currentMonth, currentYear];

  const { data: targets, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.sede) return null;
      const data = await getSheetData<SedeTarget>(SHEETS.sede_targets);
      const found = data.find(t => 
        t.sede === user.sede && 
        Number(t.month) === currentMonth && 
        Number(t.year) === currentYear
      );
      return found || { ...DEFAULT_TARGETS, sede: user.sede, month: currentMonth, year: currentYear } as SedeTarget;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!user?.sede,
  });

  const updateTargetsMutation = useMutation({
    mutationFn: async (updates: Partial<SedeTarget>) => {
      if (!user?.sede) throw new Error("User sede not found");
      
      const allTargets = await getSheetData<SedeTarget>(SHEETS.sede_targets);
      const existing = allTargets.find(t => 
        t.sede === user.sede && 
        Number(t.month) === currentMonth && 
        Number(t.year) === currentYear
      );

      if (existing) {
        const rowIndex = await findRowIndex(SHEETS.sede_targets, existing.id);
        if (rowIndex) {
          await updateRow(SHEETS.sede_targets, rowIndex, {
            ...updates,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        const id = crypto.randomUUID();
        const nowStr = new Date().toISOString();
        const newTarget: SedeTarget = {
          ...DEFAULT_TARGETS,
          ...updates,
          id,
          sede: user.sede,
          month: currentMonth,
          year: currentYear,
          created_at: nowStr,
          updated_at: nowStr,
        } as SedeTarget;
        await appendRow(SHEETS.sede_targets, newTarget);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Obiettivi aggiornati");
    },
  });

  return {
    targets,
    isLoading,
    updateTargets: updateTargetsMutation.mutate,
  };
}
