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
      const allProfiles = await getSheetData<Profile>(SHEETS.users);
      const profile = allProfiles.find(p => 
        p.user_id === userId || p.id === userId
      );
      if (!profile) throw new Error('Profilo non trovato');
      
      let rowIndex = await findRowIndex(SHEETS.users, profile.id);
      if (!rowIndex) {
        rowIndex = await findRowIndex(SHEETS.users, userId);
      }
      if (!rowIndex) throw new Error('Riga profilo non trovata nel foglio');
      
      await updateRow(SHEETS.users, rowIndex, updates);
      return { ...profile, ...updates };
    },
    onSuccess: (updatedProfile) => {
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
