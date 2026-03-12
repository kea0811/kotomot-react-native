import { useContext } from 'react';
import { KotoContext } from './KotoProvider';
import { KotoContextType } from './types';

export const useKoto = (): KotoContextType => {
  const context = useContext(KotoContext);

  if (context === undefined) {
    throw new Error('useKoto must be used within a KotoProvider');
  }

  return context;
};