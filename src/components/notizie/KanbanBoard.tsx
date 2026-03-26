import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Notizia, NotiziaStatus } from "@/src/types";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useUndoRedo } from "@/src/hooks/useUndoRedo";
import { NotiziaCard } from "./NotiziaCard";
import { NOTIZIA_STATUSES, NOTIZIA_STATUS_LABELS, NOTIZIA_STATUS_COLORS } from "./notizieConfig";
import { cn } from "@/src/lib/utils";

interface KanbanBoardProps {
  onNotiziaClick: (notizia: Notizia) => void;
  onQuickAdd: (status: NotiziaStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onNotiziaClick, onQuickAdd }) => {
  const { notizieByStatus, updateNotizia, reorderNotizie } = useNotizie();
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

    const sourceStatus = source.droppableId as NotiziaStatus;
    const destStatus = destination.droppableId as NotiziaStatus;

    const sourceItems = [...(notizieByStatus[sourceStatus] || [])];
    const destItems = source.droppableId === destination.droppableId 
      ? sourceItems 
      : [...(notizieByStatus[destStatus] || [])];

    const [movedItem] = sourceItems.splice(source.index, 1);
    
    // If moving to a different column
    if (source.droppableId !== destination.droppableId) {
      const oldStatus = movedItem.status;
      movedItem.status = destStatus;
      
      // Persist status change
      updateNotizia({ id: draggableId, status: destStatus, silent: true });
      
      // Undo/Redo action
      pushAction({
        type: 'UPDATE_NOTIZIA',
        payload: { id: draggableId, status: destStatus },
        undo: async () => updateNotizia({ id: draggableId, status: oldStatus as NotiziaStatus }),
        redo: async () => updateNotizia({ id: draggableId, status: destStatus })
      });
    }

    destItems.splice(destination.index, 0, movedItem);

    // Update display_order for all items in affected columns
    const updatedItems = destItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));

    reorderNotizie(updatedItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full min-h-[500px]">
        {NOTIZIA_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            notizie={notizieByStatus[status] || []}
            onNotiziaClick={onNotiziaClick}
            onQuickAdd={() => onQuickAdd(status)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

interface KanbanColumnProps {
  status: NotiziaStatus;
  notizie: Notizia[];
  onNotiziaClick: (notizia: Notizia) => void;
  onQuickAdd: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, notizie, onNotiziaClick, onQuickAdd }) => {
  const statusColor = NOTIZIA_STATUS_COLORS[status];

  return (
    <div className="flex flex-col min-w-[210px] w-[210px] bg-[var(--bg-subtle)] rounded-[12px] p-2 h-full">
      {/* Header */}
      <div 
        className="pt-2 pb-1.5 px-1 flex items-center justify-between border-t-[3px]"
        style={{ borderTopColor: statusColor }}
      >
        <span className="font-outfit font-semibold text-[11px] uppercase tracking-[0.07em] text-[var(--text-secondary)]">
          {NOTIZIA_STATUS_LABELS[status]}
        </span>
        <div className="bg-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-outfit font-semibold text-[10px] text-[var(--text-secondary)] shadow-sm">
          {notizie.length}
        </div>
      </div>

      {/* Droppable Area */}
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
            {notizie.map((notizia, index) => (
              /* @ts-ignore */
              <Draggable key={notizia.id} draggableId={notizia.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <NotiziaCard
                      notizia={notizia}
                      onClick={onNotiziaClick}
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

      {/* Quick Add Footer */}
      <button
        onClick={onQuickAdd}
        className="mt-2 w-7 h-7 flex items-center justify-center bg-white border border-[var(--border-light)] rounded-full text-[var(--text-muted)] hover:bg-black/5 transition-colors self-center"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
