import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { createTestQueryClient } from './test-query-client';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// DndContext wrapper for tests
const TestDndContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  return (
    <DndContext sensors={sensors}>
      {children}
    </DndContext>
  );
};

export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestDndContextProvider>
          {children}
        </TestDndContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
