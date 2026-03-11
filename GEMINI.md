# 🧠 WMR - Web MindMap Recipes | Documentation de Conception

Ce document définit les standards techniques et l'architecture du moteur de rendu interactif pour la mindmap de pentest web.

## 1. Objectifs du Projet
- **Scalabilité** : Mise à jour automatique par simple remplacement du dossier Vault Obsidian.
- **Performance** : Rendu fluide de centaines de nœuds sans framework lourd (No-React).
- **Interactivité** : Expérience utilisateur identique à Obsidian (Pan, Zoom, Navigation).
- **Lisibilité** : Rendu Markdown complet avec coloration syntaxique des commandes de sécurité.

## 2. Architecture Technique

### A. Pile Logicielle (Tech Stack)
- **Runtime** : Vite + TypeScript (Vanilla).
- **Moteur de Pan/Zoom** : `@panzoom/panzoom` (Ultra-léger).
- **Parseur Markdown** : `marked` + `highlight.js` (Coloration terminal).
- **Rendu Visuel** : Hybride DOM (HTML) pour les nœuds et SVG pour les connexions.

### B. Structure des Données
Les données sont servies de manière statique depuis `/public/vault/`.
- `Main-Web_MindMap_Recipes_Full.canvas` : Point d'entrée principal.
- `*.md` : Contenu détaillé des fiches d'attaques.
- `assets/` : Captures d'écran et ressources statiques.

## 3. Spécifications du Moteur de Rendu (`WMR-Engine`)

### I. Layering (Couches)
1. **Background** : Three.js (Graphe de points animé).
2. **Viewport Container** : Div racine gérée par Panzoom.
3. **SVG Connection Layer** : Calque contenant les flèches (Edges).
4. **Node Layer** : Divs absolues contenant les cartes (Nodes).

### II. Logique de Mapping des Couleurs (Obsidian -> Web)
Le moteur doit traduire les IDs de couleurs Obsidian en variables CSS :
- `1` (Rouge) : `--danger-red`
- `2` (Orange) : `--warning-orange`
- `4` (Jaune) : `--accent-yellow`
- `6` (Violet) : `--purple-move`
- `#00ff91` (Vert) : Utilisation directe de la valeur Hex.

### III. Algorithme de Connexion
Les flèches seront tracées en calculant les coordonnées `(x, y)` du centre du côté de départ (`fromSide`) et du côté d'arrivée (`toSide`) définis dans le JSON du `.canvas`.

## 4. Roadmap d'Implémentation

### Phase 1 : Fondations
- Configuration de l'environnement et installation des librairies.
- Importation du Vault complet dans `public/vault/`.

### Phase 2 : Le Parser Canvas
- Création de `src/parser.ts` pour transformer le JSON Obsidian en objets JS typés.
- Gestion des types de nœuds : `text`, `group`, `file`.

### Phase 3 : Interface Interactive
- Création du Viewport avec Pan & Zoom.
- Rendu visuel des cartes et des groupes.
- Tracé des lignes de connexion SVG.

### Phase 4 : Rendu de Contenu
- Conversion Markdown -> HTML.
- Intégration de la coloration syntaxique pour les blocs de code shell.

## 5. Maintenance
Pour mettre à jour la mindmap sur le web :
1. Exporter/Copier le dossier Obsidian.
2. Écraser le contenu de `/public/vault/`.
3. Push sur GitHub (Déploiement automatique Vercel).
