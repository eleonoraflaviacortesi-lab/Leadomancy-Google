import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Pencil } from "lucide-react";
import { Cliente, ClienteStatus } from "@/src/types";
import { useClienti } from "@/src/hooks/useClienti";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { ClienteCard } from "./ClienteCard";
import { useClientKanbanColumns, KanbanColumn as ColumnType } from "@/src/hooks/useClientKanbanColumns";
import { cn } from "@/src/lib/utils";
import { EditColumnDialog } from "../dashboard/EditColumnDialog";

interface ClientiKanbanProps {
  onClienteClick: (cliente: Cliente) => void;
  onQuickAdd: (status: string) => void;
}

export const ClientiKanban: React.FC<ClientiKanbanProps> = ({ onClienteClick, onQuickAdd }) => {
  const { clientiByStatus, updateCliente, deleteCliente, reorderClienti } = useClienti();
  const { columns, updateColumn } = useClientKanbanColumns();
  const { pushAction } = useUndoRedo();
  const [editingColumn, setEditingColumn] = useState<ColumnType | null>(null);

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
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 h-full min-h-[500px]">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              clienti={clientiByStatus[col.key] || []}
              onClienteClick={onClienteClick}
              onQuickAdd={() => onQuickAdd(col.key)}
              updateCliente={updateCliente}
              deleteCliente={deleteCliente}
              onEdit={() => setEditingColumn(col)}
            />
          ))}
        </div>
      </DragDropContext>
      {editingColumn && (
        <EditColumnDialog
          isOpen={!!editingColumn}
          onClose={() => setEditingColumn(null)}
          column={editingColumn}
          onSave={(id, label, color) => updateColumn({ id, label, color })}
        />
      )}
    </>
  );
};

interface KanbanColumnProps {
  column: ColumnType;
  clienti: Cliente[];
  onClienteClick: (cliente: Cliente) => void;
  onQuickAdd: () => void;
  updateCliente: any;
  deleteCliente: any;
  onEdit: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  clienti, 
  onClienteClick, 
  onQuickAdd,
  updateCliente,
  deleteCliente,
  onEdit
}) => {
  const statusColor = column.color;

  return (
    <div className="flex flex-col min-w-[210px] w-[210px] bg-[var(--bg-subtle)] rounded-[12px] p-2 h-full">
      <div 
        className="pt-2 pb-1.5 px-1 flex items-center justify-between border-t-[3px] group"
        style={{ borderTopColor: statusColor }}
      >
        <div className="flex items-center gap-1">
          <span className="font-outfit font-semibold text-[11px] uppercase tracking-[0.07em] text-[var(--text-secondary)]">
            {column.label}
          </span>
          <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded">
            <Pencil size={10} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="bg-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-outfit font-semibold text-[10px] text-[var(--text-secondary)] shadow-sm">
          {clienti.length}
        </div>
      </div>

      <Droppable droppableId={column.key}>
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
                      onStatusChange={(id, status) => updateCliente({ id, status: status as any })}
                      onEmojiChange={(id, emoji) => updateCliente({ id, emoji })}
                      onColorChange={(id, card_color) => updateCliente({ id, card_color })}
                      onUpdate={(id, updates) => updateCliente({ id, ...updates, silent: true })}
                      onDelete={(id) => deleteCliente(id)}
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
