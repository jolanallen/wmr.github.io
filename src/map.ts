import Panzoom from '@panzoom/panzoom';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './map.css';

// --- Types ---
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
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const VAULT_ROOT = '/vault/';
const MAIN_CANVAS = 'Main-Web_MindMap_Recipes_Full.canvas';

class WMRManager {
  private container: HTMLElement;
  private nodesLayer: HTMLElement;
  private svgLayer: SVGSVGElement;
  private panzoom: any;
  
  // Navigation History
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    this.container = document.getElementById('map-container')!;
    this.nodesLayer = document.getElementById('map-nodes-layer')!;
    this.svgLayer = document.getElementById('map-svg-layer') as unknown as SVGSVGElement;
    
    this.initPanzoom();
    this.setupControls();
    this.setupKeyboard();
    this.navigateTo(MAIN_CANVAS);
  }

  private initPanzoom() {
    this.panzoom = Panzoom(this.container, {
      maxScale: 5,
      minScale: 0.005,
      contain: undefined,
      startScale: 0.1
    });

    const viewport = document.getElementById('map-viewport')!;
    viewport.addEventListener('wheel', (e) => {
      this.panzoom.zoomWithWheel(e);
      this.syncGrid();
    });

    this.container.addEventListener('panzoomchange', () => {
      this.syncGrid();
      this.updateZoomDisplay();
    });
  }

  private syncGrid() {
    const { x, y, scale } = this.panzoom.getPan();
    const grid = document.getElementById('grid-background')!;
    const currentScale = this.panzoom.getScale();
    
    // On synchronise la taille de la grille avec le zoom pour garder un repère visuel
    const size = 30 * currentScale;
    grid.style.backgroundSize = `${size}px ${size}px`;
    grid.style.backgroundPosition = `${x}px ${y}px`;
  }

  private updateZoomDisplay() {
    const level = document.getElementById('zoom-level');
    if (level) {
      const scale = Math.round(this.panzoom.getScale() * 100);
      level.textContent = `${scale}%`;
    }
  }

  private setupControls() {
    document.getElementById('zoom-in')?.addEventListener('click', () => this.panzoom.zoomIn());
    document.getElementById('zoom-out')?.addEventListener('click', () => this.panzoom.zoomOut());
    document.getElementById('zoom-reset')?.addEventListener('click', () => this.resetView());
    
    document.getElementById('btn-back')?.addEventListener('click', () => this.goBack());
    document.getElementById('btn-forward')?.addEventListener('click', () => this.goForward());
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const step = 50 / this.panzoom.getScale();
      if (e.key === 'ArrowUp') this.panzoom.pan(0, step, { relative: true });
      if (e.key === 'ArrowDown') this.panzoom.pan(0, -step, { relative: true });
      if (e.key === 'ArrowLeft') this.panzoom.pan(step, 0, { relative: true });
      if (e.key === 'ArrowRight') this.panzoom.pan(-step, 0, { relative: true });
    });
  }

  private navigateTo(path: string, saveHistory = true) {
    if (saveHistory) {
      // Nettoyer l'historique futur si on était revenu en arrière
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(path);
      this.historyIndex++;
    }
    this.loadCanvas(path);
    this.updateNavButtons();
  }

  private goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadCanvas(this.history[this.historyIndex]);
      this.updateNavButtons();
    }
  }

  private goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadCanvas(this.history[this.historyIndex]);
      this.updateNavButtons();
    }
  }

  private updateNavButtons() {
    const btnBack = document.getElementById('btn-back') as HTMLButtonElement;
    const btnForward = document.getElementById('btn-forward') as HTMLButtonElement;
    btnBack.disabled = this.historyIndex <= 0;
    btnForward.disabled = this.historyIndex >= this.history.length - 1;
    
    const title = document.getElementById('canvas-title')!;
    title.textContent = this.history[this.historyIndex].split('/').pop()?.replace('.canvas', '') || 'WMR';
  }

  private async render(data: CanvasData) {
    // Clear layers
    this.nodesLayer.innerHTML = '';
    this.svgLayer.innerHTML = '';

    // 1. Groupes (Z-index bas)
    data.nodes.filter(n => n.type === 'group').forEach(n => this.renderNode(n));
    // 2. Liens
    data.edges.forEach(e => this.renderEdge(e, data.nodes));
    // 3. Contenu (Z-index haut)
    for (const node of data.nodes.filter(n => n.type !== 'group')) {
      await this.renderNode(node);
    }

    this.centerOnContent(data.nodes);
  }

  private async renderNode(node: CanvasNode) {
    const el = document.createElement('div');
    el.className = `wmr-node type-${node.type}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.width = `${node.width}px`;
    el.style.height = `${node.height}px`;

    if (node.color) {
      const c = this.mapColor(node.color);
      el.style.borderColor = c;
      if (node.type === 'group') el.style.backgroundColor = `${c}05`;
    }

    if (node.type === 'group') {
      el.innerHTML = `<div class="group-label" style="border-left: 4px solid ${this.mapColor(node.color || 'default')}">${node.label || 'Groupe'}</div>`;
    } 
    else if (node.type === 'text') {
      // Compilation Markdown synchrone/asynchrone sécurisée
      const rawText = node.text || '';
      el.innerHTML = await marked.parse(rawText, { breaks: true, gfm: true });
    } 
    else if (node.type === 'file' && node.file) {
      const isCanvas = node.file.toLowerCase().endsWith('.canvas');
      if (isCanvas) {
        el.innerHTML = `
          <div class="file-card">
            <span class="badge">Mindmap</span>
            <div class="icon">📂</div>
            <div class="title">${node.file.split('/').pop()?.replace('.canvas', '')}</div>
            <div style="font-size:0.7rem; opacity:0.4">Double-clic pour ouvrir</div>
          </div>
        `;
        el.addEventListener('dblclick', () => this.navigateTo(node.file!));
        el.addEventListener('click', (e) => e.stopPropagation());
      } else {
        el.innerHTML = `<div class="file-content">Chargement de ${node.file}...</div>`;
        this.fetchMD(el, node.file);
      }
    }

    this.nodesLayer.appendChild(el);
    el.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b as HTMLElement));
  }

  private async fetchMD(container: HTMLElement, path: string) {
    try {
      const res = await fetch(`${VAULT_ROOT}${path}`);
      if (res.ok) {
        const text = await res.text();
        container.innerHTML = await marked.parse(text, { breaks: true, gfm: true });
        container.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b as HTMLElement));
      }
    } catch { /* Error handling */ }
  }

  private renderEdge(edge: CanvasEdge, nodes: CanvasNode[]) {
    const from = nodes.find(n => n.id === edge.fromNode);
    const to = nodes.find(n => n.id === edge.toNode);
    if (!from || !to) return;

    const start = this.getSidePos(from, edge.fromSide);
    const end = this.getSidePos(to, edge.toSide);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'wmr-edge');
    
    // Obsidian Curved Lines Logic
    const dx = Math.abs(end.x - start.x) * 0.5;
    let cp1x = start.x, cp1y = start.y, cp2x = end.x, cp2y = end.y;
    if (edge.fromSide === 'right') cp1x += dx; else if (edge.fromSide === 'left') cp1x -= dx;
    if (edge.toSide === 'right') cp2x += dx; else if (edge.toSide === 'left') cp2x -= dx;

    path.setAttribute('d', `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`);
    if (edge.color) path.style.stroke = this.mapColor(edge.color);
    this.svgLayer.appendChild(path);
  }

  private getSidePos(node: CanvasNode, side: string) {
    if (side === 'top') return { x: node.x + node.width / 2, y: node.y };
    if (side === 'right') return { x: node.x + node.width, y: node.y + node.height / 2 };
    if (side === 'bottom') return { x: node.x + node.width / 2, y: node.y + node.height };
    return { x: node.x, y: node.y + node.height / 2 };
  }

  private mapColor(c: string) {
    const colors: any = { '1': '#ff5555', '2': '#ffb86c', '3': '#f1fa8c', '4': '#50fa7b', '5': '#8be9fd', '6': '#bd93f9' };
    return colors[c] || c;
  }

  private resetView() {
    this.panzoom.reset({ animate: true });
    this.syncGrid();
  }

  private centerOnContent(nodes: CanvasNode[]) {
    if (!nodes || nodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + n.height);
    });
    const scale = Math.min(window.innerWidth / (maxX - minX + 200), window.innerHeight / (maxY - minY + 200), 1);
    this.panzoom.zoom(scale, { animate: false });
    this.panzoom.pan(window.innerWidth / 2 - ((minX + maxX) / 2) * scale, window.innerHeight / 2 - ((minY + maxY) / 2) * scale, { animate: false });
    this.syncGrid();
  }

  private showLoading(show: boolean) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      if (show) overlay.classList.remove('hidden');
      else overlay.classList.add('hidden');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new WMRManager());
