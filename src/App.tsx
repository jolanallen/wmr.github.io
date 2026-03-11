import React from 'react';
import { CanvasRenderer } from './components/Canvas/CanvasRenderer';

const App: React.FC = () => {
  // L'application React ne gère QUE le rendu de la mindmap.
  // Elle charge automatiquement le fichier défini dans le store.
  return (
    <div className="w-full h-screen overflow-hidden">
      <CanvasRenderer />
    </div>
  );
};

export default App;
