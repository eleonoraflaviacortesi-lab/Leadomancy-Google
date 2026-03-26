import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { UndoableAction } from "@/src/types";

interface UndoRedoContextType {
  pushAction: (action: UndoableAction) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

const MAX_ACTIONS = 20;

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);

  const pushAction = useCallback((action: UndoableAction) => {
    setUndoStack(prev => {
      const next = [...prev, action];
      if (next.length > MAX_ACTIONS) return next.slice(1);
      return next;
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    try {
      await action.undo();
      setRedoStack(prev => [...prev, action]);
    } catch (error) {
      console.error("Undo failed", error);
    }
  }, [undoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    try {
      await action.redo();
      setUndoStack(prev => [...prev, action]);
    } catch (error) {
      console.error("Redo failed", error);
    }
  }, [redoStack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <UndoRedoContext.Provider
      value={{
        pushAction,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
      }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (context === undefined) {
    throw new Error("useUndoRedo must be used within an UndoRedoProvider");
  }
  return context;
}
