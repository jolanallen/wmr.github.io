import { Node, Edge, MarkerType } from '@xyflow/react';
import { ObsidianCanvasData } from '../types/canvas';

// Mapping des couleurs Obsidian (ID 1-6) vers Hex
const COLOR_MAP: Record<string, string> = {
  '1': '#ff5555', // Rouge
  '2': '#ffb86c', // Orange
  '3': '#f1fa8c', // Jaune
  '4': '#50fa7b', // Vert
  '5': '#8be9fd', // Cyan
  '6': '#bd93f9', // Violet
};

export const resolveColor = (color?: string) => {
  if (!color) return undefined;
  return COLOR_MAP[color] || color;
};

export const parseCanvas = (data: ObsidianCanvasData) => {
  const nodes: Node[] = data.nodes.map((node) => {
    const isGroup = node.type === 'group';
    
    return {
      id: node.id,
      type: `obsidian${node.type.charAt(0).toUpperCase() + node.type.slice(1)}`,
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        text: node.text,
        file: node.file,
        color: resolveColor(node.color),
        width: node.width,
        height: node.height,
      },
      style: {
        width: node.width,
        height: node.height,
        zIndex: isGroup ? -1 : 1,
      },
    };
  });

  const edges: Edge[] = data.edges.map((edge) => {
    const edgeColor = resolveColor(edge.color) || 'rgba(255,255,255,0.15)';
    
    return {
      id: edge.id,
      source: edge.fromNode,
      target: edge.toNode,
      sourceHandle: edge.fromSide || 'right',
      targetHandle: edge.toSide || 'left',
      label: edge.label,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
      type: 'smoothstep',
    };
  });

  return { nodes, edges };
};
