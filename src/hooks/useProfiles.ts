import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Profile } from "@/src/types";
import { 
  getSheetData, 
  updateRow, 
  findRowIndex, 
  SHEETS 
} from "@/src/lib/googleSheets";

export function useProfiles() {
  const queryClient = useQueryClient();
  const queryKey = ['profiles'];

  const { data: profiles = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      return await getSheetData<Profile>(SHEETS.users);
    },
    staleTime: 1000 * 60 * 10,
  });

  const getProfileByUserId = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string, updates: Partial<Profile> }) => {
      const profile = profiles.find(p => p.user_id === userId);
      if (!profile) throw new Error("Profilo non trovato");
      
      const rowIndex = await findRowIndex(SHEETS.users, profile.id);
      if (!rowIndex) throw new Error("Profilo non trovato nel foglio");
      
      await updateRow(SHEETS.users, rowIndex, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Profilo aggiornato");
    },
  });

  return {
    profiles,
    isLoading,
    getProfileByUserId,
    updateProfile: updateProfileMutation.mutate,
  };
}
