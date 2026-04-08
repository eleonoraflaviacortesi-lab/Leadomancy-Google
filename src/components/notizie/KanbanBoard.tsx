import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Pencil } from "lucide-react";
import { Notizia, NotiziaStatus } from "@/src/types";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { NotiziaCard } from "./NotiziaCard";
import { useKanbanColumns, KanbanColumn as ColumnType } from "@/src/hooks/useKanbanColumns";
import { cn } from "@/src/lib/utils";
import { EditColumnDialog } from "../dashboard/EditColumnDialog";

interface KanbanBoardProps {
  onNotiziaClick: (notizia: Notizia) => void;
  onQuickAdd: (status: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onNotiziaClick, onQuickAdd }) => {
  const { notizieByStatus, updateNotizia, deleteNotizia, reorderNotizie } = useNotizie();
  const { columns, updateColumn } = useKanbanColumns();
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

    const sourceStatus = source.droppableId as NotiziaStatus;
    const destStatus = destination.droppableId as NotiziaStatus;

    const sourceItems = [...(notizieByStatus[sourceStatus] || [])];
    const destItems = source.droppableId === destination.droppableId 
      ? sourceItems 
      : [...(notizieByStatus[destStatus] || [])];

    const movedItemIndex = sourceItems.findIndex(n => n.id === draggableId);
    if (movedItemIndex === -1) return;

    const [movedItem] = sourceItems.splice(movedItemIndex, 1);
    const updatedMovedItem = { ...movedItem, status: destStatus };
    
    // If moving to a different column
    if (source.droppableId !== destination.droppableId) {
      const oldStatus = movedItem.status;
      
      // Persist status change
      updateNotizia({ id: draggableId, status: destStatus, silent: true });
      
      // Undo/Redo action
      pushAction({
        type: 'UPDATE_NOTIZIA',
        payload: { id: draggableId, status: destStatus },
        undo: async () => updateNotizia({ id: draggableId, status: oldStatus as NotiziaStatus }),
        redo: async () => updateNotizia({ id: draggableId, status: destStatus })
      });

      destItems.splice(destination.index, 0, updatedMovedItem);
      
      const updatedSourceItems = sourceItems.map((item, index) => ({
        ...item,
        display_order: index + 1
      }));
      const updatedDestItems = destItems.map((item, index) => ({
        ...item,
        display_order: index + 1
      }));
      
      reorderNotizie([...updatedSourceItems, ...updatedDestItems]);
    } else {
      destItems.splice(destination.index, 0, updatedMovedItem);
      
      const updatedItems = destItems.map((item, index) => ({
        ...item,
        display_order: index + 1
      }));
      
      reorderNotizie(updatedItems);
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
              notizie={notizieByStatus[col.key] || []}
              onNotiziaClick={onNotiziaClick}
              onQuickAdd={() => onQuickAdd(col.key)}
              updateNotizia={updateNotizia}
              deleteNotizia={deleteNotizia}
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
  notizie: Notizia[];
  onNotiziaClick: (notizia: Notizia) => void;
  onQuickAdd: () => void;
  updateNotizia: any;
  deleteNotizia: any;
  onEdit: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, 
  notizie, 
  onNotiziaClick, 
  onQuickAdd,
  updateNotizia,
  deleteNotizia,
  onEdit
}) => {
  const statusColor = column.color;

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] flex-shrink-0 h-full">
      {/* Header */}
      <div 
        className="h-[40px] flex items-center justify-between gap-2 px-1 pb-3 mb-3 border-b-2 group"
        style={{ borderBottomColor: statusColor }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
          <span className="font-outfit font-bold text-[11px] uppercase tracking-[0.12em] text-[var(--text-primary)] truncate">
            {column.label}
          </span>
          <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded">
            <Pencil size={10} className="text-[var(--text-muted)]" />
          </button>
          <div className="bg-[var(--bg-subtle)] px-[7px] py-[1px] rounded-full flex items-center justify-center font-outfit font-semibold text-[11px] text-[var(--text-muted)]">
            {notizie.length}
          </div>
        </div>
        <button 
          onClick={onQuickAdd}
          className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--border-light)] transition-colors flex-shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.key} type="NOTIZIA">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 flex flex-col gap-2 transition-colors duration-150 min-h-[150px] overflow-y-auto overflow-x-hidden px-1",
              snapshot.isDraggingOver && "bg-black/5 rounded-xl"
            )}
          >
            {notizie.map((notizia, index) => (
              <Draggable key={notizia.id} draggableId={notizia.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <NotiziaCard
                      notizia={notizia}
                      onClick={() => onNotiziaClick(notizia)}
                      onStatusChange={(id, status) => updateNotizia({ id, status: status as any })}
                      onEmojiChange={(id, emoji) => {
                        console.log('onEmojiChange called:', id, emoji);
                        updateNotizia({ id, emoji });
                      }}
                      onColorChange={(id, card_color) => updateNotizia({ id, card_color })}
                      onUpdate={(id, updates) => updateNotizia({ id, ...updates, silent: true })}
                      onDelete={(id) => {
                        deleteNotizia(id);
                      }}
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
