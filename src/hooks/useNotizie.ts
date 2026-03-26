import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { Notizia, NotiziaStatus } from "@/src/types";
import { 
  getSheetData, 
  appendRow, 
  updateRow, 
  deleteRow, 
  findRowIndex, 
  SHEETS 
} from "@/src/lib/googleSheets";

const ALL_STATUSES: NotiziaStatus[] = ['new', 'in_progress', 'done', 'on_shot', 'taken', 'credit', 'no', 'sold'];

import { useKanbanColumns } from "./useKanbanColumns";

export function useNotizie() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { columns } = useKanbanColumns();
  const queryKey = ['notizie', user?.user_id];

  const { data: notizie = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      console.log('Current user.user_id:', user?.user_id);
      const data = await getSheetData<Notizia>(SHEETS.notizie);
      console.log('All notizie from sheet after refetch:', data.map(n => n.user_id));
      
      return data
        .filter(n => {
          const match = n.user_id === user.user_id;
          return match;
        })
        .map(n => ({
          ...n,
          comments: Array.isArray(n.comments) ? n.comments : [],
          is_online: Boolean(n.is_online),
        }))
        .sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return (a.display_order || 0) - (b.display_order || 0);
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 30000, // 30 seconds
    enabled: !!user,
  });

  const notizieByStatus = useMemo(() => {
    const groups: Record<string, Notizia[]> = {};
    columns.forEach(col => {
      groups[col.key] = notizie.filter(n => n.status === col.key);
    });
    // Handle any statuses not in the current columns (e.g. legacy or custom from sheet)
    notizie.forEach(n => {
      if (!columns.find(c => c.key === n.status)) {
        if (!groups[n.status]) groups[n.status] = [];
        groups[n.status].push(n);
      }
    });
    return groups;
  }, [notizie, columns]);

  const addNotiziaMutation = useMutation({
    mutationFn: async (newNotizia: Partial<Notizia>) => {
      if (!user) throw new Error("User not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const noticia: Notizia = {
        ...newNotizia,
        id,
        user_id: user.user_id,
        created_at: now,
        updated_at: now,
        display_order: notizie.length + 1,
        comments: [],
        is_online: false,
        status: newNotizia.status || 'new',
      } as Notizia;

      await appendRow(SHEETS.notizie, noticia);
      return noticia;
    },
    onMutate: async (newNotizia) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Notizia[]>(queryKey);
      
      queryClient.setQueryData<Notizia[]>(queryKey, (old: Notizia[] = []) => [
        ...old,
        { 
          ...newNotizia, 
          id: newNotizia.id || crypto.randomUUID(), 
          user_id: user?.user_id,
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(), 
          comments: [], 
          is_online: false, 
          display_order: old.length + 1 
        } as Notizia
      ]);
      
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Errore durante l'aggiunta della notizia");
    },
    onSuccess: (newNotizia) => {
      console.log('New notizia user_id being set:', newNotizia.user_id);
      toast.success("Notizia aggiunta");
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
  });

  const updateNotiziaMutation = useMutation({
    mutationFn: async ({ id, silent, ...updates }: Partial<Notizia> & { id: string; silent?: boolean }) => {
      const rowIndex = await findRowIndex(SHEETS.notizie, id);
      if (!rowIndex) throw new Error("Notizia non trovata");
      
      const finalUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      await updateRow(SHEETS.notizie, rowIndex, finalUpdates);
      return { id, silent };
    },
    onMutate: async ({ id, silent, ...updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotizie = queryClient.getQueryData<Notizia[]>(queryKey);
      
      queryClient.setQueryData<Notizia[]>(queryKey, (old) => 
        old?.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)
      );
      
      return { previousNotizie, silent };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotizie);
      toast.error("Errore durante il salvataggio");
    },
    onSuccess: (data, variables, context) => {
      if (!context?.silent) {
        toast.success("Salvato");
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
  });

  const deleteNotiziaMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('Eliminare questa notizia?')) {
        throw new Error('Eliminazione annullata');
      }
      const rowIndex = await findRowIndex(SHEETS.notizie, id);
      if (!rowIndex) throw new Error("Notizia non trovata");
      await deleteRow(SHEETS.notizie, rowIndex);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotizie = queryClient.getQueryData<Notizia[]>(queryKey);
      queryClient.setQueryData<Notizia[]>(queryKey, (old) => old?.filter(n => n.id !== id));
      return { previousNotizie };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotizie);
      toast.error("Errore durante l'eliminazione");
    },
    onSuccess: () => {
      toast.success("Notizia eliminata");
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
  });

  const reorderNotizieMutation = useMutation({
    mutationFn: async (reordered: Notizia[]) => {
      // Background updates for each changed display_order
      reordered.forEach(async (n) => {
        const rowIndex = await findRowIndex(SHEETS.notizie, n.id);
        if (rowIndex) {
          updateRow(SHEETS.notizie, rowIndex, { display_order: n.display_order });
        }
      });
    },
    onMutate: async (reordered) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotizie = queryClient.getQueryData<Notizia[]>(queryKey);
      queryClient.setQueryData<Notizia[]>(queryKey, reordered);
      return { previousNotizie };
    },
    onError: (err, reordered, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotizie);
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);
    },
  });

  return {
    notizie,
    notizieByStatus,
    isLoading,
    addNotizia: addNotiziaMutation.mutate,
    updateNotizia: updateNotiziaMutation.mutate,
    deleteNotizia: deleteNotiziaMutation.mutate,
    reorderNotizie: reorderNotizieMutation.mutate,
  };
}
