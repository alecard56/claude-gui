// File: src/utils/StoreContext.tsx
// Purpose: Provides a React context for accessing MobX stores
// Usage: Wraps the application to provide store access to all components
// Contains: React context creation and hook for accessing the store
// Dependencies: React, RootStore
// Iteration: 1

import React, { createContext, useContext } from 'react';
import { RootStore } from '../models/RootStore';

// Create the context with undefined as default value
const StoreContext = createContext<RootStore | undefined>(undefined);

// Provider component
export const StoreProvider: React.FC<{
  children: React.ReactNode;
  value: RootStore;
}> = ({ children, value }) => {
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

// Hook to use the store context
export const useStore = (): RootStore => {
  const context = useContext(StoreContext);
  
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  
  return context;
};