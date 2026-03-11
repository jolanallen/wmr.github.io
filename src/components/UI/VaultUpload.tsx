import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FolderUp } from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';

export const VaultUpload: React.FC = () => {
  const setVault = useVaultStore((state) => state.setVault);
  const setCurrentCanvas = useVaultStore((state) => state.setCurrentCanvas);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const fileMap = new Map<string, File>();
    const canvasPaths: string[] = [];

    Array.from(fileList).forEach((file) => {
      // webkitRelativePath contient le chemin complet depuis la racine du dossier uploadé
      const path = file.webkitRelativePath || file.name;
      
      // On ignore les dossiers cachés d'Obsidian ou Git pour économiser la mémoire
      if (path.includes('/.obsidian/') || path.includes('/.git/')) return;

      fileMap.set(path, file);

      if (path.endsWith('.canvas')) {
        canvasPaths.push(path);
      }
    });

    if (canvasPaths.length === 0) {
      alert("Aucun fichier .canvas n'a été trouvé dans ce dossier.");
      return;
    }

    setVault(fileMap, canvasPaths);
    
    // Auto-load du canvas "Main" ou du premier trouvé
    const mainCanvas = canvasPaths.find(p => p.toLowerCase().includes('main')) || canvasPaths[0];
    setCurrentCanvas(mainCanvas);

  }, [setVault, setCurrentCanvas]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Note: L'API DataTransferItem (drag & drop de dossier) est complexe car asynchrone
    // Pour assurer une compatibilité maximale et récupérer tous les fichiers récursivement,
    // on incite l'utilisateur à utiliser le bouton `<input type="file" webkitdirectory />`.
    // Si des fichiers simples sont droppés, on les traite quand même (au cas où il a pris tous les fichiers).
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center w-full h-screen transition-colors duration-300 ${isDragging ? 'bg-[#161b22]' : 'bg-[#0b0e14]'} text-white p-10`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`max-w-2xl w-full border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${isDragging ? 'border-accent-green bg-[rgba(0,255,157,0.05)] scale-105' : 'border-gray-700 bg-[#161b22] hover:border-gray-500'}`}>
        
        <div className="flex justify-center mb-6 text-accent-green">
          {isDragging ? <UploadCloud size={80} /> : <FolderUp size={80} />}
        </div>
        
        <h1 className="text-4xl font-bold mb-4 font-mono text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-white">
          WMR Interactive Engine
        </h1>
        
        <p className="text-gray-400 mb-10 text-lg">
          Glissez-déposez votre dossier complet <strong>Vault Obsidian</strong> ici.<br/>
          <span className="text-sm mt-2 inline-block px-3 py-1 bg-[rgba(255,255,255,0.05)] rounded-md">
            100% Client-Side. Aucun fichier n'est envoyé sur un serveur.
          </span>
        </p>
        
        <input
          type="file"
          // @ts-ignore - webkitdirectory est supporté par la majorité des navigateurs
          webkitdirectory="true"
          directory=""
          multiple
          className="hidden"
          ref={inputRef}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        
        <button 
          onClick={() => inputRef.current?.click()}
          className="bg-accent-green text-[#05070a] font-bold py-4 px-10 rounded-lg hover:shadow-[0_0_30px_rgba(0,255,157,0.4)] transition-all uppercase tracking-wider text-lg"
        >
          Sélectionner le dossier Vault
        </button>
      </div>
      
      <div className="mt-8 text-sm text-gray-600 font-mono italic text-center">
        Propulsé par React Flow & Vite<br/>
        Supporte les fichiers .canvas et .md
      </div>
    </div>
  );
};
