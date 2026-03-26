import { useState, useEffect } from 'react';

export type ColumnType = 'text' | 'number' | 'status' | 'boolean' | 'dropdown' | 'url' | 'checkbox';

interface ColumnOverride {
  type: ColumnType;
  options?: string[];
}

export function useColumnTypeOverrides(sheetId: string) {
  const [overrides, setOverrides] = useState<Record<string, ColumnOverride>>({});

  useEffect(() => {
    const saved = localStorage.getItem(`col-type-overrides-${sheetId}`);
    if (saved) {
      try {
        setOverrides(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse column type overrides', e);
      }
    }
  }, [sheetId]);

  const updateOverride = (columnKey: string, override: ColumnOverride) => {
    const newOverrides = { ...overrides, [columnKey]: override };
    setOverrides(newOverrides);
    localStorage.setItem(`col-type-overrides-${sheetId}`, JSON.stringify(newOverrides));
  };

  return { overrides, updateOverride };
}
