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
      
      const uniqueNotizie: Notizia[] = [];
      const seenIds = new Set<string>();
      
      data.forEach(n => {
        const mapped: any = { ...n };
        const id = String(mapped.id || mapped.ID || '');
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          
          if (mapped.Nome !== undefined) mapped.nome = mapped.Nome;
          if (mapped.Cognome !== undefined) mapped.cognome = mapped.Cognome;
          if (mapped.Email !== undefined) mapped.email = mapped.Email;
          if (mapped.Telefono !== undefined) mapped.telefono = mapped.Telefono;
          if (mapped.Citta !== undefined) mapped.citta = mapped.Citta;
          if (mapped.Indirizzo !== undefined) mapped.indirizzo = mapped.Indirizzo;
          if (mapped.Zona !== undefined) mapped.zona = mapped.Zona;
          if (mapped.Provincia !== undefined) mapped.provincia = mapped.Provincia;
          if (mapped.Prezzo !== undefined) mapped.prezzo_richiesto = mapped.Prezzo;
          
          uniqueNotizie.push({
            ...mapped,
            id,
            comments: Array.isArray(mapped.comments) ? mapped.comments : [],
            is_online: Boolean(mapped.is_online),
          } as Notizia);
        }
      });

      return uniqueNotizie
        .filter(n => {
          if (user.role === 'coordinatore' || user.role === 'admin') {
            const supervisedSedi = user.sedi || [user.sede];
            return supervisedSedi.includes(n.sede) || n.user_id === user.user_id;
          }
          return n.user_id === user.user_id;
        })
        .sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return (a.display_order || 0) - (b.display_order || 0);
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      }, 10000);
    },
  });

  const updateNotiziaMutation = useMutation({
    mutationFn: async ({ id, silent, ...updates }: Partial<Notizia> & { id: string; silent?: boolean }) => {
      console.log("[useNotizie] Updating notizia:", id, updates);
      try {
        const rowIndex = await findRowIndex(SHEETS.notizie, id);
        console.log("[useNotizie] Row index found:", rowIndex);
        if (!rowIndex) throw new Error("Notizia non trovata");
        
        const finalUpdates: any = {
          ...updates,
          updated_at: new Date().toISOString(),
        };
        
        // Compatibility mapping
        if (finalUpdates.name !== undefined) {
          finalUpdates.nome = finalUpdates.name;
          finalUpdates.Nome = finalUpdates.name;
        }
        if (finalUpdates.nome !== undefined) {
          finalUpdates.Nome = finalUpdates.nome;
        }
        if (finalUpdates.prezzo_richiesto !== undefined) {
          finalUpdates.prezzo = finalUpdates.prezzo_richiesto;
          finalUpdates.Prezzo = finalUpdates.prezzo_richiesto;
        }
        if (finalUpdates.prezzo !== undefined) {
          finalUpdates.Prezzo = finalUpdates.prezzo;
        }
        if (finalUpdates.telefono !== undefined) {
          finalUpdates.Telefono = finalUpdates.telefono;
        }
        if (finalUpdates.email !== undefined) {
          finalUpdates.Email = finalUpdates.email;
        }
        if (finalUpdates.citta !== undefined) {
          finalUpdates.Citta = finalUpdates.citta;
        }
        if (finalUpdates.indirizzo !== undefined) {
          finalUpdates.Indirizzo = finalUpdates.indirizzo;
        }
        if (finalUpdates.zona !== undefined) {
          finalUpdates.Zona = finalUpdates.zona;
        }
        if (finalUpdates.provincia !== undefined) {
          finalUpdates.Provincia = finalUpdates.provincia;
        }
        
        console.log("[useNotizie] Final updates:", finalUpdates);
        
        await updateRow(SHEETS.notizie, rowIndex, finalUpdates);
        return { id, silent };
      } catch (error) {
        console.error("[useNotizie] Error updating row:", error);
        throw error;
      }
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
      }, 10000);
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
      }, 10000);
    },
  });

  const reorderNotizieMutation = useMutation({
    mutationFn: async (reordered: Notizia[]) => {
      // Only update items that actually changed their display_order or status
      const currentData = await getSheetData<Notizia>(SHEETS.notizie);
      const currentMap = new Map(currentData.map(n => [String(n.id), { order: n.display_order, status: n.status }]));

      await Promise.all(reordered.map(async (n) => {
        const current = currentMap.get(String(n.id));
        const hasOrderChanged = current?.order !== n.display_order;
        const hasStatusChanged = current?.status !== n.status;

        if (hasOrderChanged || hasStatusChanged) {
          const rowIndex = await findRowIndex(SHEETS.notizie, n.id);
          if (rowIndex) {
            await updateRow(SHEETS.notizie, rowIndex, { 
              display_order: n.display_order,
              status: n.status 
            });
          }
        }
      }));
    },
    onMutate: async (reordered) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotizie = queryClient.getQueryData<Notizia[]>(queryKey);
      
      queryClient.setQueryData<Notizia[]>(queryKey, (old = []) => {
        const reorderedIds = new Set(reordered.map(n => n.id));
        const otherNotizie = old.filter(n => !reorderedIds.has(n.id));
        return [...otherNotizie, ...reordered].sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return (a.display_order || 0) - (b.display_order || 0);
          }
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      });
      
      return { previousNotizie };
    },
    onError: (err, reordered, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotizie);
      toast.error("Errore durante il riordino");
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 10000);
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
