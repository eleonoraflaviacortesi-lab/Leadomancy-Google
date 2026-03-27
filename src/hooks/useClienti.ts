import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { Cliente, ClienteStatus, ClienteFilters } from "@/src/types";
import { 
  getSheetData, 
  appendRow, 
  updateRow, 
  deleteRow, 
  findRowIndex, 
  SHEETS 
} from "@/src/lib/googleSheets";

const ALL_STATUSES: ClienteStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

import { useClientKanbanColumns } from "./useClientKanbanColumns";

export function useClienti(options?: { filters?: ClienteFilters }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { columns } = useClientKanbanColumns();
  const queryKey = ['clienti', user?.user_id];

  const { data: clienti = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.user_id) return [];
      const data = await getSheetData<Cliente>(SHEETS.clienti);
      
      return data
        .filter(c => c.user_id === user.user_id)
        .map(c => ({
          ...c,
          regioni: Array.isArray(c.regioni) ? c.regioni : [],
          motivo_zona: Array.isArray(c.motivo_zona) ? c.motivo_zona : [],
          tipologia: Array.isArray(c.tipologia) ? c.tipologia : [],
          contesto: Array.isArray(c.contesto) ? c.contesto : [],
          comments: Array.isArray(c.comments) ? c.comments : [],
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
    enabled: !!user?.sede,
  });

  const filteredClienti = useMemo(() => {
    if (!options?.filters) return clienti;
    const { search, portale, regione, ref_number, status, assigned_to } = options.filters;

    return clienti.filter(c => {
      if (search) {
        const s = search.toLowerCase();
        const matches = 
          c.nome?.toLowerCase().includes(s) || 
          c.cognome?.toLowerCase().includes(s) || 
          c.telefono?.toLowerCase().includes(s) || 
          c.paese?.toLowerCase().includes(s) || 
          c.ref_number?.toLowerCase().includes(s) || 
          c.email?.toLowerCase().includes(s);
        if (!matches) return false;
      }
      if (portale && c.portale !== portale) return false;
      if (regione && !c.regioni?.includes(regione)) return false;
      if (ref_number && c.ref_number !== ref_number) return false;
      if (status && c.status !== status) return false;
      if (assigned_to && c.assigned_to !== assigned_to) return false;
      return true;
    });
  }, [clienti, options?.filters]);

  const clientiByStatus = useMemo(() => {
    const groups: Record<string, Cliente[]> = {};
    columns.forEach(col => {
      groups[col.key] = filteredClienti.filter(c => c.status === col.key);
    });
    // Handle any statuses not in the current columns
    filteredClienti.forEach(c => {
      if (!columns.find(col => col.key === c.status)) {
        if (!groups[c.status]) groups[c.status] = [];
        groups[c.status].push(c);
      }
    });
    return groups;
  }, [filteredClienti, columns]);

  const addClienteMutation = useMutation({
    mutationFn: async (newCliente: Partial<Cliente>) => {
      if (!user) throw new Error("User not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const cliente: Cliente = {
        ...newCliente,
        id,
        user_id: user?.user_id || user?.id,
        assigned_to: user.user_id,
        sede: user?.sede || 'Firenze',
        created_at: now,
        updated_at: now,
        display_order: (clienti.length || 0) + 1,
        status: newCliente.status || 'new',
        regioni: newCliente.regioni || [],
        motivo_zona: newCliente.motivo_zona || [],
        tipologia: newCliente.tipologia || [],
        contesto: newCliente.contesto || [],
        comments: [],
      } as Cliente;

      await appendRow(SHEETS.clienti, cliente);
      return cliente;
    },
    onMutate: async (newCliente) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any[] = []) => [...old, {
        ...newCliente,
        id: crypto.randomUUID(),
        user_id: user?.user_id || user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments: [],
        regioni: newCliente.regioni || [],
        motivo_zona: newCliente.motivo_zona || [],
        tipologia: newCliente.tipologia || [],
        contesto: newCliente.contesto || [],
        status: newCliente.status || 'new',
        display_order: (old?.length || 0) + 1,
      }]);

      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Errore durante il salvataggio');
    },
    onSuccess: () => {
      toast.success("Cliente aggiunto");
    },
    onSettled: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey }), 2000);
    },
  });

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, silent, ...updates }: Partial<Cliente> & { id: string; silent?: boolean }) => {
      const rowIndex = await findRowIndex(SHEETS.clienti, id);
      if (!rowIndex) throw new Error("Cliente non trovato");
      
      const finalUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      await updateRow(SHEETS.clienti, rowIndex, finalUpdates);
      return { id, silent };
    },
    onMutate: async ({ id, silent, ...updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousClienti = queryClient.getQueryData<Cliente[]>(queryKey);
      
      queryClient.setQueryData<Cliente[]>(queryKey, (old) => 
        old?.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c)
      );
      
      return { previousClienti, silent };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousClienti);
      toast.error("Errore durante il salvataggio");
    },
    onSuccess: (data, variables, context) => {
      if (!context?.silent) {
        toast.success("Salvato");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('Eliminare questo buyer?')) {
        throw new Error('Eliminazione annullata');
      }
      const rowIndex = await findRowIndex(SHEETS.clienti, id);
      if (!rowIndex) throw new Error("Cliente non trovato");
      await deleteRow(SHEETS.clienti, rowIndex);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousClienti = queryClient.getQueryData<Cliente[]>(queryKey);
      queryClient.setQueryData<Cliente[]>(queryKey, (old) => old?.filter(c => c.id !== id));
      return { previousClienti };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(queryKey, context?.previousClienti);
      toast.error("Errore durante l'eliminazione");
    },
    onSuccess: () => {
      toast.success("Buyer eliminato");
    },
    onSettled: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey }), 2000);
    },
  });

  const reorderClientiMutation = useMutation({
    mutationFn: async (reordered: Cliente[]) => {
      reordered.forEach(async (c) => {
        const rowIndex = await findRowIndex(SHEETS.clienti, c.id);
        if (rowIndex) {
          updateRow(SHEETS.clienti, rowIndex, { display_order: c.display_order });
        }
      });
    },
    onMutate: async (reordered) => {
      await queryClient.cancelQueries({ queryKey });
      const previousClienti = queryClient.getQueryData<Cliente[]>(queryKey);
      queryClient.setQueryData<Cliente[]>(queryKey, reordered);
      return { previousClienti };
    },
    onError: (err, reordered, context) => {
      queryClient.setQueryData(queryKey, context?.previousClienti);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    clienti,
    filteredClienti,
    clientiByStatus,
    isLoading,
    addCliente: addClienteMutation.mutate,
    updateCliente: updateClienteMutation.mutate,
    deleteCliente: deleteClienteMutation.mutate,
    reorderClienti: reorderClientiMutation.mutate,
  };
}
