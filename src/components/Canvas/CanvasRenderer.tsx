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

  useEffect(() => {
    if (!currentCanvasPath) return;

    const loadCanvasData = async () => {
      setIsLoading(true);
      const url = getFileUrl(currentCanvasPath);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fichier introuvable");
        const canvasData = await response.json();
        const { nodes: parsedNodes, edges: parsedEdges } = parseCanvas(canvasData);
        
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } catch (e) {
        console.error("Erreur lors du chargement du .canvas", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvasData();
  }, [currentCanvasPath, getFileUrl, setNodes, setEdges]);

  return (
    <div className="w-full h-screen bg-[#0b0e14]">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm font-mono text-accent-green animate-pulse">
          SYNCHRONISATION DU VAULT...
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={true} // Draggable pour l'expérience mais non sauvegardé
        nodesConnectable={false}
        elementsSelectable={true}
        colorMode="dark"
      >
        <Background color="#222" gap={20} patternColor="#333" />
        <Controls />
        <MiniMap 
          style={{ backgroundColor: '#161b22' }} 
          nodeColor={(n) => (n.data?.color as string) || '#333'} 
          maskColor="rgba(0,0,0,0.5)"
        />
        
        <Panel position="top-left" className="m-4">
          <div className="bg-[#161b22] border border-gray-800 p-3 rounded-lg shadow-2xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <a href="/" className="text-gray-400 hover:text-accent-green transition-colors text-lg">🏠</a>
              <span className="text-xs font-bold text-accent-green uppercase tracking-widest">{currentCanvasPath?.split('/').pop()}</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};
