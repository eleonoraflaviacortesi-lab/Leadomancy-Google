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
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId as ClienteStatus;
    const destStatus = destination.droppableId as ClienteStatus;
    const isSameColumn = source.droppableId === destination.droppableId;

    const sourceItems = [...(clientiByStatus[sourceStatus] || [])];
    const destItems = isSameColumn ? sourceItems : [...(clientiByStatus[destStatus] || [])];

    const [movedItem] = sourceItems.splice(source.index, 1);

    if (!isSameColumn) {
      const oldStatus = movedItem.status;
      movedItem.status = destStatus;
      updateCliente({ id: draggableId, status: destStatus, silent: true });
      pushAction({
        type: 'UPDATE_CLIENTE',
        payload: { id: draggableId, status: destStatus },
        undo: async () => updateCliente({ id: draggableId, status: oldStatus as ClienteStatus }),
        redo: async () => updateCliente({ id: draggableId, status: destStatus })
      });
      destItems.splice(destination.index, 0, movedItem);
      const updatedSource = sourceItems.map((item, i) => ({ ...item, display_order: i + 1 }));
      const updatedDest = destItems.map((item, i) => ({ ...item, display_order: i + 1 }));
      reorderClienti([...updatedSource, ...updatedDest]);
    } else {
      sourceItems.splice(destination.index, 0, movedItem);
      const updated = sourceItems.map((item, i) => ({ ...item, display_order: i + 1 }));
      reorderClienti(updated);
    }
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
    <div className="flex flex-col w-[238px] flex-shrink-0 h-full">
      {/* Header — identical to notizie */}
      <div
        className="h-[40px] flex items-center justify-between gap-2 px-1 pb-3 mb-3 border-b-2 group"
        style={{ borderBottomColor: statusColor }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="w-[10px] h-[10px] rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span className="font-outfit font-bold text-[11px] uppercase tracking-[0.12em] text-[var(--text-primary)] truncate">
            {column.label}
          </span>
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded"
          >
            <Pencil size={10} className="text-[var(--text-muted)]" />
          </button>
          <div className="bg-[var(--bg-subtle)] px-[7px] py-[1px] rounded-full flex items-center justify-center font-outfit font-semibold text-[11px] text-[var(--text-muted)]">
            {clienti.length}
          </div>
        </div>
        <button
          onClick={onQuickAdd}
          className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--border-light)] transition-colors flex-shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.key} type="CLIENTE">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 flex flex-col gap-2 transition-colors duration-150",
              snapshot.isDraggingOver && "bg-black/5 rounded-xl"
            )}
          >
            {clienti.map((cliente, index) => (
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
    </div>
  );
};
