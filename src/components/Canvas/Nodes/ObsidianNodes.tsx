import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { useVaultStore } from '../../../store/useVaultStore';

// --- Types ---
interface ObsidianNodeData {
  label?: string;
  text?: string;
  file?: string;
  color?: string;
  width: number;
  height: number;
}

const NodeHandles = () => (
  <>
    <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Top} id="top" style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Right} id="right" style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Left} id="left" style={{ opacity: 0 }} />
  </>
);

export const ObsidianTextNode = ({ data }: NodeProps<any>) => {
  const nodeData = data as ObsidianNodeData;
  return (
    <div 
      className="h-full w-full bg-[#161b22] border-2 rounded-md p-4 overflow-auto shadow-xl text-sm prose prose-invert prose-green max-w-none scrollbar-hide"
      style={{ borderColor: nodeData.color || '#30363d' }}
    >
      <NodeHandles />
      <ReactMarkdown>{nodeData.text || ''}</ReactMarkdown>
    </div>
  );
};

export const ObsidianFileNode = ({ data }: NodeProps<any>) => {
  const nodeData = data as ObsidianNodeData;
  const getFileUrl = useVaultStore((state) => state.getFileUrl);
  const setCurrentCanvas = useVaultStore((state) => state.setCurrentCanvas);
  const [content, setContent] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  const fileUrl = nodeData.file ? getFileUrl(nodeData.file) : null;

  useEffect(() => {
    if (!fileUrl) return;
    
    const ext = nodeData.file?.toLowerCase().split('.').pop();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
      setIsImage(true);
    } else if (ext === 'md') {
      fetch(fileUrl).then(r => r.text()).then(setContent);
    }
  }, [fileUrl, nodeData.file]);

  // Si c'est un canvas, on rend un bouton spécial cliquable
  if (nodeData.file?.endsWith('.canvas')) {
    return (
      <div 
        className="h-full w-full bg-[#161b22] border-2 border-accent-green/30 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-accent-green/5 transition-all group"
        onClick={() => setCurrentCanvas(nodeData.file!)}
      >
        <NodeHandles />
        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📂</span>
        <span className="text-xs font-bold text-accent-green text-center px-2">{nodeData.file.split('/').pop()?.replace('.canvas', '')}</span>
        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">MindMap</span>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full bg-[#161b22] border-2 rounded-md overflow-hidden shadow-xl"
      style={{ borderColor: nodeData.color || '#30363d' }}
    >
      <NodeHandles />
      <div className="bg-[#0d1117] px-3 py-1 text-[10px] font-mono text-gray-500 border-b border-gray-800 flex justify-between items-center">
        <span className="truncate">{nodeData.file?.split('/').pop()}</span>
      </div>
      <div className="p-4 h-full overflow-auto text-sm prose prose-invert prose-green max-w-none scrollbar-hide">
        {isImage ? (
          <img src={fileUrl!} alt={nodeData.file} className="max-w-full h-auto rounded" />
        ) : content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-700 animate-pulse text-xs">Chargement...</div>
        )}
      </div>
    </div>
  );
};

export const ObsidianGroupNode = ({ data }: NodeProps<any>) => {
  const nodeData = data as ObsidianNodeData;
  return (
    <div 
      className="h-full w-full border-2 rounded-xl pointer-events-none relative"
      style={{ 
        borderColor: nodeData.color ? `${nodeData.color}44` : 'rgba(255,255,255,0.1)',
        backgroundColor: nodeData.color ? `${nodeData.color}05` : 'transparent'
      }}
    >
      <NodeHandles />
      {nodeData.label && (
        <div 
          className="absolute -top-7 left-0 px-2 py-0.5 rounded-t-md font-bold text-[10px] tracking-widest bg-opacity-20 inline-block uppercase"
          style={{ backgroundColor: nodeData.color || 'rgba(255,255,255,0.1)', color: nodeData.color || '#fff' }}
        >
          {nodeData.label}
        </div>
      )}
    </div>
  );
};
