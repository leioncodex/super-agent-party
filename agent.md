# Agent Task: Init Tauri + React

## Prompt 1: Tauri Backend Setup
- **Target**: `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`
- Créer un backend Rust minimal pour Tauri :
  - `Cargo.toml` template avec dépendance `tauri` (feature `api-all`).
  - `main.rs` lançant l'application Tauri avec une fenêtre par défaut.

## Prompt 2: React Frontend
- **Target**: `src/`, `package.json`
- Initialiser un projet React (Vite recommandé) dans `src/`.
- Mettre à jour `package.json` :
  - scripts `dev`, `build`, `preview` fournis par Vite.
  - script `tauri` pour lancer Tauri (`"tauri": "tauri"`).
  - dépendance de développement `@tauri-apps/cli`.

## Prompt 3: Configuration Tauri
- **Target**: `tauri.conf.json`
- Configurer l'app pour utiliser le bundler React :
  - `build.distDir` pointant vers le dossier de sortie (`dist`).
  - `build.devPath` sur l'URL de développement (`http://localhost:5173`).
  - Autoriser toutes les API (`allowlist.all = true`).
  - Définir une fenêtre principale (titre, dimensions).

## Prompt 4: Vérification
- Exécuter `npm run tauri dev` pour vérifier que backend et frontend se lancent correctement.
