# Agent: Init Tauri + React

## Objectif
Mettre en place l'infrastructure Tauri avec un frontend React.

## Contexte
- Dépôt actuel: super-agent-party.
- Besoin d'une application de bureau pour orchestrer les agents.

## Capacités activées
- Gestion du système de fichiers pour créer dossiers et fichiers.
- Outils `npm` et `cargo` pour initialiser React et Tauri.
- Configuration de `tauri.conf.json` pour lier backend et frontend.

## Contraintes
- Utiliser la configuration Tauri par défaut.
- Frontend placé dans `src/`.
- Les scripts `package.json` doivent inclure `tauri dev`.
- Vérifier la compilation avec `npm run tauri dev`.

## Tâches
1. Créer le dossier `src-tauri/` avec:
   - `src-tauri/Cargo.toml` (template Tauri par défaut).
   - `src-tauri/src/main.rs` minimal.
2. Initialiser un projet React dans `src/` (Vite ou CRA) et adapter `package.json`.
3. Ajouter `tauri.conf.json` pour pointer vers le bundler et définir la fenêtre principale.
4. Exécuter `npm run tauri dev` pour vérifier la compilation.

## Mémoire
- Ce fichier conserve la demande initiale: `codex_init-tauri-react-2025-08-08.md`.
