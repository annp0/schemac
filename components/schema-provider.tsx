'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type SchemaSelectionContextType = {
  selectedSchemaIds: string[];
  toggleSchemaSelection: (schemaId: string, selected: boolean) => void;
  clearSelectedSchemas: () => void;
  isSchemaSelected: (schemaId: string) => boolean;
};

const SchemaSelectionContext = createContext<SchemaSelectionContextType | undefined>(undefined);

export function SchemaSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedSchemaIds, setSelectedSchemaIds] = useState<string[]>([]);

  const toggleSchemaSelection = (schemaId: string, selected: boolean) => {
    setSelectedSchemaIds(prev => 
      selected 
        ? [...prev, schemaId]
        : prev.filter(id => id !== schemaId)
    );
  };

  const clearSelectedSchemas = () => {
    setSelectedSchemaIds([]);
  };

  const isSchemaSelected = (schemaId: string) => {
    return selectedSchemaIds.includes(schemaId);
  };

  return (
    <SchemaSelectionContext.Provider value={{
      selectedSchemaIds,
      toggleSchemaSelection,
      clearSelectedSchemas,
      isSchemaSelected
    }}>
      {children}
    </SchemaSelectionContext.Provider>
  );
}

export function useSchemaSelection() {
  const context = useContext(SchemaSelectionContext);
  if (context === undefined) {
    throw new Error('useSchemaSelection must be used within a SchemaSelectionProvider');
  }
  return context;
}