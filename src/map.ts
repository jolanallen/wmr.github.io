import Panzoom from '@panzoom/panzoom';
import { marked } from 'marked';
import hljs from 'highlight.js';
import * as THREE from 'three';
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
  private history: string[] = [MAIN_CANVAS];
  
  // Three.js Background
  private starScene: THREE.Scene | null = null;
  private starCamera: THREE.PerspectiveCamera | null = null;
  private starRenderer: THREE.WebGLRenderer | null = null;
  private starField: THREE.Points | null = null;

  constructor() {
    this.container = document.getElementById('map-container')!;
    this.nodesLayer = document.getElementById('map-nodes-layer')!;
    this.svgLayer = document.getElementById('map-svg-layer') as unknown as SVGSVGElement;
    
    this.initStars();
    this.initPanzoom();
    this.setupControls();
    this.loadCanvas(MAIN_CANVAS);
  }

  private initStars() {
    const canvas = document.getElementById('stars-canvas') as HTMLCanvasElement;
    this.starScene = new THREE.Scene();
    this.starCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.starRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.starRenderer.setSize(window.innerWidth, window.innerHeight);

    const geo = new THREE.BufferGeometry();
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 4000;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    
    const mat = new THREE.PointsMaterial({ size: 2, color: 0x00ff9d, transparent: true, opacity: 0.4 });
    this.starField = new THREE.Points(geo, mat);
    this.starScene.add(this.starField);

    const animate = () => {
      requestAnimationFrame(animate);
      if (this.starField) {
        this.starField.rotation.y += 0.0001;
      }
      this.starRenderer?.render(this.starScene!, this.starCamera!);
    };
    animate();

    window.addEventListener('resize', () => {
      if (!this.starCamera || !this.starRenderer) return;
      this.starCamera.aspect = window.innerWidth / window.innerHeight;
      this.starCamera.updateProjectionMatrix();
      this.starRenderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private initPanzoom() {
    // Correction : canvas: false car le container est une div
    this.panzoom = Panzoom(this.container, {
      maxScale: 5,
      minScale: 0.01,
      contain: 'outside',
      startScale: 0.2
    });

    const viewport = document.getElementById('map-viewport')!;
    
    // Zoom à la molette fluide
    viewport.addEventListener('wheel', (e) => {
      this.panzoom.zoomWithWheel(e);
      this.updateZoomDisplay();
    });

    // Effet parallaxe sur les étoiles
    this.container.addEventListener('panzoomchange', (e: any) => {
      const { x, y, scale } = e.detail;
      if (this.starField) {
        this.starField.position.x = -x * 0.05;
        this.starField.position.y = y * 0.05;
        this.starField.scale.setScalar(1 + scale * 0.1);
      }
      this.updateZoomDisplay();
    });
  }

  private updateZoomDisplay() {
    const level = document.getElementById('zoom-level');
    if (level) {
      const scale = Math.round(this.panzoom.getScale() * 100);
      level.textContent = `${scale}%`;
    }
  }

  private setupControls() {
    document.getElementById('zoom-in')?.addEventListener('click', () => {
      this.panzoom.zoomIn();
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
      this.panzoom.zoomOut();
    });
    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      this.panzoom.reset();
      this.centerOnContent();
    });
  }

  private updateBreadcrumbs() {
    const bc = document.getElementById('breadcrumbs')!;
    bc.innerHTML = '';
    this.history.forEach((path, index) => {
      const span = document.createElement('span');
      span.className = `crumb ${index === this.history.length - 1 ? 'active' : ''}`;
      const name = path.split('/').pop()?.replace('.canvas', '') || 'WMR';
      span.textContent = name;
      span.onclick = (e) => {
        e.stopPropagation();
        if (index < this.history.length - 1) {
          this.history = this.history.slice(0, index + 1);
          this.loadCanvas(path, false);
        }
      };
      bc.appendChild(span);
    });
  }

  private async loadCanvas(path: string, pushToHistory = true) {
    console.log(`Chargement du canvas : ${path}`);
    this.showLoading(true);
    
    if (pushToHistory && this.history[this.history.length - 1] !== path) {
      this.history.push(path);
    }
    this.updateBreadcrumbs();

    try {
      const response = await fetch(`${VAULT_ROOT}${path}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: CanvasData = await response.json();
      
      this.nodesLayer.innerHTML = '';
      this.svgLayer.innerHTML = '';

      // 1. Groupes (Fond)
      data.nodes.filter(n => n.type === 'group').forEach(n => this.renderNode(n));
      // 2. Liens
      data.edges.forEach(e => this.renderEdge(e, data.nodes));
      // 3. Contenu
      data.nodes.filter(n => n.type !== 'group').forEach(n => this.renderNode(n));

      setTimeout(() => this.centerOnContent(data.nodes), 50);
    } catch (err) {
      console.error("Erreur critique chargement canvas:", err);
      this.showLoading(false);
    } finally {
      // On cache l'overlay après un court délai pour laisser le rendu se faire
      setTimeout(() => this.showLoading(false), 500);
    }
  }

  private renderNode(node: CanvasNode) {
    const el = document.createElement('div');
    el.className = `wmr-node type-${node.type}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.width = `${node.width}px`;
    el.style.height = `${node.height}px`;

    if (node.color) {
      const c = this.mapColor(node.color);
      el.style.borderColor = c;
      if (node.type === 'group') el.style.backgroundColor = `${c}08`;
    }

    if (node.type === 'group') {
      el.innerHTML = `<div class="group-label">${node.label || 'Sans nom'}</div>`;
    } 
    else if (node.type === 'text') {
      el.innerHTML = marked.parse(node.text || '') as string;
    } 
    else if (node.type === 'file' && node.file) {
      const isCanvas = node.file.toLowerCase().endsWith('.canvas');
      if (isCanvas) {
        el.innerHTML = `
          <div class="file-link-card" style="height:100%">
            <span class="canvas-badge">Exploration</span>
            <div class="file-name">${node.file.split('/').pop()?.replace('.canvas', '')}</div>
            <div class="file-icon" style="font-size:2rem; margin-top:10px">📂</div>
            <div style="font-size:0.7rem; margin-top:auto; opacity:0.5">Cliquer pour entrer</div>
          </div>
        `;
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.loadCanvas(node.file!);
        });
      } else {
        el.innerHTML = `
          <div class="file-node-header">
            <span class="file-icon">📄</span>
            <span class="file-name">${node.file.split('/').pop()}</span>
          </div>
          <div class="file-content" style="font-size:0.9rem">Chargement du Markdown...</div>
        `;
        this.fetchMD(el.querySelector('.file-content')!, node.file);
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
        container.innerHTML = marked.parse(text) as string;
        container.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b as HTMLElement));
      } else {
        container.innerHTML = `<span style="color:red">Fichier introuvable: ${path}</span>`;
      }
    } catch { 
      container.innerHTML = 'Erreur réseau'; 
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
    
    const dx = Math.abs(end.x - start.x) * 0.4;
    const dy = Math.abs(end.y - start.y) * 0.4;
    
    let cp1x = start.x, cp1y = start.y, cp2x = end.x, cp2y = end.y;
    if (edge.fromSide === 'right') cp1x += dx; else if (edge.fromSide === 'left') cp1x -= dx;
    if (edge.fromSide === 'bottom') cp1y += dy; else if (edge.fromSide === 'top') cp1y -= dy;
    if (edge.toSide === 'right') cp2x += dx; else if (edge.toSide === 'left') cp2x -= dx;
    if (edge.toSide === 'bottom') cp2y += dy; else if (edge.toSide === 'top') cp2y -= dy;

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

  private centerOnContent(nodes?: CanvasNode[]) {
    if (!nodes || nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padding = 100;
    const scale = Math.min(
      window.innerWidth / (width + padding),
      window.innerHeight / (height + padding),
      1
    );
    
    this.panzoom.zoom(scale, { animate: true });
    
    // On attend la fin du zoom pour paner correctement
    setTimeout(() => {
      this.panzoom.pan(
        window.innerWidth / 2 - centerX * scale,
        window.innerHeight / 2 - centerY * scale,
        { animate: true }
      );
    }, 100);
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
