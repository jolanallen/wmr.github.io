import React, { useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useVaultStore } from '../../store/useVaultStore';
import { parseCanvas } from '../../utils/canvasParser';
import { ObsidianTextNode, ObsidianFileNode, ObsidianGroupNode } from './Nodes/ObsidianNodes';

const nodeTypes = {
  obsidianText: ObsidianTextNode,
  obsidianFile: ObsidianFileNode,
  obsidianGroup: ObsidianGroupNode,
};

export const CanvasRenderer: React.FC = () => {
  const { currentCanvasPath, getFileUrl } = useVaultStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("CanvasRenderer: Attempting to load", currentCanvasPath);
    if (!currentCanvasPath) return;

    const loadCanvasData = async () => {
      setIsLoading(true);
      setError(null);
      const url = getFileUrl(currentCanvasPath);

      try {
        console.log("Fetching canvas from:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fichier introuvable (${response.status})`);
        
        const canvasData = await response.json();
        console.log("Canvas data loaded, parsing...");
        const { nodes: parsedNodes, edges: parsedEdges } = parseCanvas(canvasData);
        
        console.log(`Parsed ${parsedNodes.length} nodes and ${parsedEdges.length} edges`);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } catch (e: any) {
        console.error("Erreur lors du chargement du .canvas", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvasData();
  }, [currentCanvasPath, getFileUrl, setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0b0e14' }}>
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm font-mono text-accent-green animate-pulse">
          CHARGEMENT DE LA MINDMAP...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/20 backdrop-blur-md">
          <div className="bg-[#161b22] p-8 border border-red-500 rounded-lg text-center max-w-md">
            <h2 className="text-red-500 text-xl font-bold mb-4">Erreur de chargement</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        colorMode="dark"
      >
        <Background color="#222" gap={20} />
        <Controls />
        <MiniMap 
          style={{ backgroundColor: '#161b22' }} 
          nodeColor={(n) => (n.data?.color as string) || '#333'} 
          maskColor="rgba(0,0,0,0.5)"
        />
        
        <Panel position="top-left" className="m-4">
          <div className="bg-[#161b22] border border-gray-800 p-3 rounded-lg shadow-2xl flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-accent-green transition-colors text-lg" title="Retour à l'accueil">🏠</a>
            <div className="h-4 w-[1px] bg-gray-700" />
            <span className="text-xs font-bold text-accent-green uppercase tracking-widest truncate max-w-[200px]">
              {currentCanvasPath?.split('/').pop()}
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};
