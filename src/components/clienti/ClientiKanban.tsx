import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Cliente, ClienteStatus } from "@/src/types";
import { useClienti } from "@/src/hooks/useClienti";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { ClienteCard } from "./ClienteCard";
import { CLIENTE_STATUS_CONFIG } from "./clienteFormOptions";
import { cn } from "@/src/lib/utils";

interface ClientiKanbanProps {
  onClienteClick: (cliente: Cliente) => void;
  onQuickAdd: (status: ClienteStatus) => void;
}

const KANBAN_COLUMNS: ClienteStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export const ClientiKanban: React.FC<ClientiKanbanProps> = ({ onClienteClick, onQuickAdd }) => {
  const { clientiByStatus, updateCliente, reorderClienti } = useClienti();
  const { pushAction } = useUndoRedo();

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as ClienteStatus;
    const destStatus = destination.droppableId as ClienteStatus;

    const sourceItems = [...(clientiByStatus[sourceStatus] || [])];
    const destItems = source.droppableId === destination.droppableId 
      ? sourceItems 
      : [...(clientiByStatus[destStatus] || [])];

    const [movedItem] = sourceItems.splice(source.index, 1);
    
    if (source.droppableId !== destination.droppableId) {
      const oldStatus = movedItem.status;
      movedItem.status = destStatus;
      
      updateCliente({ id: draggableId, status: destStatus, silent: true });
      
      pushAction({
        type: 'UPDATE_CLIENTE',
        payload: { id: draggableId, status: destStatus },
        undo: async () => updateCliente({ id: draggableId, status: oldStatus as ClienteStatus }),
        redo: async () => updateCliente({ id: draggableId, status: destStatus })
      });
    }

    destItems.splice(destination.index, 0, movedItem);

    const updatedItems = destItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));

    reorderClienti(updatedItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full min-h-[500px]">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            clienti={clientiByStatus[status] || []}
            onClienteClick={onClienteClick}
            onQuickAdd={() => onQuickAdd(status)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

interface KanbanColumnProps {
  status: ClienteStatus;
  clienti: Cliente[];
  onClienteClick: (cliente: Cliente) => void;
  onQuickAdd: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, clienti, onClienteClick, onQuickAdd }) => {
  const statusConfig = CLIENTE_STATUS_CONFIG[status];

  return (
    <div className="flex flex-col min-w-[210px] w-[210px] bg-[var(--bg-subtle)] rounded-[12px] p-2 h-full">
      <div 
        className="pt-2 pb-1.5 px-1 flex items-center justify-between border-t-[3px]"
        style={{ borderTopColor: statusConfig.color }}
      >
        <span className="font-outfit font-semibold text-[11px] uppercase tracking-[0.07em] text-[var(--text-secondary)]">
          {statusConfig.label}
        </span>
        <div className="bg-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-outfit font-semibold text-[10px] text-[var(--text-secondary)] shadow-sm">
          {clienti.length}
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 flex flex-col gap-1.5 mt-2 transition-colors duration-150 rounded-lg",
              snapshot.isDraggingOver && "bg-black/5"
            )}
          >
            {clienti.map((cliente, index) => (
              /* @ts-ignore */
              <Draggable key={cliente.id} draggableId={cliente.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <ClienteCard
                      cliente={cliente}
                      onClick={onClienteClick}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button
        onClick={onQuickAdd}
        className="mt-2 w-7 h-7 flex items-center justify-center bg-white border border-[var(--border-light)] rounded-full text-[var(--text-muted)] hover:bg-black/5 transition-colors self-center"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
