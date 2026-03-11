import Panzoom from '@panzoom/panzoom';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './map.css';

// --- Types Obsidian Canvas ---
interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  label?: string;
  text?: string;
  file?: string;
}

interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide: 'top' | 'right' | 'bottom' | 'left';
  toNode: string;
  toSide: 'top' | 'right' | 'bottom' | 'left';
  color?: string;
  label?: string;
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// --- Configuration ---
const VAULT_ROOT = '/vault/';
const MAIN_CANVAS = 'Main-Web_MindMap_Recipes_Full.canvas';

class WMRManager {
  private container: HTMLElement;
  private nodesLayer: HTMLElement;
  private svgLayer: SVGSVGElement;
  private panzoom: any;
  private currentCanvasPath: string = MAIN_CANVAS;

  constructor() {
    this.container = document.getElementById('map-container')!;
    this.nodesLayer = document.getElementById('map-nodes-layer')!;
    this.svgLayer = document.getElementById('map-svg-layer') as unknown as SVGSVGElement;
    
    this.initPanzoom();
    this.setupControls();
    this.loadCanvas(this.currentCanvasPath);
  }

  private initPanzoom() {
    this.panzoom = Panzoom(this.container, {
      maxScale: 2,
      minScale: 0.05,
      canvas: true,
    });

    const viewport = document.getElementById('map-viewport')!;
    viewport.addEventListener('wheel', (e) => {
      this.panzoom.zoomWithWheel(e);
    });
  }

  private setupControls() {
    document.getElementById('zoom-in')?.addEventListener('click', () => this.panzoom.zoomIn());
    document.getElementById('zoom-out')?.addEventListener('click', () => this.panzoom.zoomOut());
    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      this.panzoom.reset();
      this.centerView();
    });
  }

  private async loadCanvas(path: string) {
    this.showLoading(true);
    try {
      const response = await fetch(`${VAULT_ROOT}${path}`);
      if (!response.ok) throw new Error(`Impossible de charger le canvas: ${path}`);
      
      const data: CanvasData = await response.json();
      this.render(data);
      this.centerView();
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement de la MindMap.");
    } finally {
      this.showLoading(false);
    }
  }

  private render(data: CanvasData) {
    // Clear layers
    this.nodesLayer.innerHTML = '';
    this.svgLayer.innerHTML = '';

    // 1. Render Groups (Background)
    data.nodes.filter(n => n.type === 'group').forEach(node => this.renderNode(node));

    // 2. Render Edges (Connections)
    data.edges.forEach(edge => this.renderEdge(edge, data.nodes));

    // 3. Render Content Nodes
    data.nodes.filter(n => n.type !== 'group').forEach(node => this.renderNode(node));
  }

  private renderNode(node: CanvasNode) {
    const el = document.createElement('div');
    el.id = `node-${node.id}`;
    el.className = `wmr-node type-${node.type}`;
    
    // Style de base (Position & Taille)
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.width = `${node.width}px`;
    el.style.height = `${node.height}px`;
    el.style.zIndex = node.type === 'group' ? '1' : '5';

    // Gestion des couleurs Obsidian
    if (node.color) {
      const color = this.mapColor(node.color);
      el.style.borderColor = color;
      if (node.type === 'group') el.style.backgroundColor = `${color}10`; // Low opacity bg
    }

    // Contenu
    if (node.type === 'group' && node.label) {
      const label = document.createElement('div');
      label.className = 'group-label';
      label.textContent = node.label;
      el.appendChild(label);
    } 
    else if (node.type === 'text' && node.text) {
      el.innerHTML = marked.parse(node.text) as string;
    }
    else if (node.type === 'file' && node.file) {
      if (node.file.endsWith('.canvas')) {
        el.innerHTML = `<div class="file-link">📂 Canvas: ${node.file}</div>`;
        el.style.cursor = 'pointer';
        el.onclick = () => this.loadCanvas(node.file!);
      } else {
        el.innerHTML = `<div class="file-link">📄 Fichier: ${node.file}</div>`;
        // Ici on pourrait charger le contenu du fichier .md
        this.fetchAndRenderFile(el, node.file);
      }
    }

    this.nodesLayer.appendChild(el);
    
    // Coloration syntaxique après injection
    el.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }

  private async fetchAndRenderFile(container: HTMLElement, filePath: string) {
    try {
      const response = await fetch(`${VAULT_ROOT}${filePath}`);
      if (response.ok) {
        const text = await response.text();
        container.innerHTML = marked.parse(text) as string;
        container.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }
    } catch (e) {
      console.warn(`Impossible de charger le fichier: ${filePath}`);
    }
  }

  private renderEdge(edge: CanvasEdge, nodes: CanvasNode[]) {
    const from = nodes.find(n => n.id === edge.fromNode);
    const to = nodes.find(n => n.id === edge.toNode);
    if (!from || !to) return;

    const start = this.getSidePos(from, edge.fromSide);
    const end = this.getSidePos(to, edge.toSide);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'wmr-edge');
    
    // Calcul de la courbe de Bézier
    const cp1x = edge.fromSide === 'right' ? start.x + 50 : edge.fromSide === 'left' ? start.x - 50 : start.x;
    const cp1y = edge.fromSide === 'bottom' ? start.y + 50 : edge.fromSide === 'top' ? start.y - 50 : start.y;
    
    const cp2x = edge.toSide === 'right' ? end.x + 50 : edge.toSide === 'left' ? end.x - 50 : end.x;
    const cp2y = edge.toSide === 'bottom' ? end.y + 50 : edge.toSide === 'top' ? end.y - 50 : end.y;

    path.setAttribute('d', `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`);
    
    if (edge.color) path.style.stroke = this.mapColor(edge.color);
    
    this.svgLayer.appendChild(path);
  }

  private getSidePos(node: CanvasNode, side: string) {
    switch (side) {
      case 'top': return { x: node.x + node.width / 2, y: node.y };
      case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 };
      case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
      case 'left': return { x: node.x, y: node.y + node.height / 2 };
      default: return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    }
  }

  private mapColor(obsidianColor: string): string {
    const colors: Record<string, string> = {
      '1': '#ff5555', // Red
      '2': '#ffb86c', // Orange
      '3': '#f1fa8c', // Yellow
      '4': '#50fa7b', // Green
      '5': '#8be9fd', // Cyan
      '6': '#bd93f9', // Purple
    };
    return colors[obsidianColor] || obsidianColor;
  }

  private centerView() {
    // Calcul simple pour centrer sur l'origine du canvas Obsidian
    this.panzoom.zoom(0.4);
    setTimeout(() => {
      this.panzoom.pan(window.innerWidth / 2, window.innerHeight / 2);
    }, 10);
  }

  private showLoading(show: boolean) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = show ? '1' : '0';
      overlay.style.pointerEvents = show ? 'auto' : 'none';
    }
  }
}

// Initialisation
window.addEventListener('DOMContentLoaded', () => {
  new WMRManager();
});
