import { create } from 'zustand';

interface VaultState {
  vaultRoot: string;
  currentCanvasPath: string | null;
  setCurrentCanvas: (path: string | null) => void;
  // Fonction pour obtenir l'URL d'un fichier dans le vault
  getFileUrl: (path: string) => string;
}

export const useVaultStore = create<VaultState>((set) => ({
  vaultRoot: '/vault/', // Racine statique dans le dossier public
  currentCanvasPath: 'Main-Web_MindMap_Recipes_Full.canvas', // Chargement auto

  setCurrentCanvas: (path) => set({ currentCanvasPath: path }),
  
  getFileUrl: (path) => {
    // Nettoyage du chemin (Obsidian utilise parfois des chemins relatifs complexes)
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/vault/${cleanPath}`;
  }
}));
