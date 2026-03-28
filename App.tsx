import React from 'react';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { LocalizationProvider } from './src/contexts/LocalizationContext';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <LocalizationProvider>
      <DatabaseProvider>
        <HomeScreen />
      </DatabaseProvider>
    </LocalizationProvider>
  );
}