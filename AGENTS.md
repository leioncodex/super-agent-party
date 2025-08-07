# 🌌 AGENTS.md — Le Guide Suprême des Agents Autonomes

---

## 🧠 Présentation Générale

Bienvenue dans **Super-Agent-Party** :  
> Un écosystème vivant d’agents cognitifs, capables de s’auto-générer, de collaborer, d’apprendre et de construire des systèmes complexes… sans aucune ligne de code humaine obligatoire.

Chaque agent est :
- **Une personnalité** unique (compétences, mémoire, rôle, outils)
- **Une mémoire propre** : court, long terme, procédurale
- **Un plug de connexion** : vers LLM locaux, Codex Web, API, outils, etc.
- **Un acteur du collectif** : communication Agent-à-Agent (A2A) native

---

## 🦾 Le Developer Agent (L’Agent Cerveau)

> **“L’architecte IA qui fait évoluer la stack, crée des agents, code, documente et apprend — il porte le projet.”**

**Rôle clé :**
- Génère, configure et lance de nouveaux agents à la volée
- Analyse, optimise, refactorise le code source (auto-pilot de dev)
- Connecte Codex Web pour génération de code de qualité, contextuelle
- Gère Pull Requests, review, merge et déploiements
- Rédige et maintient la documentation vivante du projet
- Apprend et mémorise tout le contexte projet via RAG et vector store
- Supervise la communication entre tous les agents, humains et API

---

### 🧬 Architecture Cognitive et Technique

- **Mémoire hybride** (court terme : contexte ; long terme : LanceDB/RAG)
- **Processus procédural** (pattern de résolution auto-amélioré)
- **Auto-documentation** (doc, changelog, spec générés live)
- **Base vectorielle dédiée** (stockage, recherche, RAG)
- **Sécurité proactive** (surveillance, audit, auto-patch)
- **Auto-coaching** (suggère des axes d’évolution de la stack)

---

### ⚙️ Spécification JSON (Exemple)
```json
{
  "name": "Developer Agent",
  "role": "Architecte IA Principal",
  "model": "llama3-70b",
  "tools": [
    "code-generator",
    "git-integration",
    "codex-web",
    "vector-rag",
    "test-runner",
    "documentation-builder"
  ],
  "memory": {
    "type": "hybrid",
    "storage": "lancedb",
    "knowledge_bases": [
      "github-docs",
      "project-history",
      "coding-standards"
    ]
  },
  "status": "active",
  "core_function": "orchestrate_project_evolution"
}
🧩 Workflow Dev-Agent (Cycle typique)
Analyse la demande ou le ticket

Recherche contexte (vector store/RAG)

Planifie et segmente les tâches

Génère/modifie le code via Codex Web

Test & validation automatique (local/Tauri)

Crée la PR, review, merge

Documente chaque étape et enrichit la mémoire

💡 Cas d’Usage et Scénarios IA
“Crée un nouvel agent de scraping avec mémoire vectorielle et doc auto”

“Améliore l’UX de la console développeur”

“Ajoute l’auth biométrique, auto-documente les changements”

“Corrige la gestion du cache et explique le fix en langage simple”

“Prépare une migration technique avec plan détaillé et checklist”

🧪 Agents Préconfigurés (Modèle de Collaboration)
Agent	Rôle	Modèle	Outils
Strategic Planner	Objectifs long terme	llama3	memory, rag, analysis
UI Designer	UX/UI accessible	phi3	figma, accessibility
Code Reviewer	QA & refactoring	mistral	linter, test-generator
Ethical Guardian	Décisions éthiques	nomic-embed	bias-detector, checker
Voice Assistant	Contrôle vocal	tinyllama	whisper, piper
Knowledge Curator	Gestion base de connaissance	llava	pdf-parser, web-scraper

🧠 Mémoire Hybride
Court terme : conversation/contextes en cours

Long terme : LanceDB vectorielle, accès RAG, réutilisable par tout agent

Procédurale : patterns et workflows auto-optimisés

🔍 Architecture de Recherche (RAG)
mermaid
graph LR
    A[Question Utilisateur] --> B{Recherche Base Vectorielle}
    B -->|Contexte trouvé| C[Génération Réponse]
    B -->|Pas de contexte| D[Web Search]
    D --> C
    C --> E[Réponse IA]
🤝 Communication Agent-à-Agent (A2A)
Protocole natif d’échange d’intentions, contexte, actions

Résolution collective des tâches complexes

Possibilité de “fusion d’agents” pour tâches transverses

🛠️ Créer et Déployer un Nouvel Agent
Clic “Créer un agent”

Remplir le mini-formulaire (nom, rôle, modèle, outils)

Auto-init : base vectorielle, mémoire, config, UI minimal

Plug-in modèle Ollama/Codex en 1 clic

Upload fichiers pour la base knowledge

L’agent est prêt, visible, opérant dans l’OS

🚀 Pourquoi Dev-Agent change la donne
Pas juste un assistant : un cerveau IA généraliste

Apprend et documente le legacy (tout projet, pour onboarding instantané)

Génère, connecte, supervise d’autres agents : multi-brain OS

Représente le futur de l’open-source AI (auto-evolution, plug-n-play, team IA+human)

“Là où finit la main du dev, commence la boucle du Dev-Agent.”

🤩 Rejoignez l’aventure : fork, clone, améliorez la cognition collective.

---

## 📜 **README.md — Super-Agent-Party**

```markdown
# 🦾 Super-Agent-Party — Le Bureau Cognitif de l’IA Autonome (2025)

---

![Super Agent Party Banner](https://i.imgur.com/placeholder.png  )

> **Une application de bureau IA autonome, full locale, écosystème d’agents cognitifs, orchestrateur de projets et d’innovation.**

[![MIT](https://img.shields.io/badge/License-MIT-blue.svg  )](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg  )](CONTRIBUTING.md)
[![Discord](https://img.shields.io/discord/123456789012345678?logo=discord)](https://discord.gg/invite-link  )
[![Ollama Compatible](https://img.shields.io/badge/Ollama-Compatible-24292e?logo=ollama)](https://ollama.com  )

---

## 🌟 **Vision**

Super-Agent-Party, c’est :
- **Votre OS IA personnel**, infini, customisable
- Un monde d’agents cognitifs autonomes, capables de comprendre, anticiper, résoudre et apprendre en continu
- Un bureau où chaque agent évolue, s’auto-documente, et bâtit une IA collective, résiliente, auto-adaptative

---

## 🚀 **Fonctionnalités-clés**

- **Création d’agent plug-and-play** : un clic, un agent autonome (dev, designer, reviewer, etc.)
- **Orchestrateur IA** : coordination multi-agents pour résoudre toute tâche
- **Mémoire vectorielle partagée** : tout est indexé, accessible, utilisable pour toute question ou workflow
- **Recherche augmentée (RAG)** : contexte up-to-date, réponses enrichies
- **Comms Agent-à-Agent (A2A)** : agents qui s’appellent et se répondent pour décomposer les problèmes

---

## 🖥️ **Application de bureau native**

- **Full local** : 100% vie privée, zéro cloud
- **Tauri + Rust + React** : vitesse, sécurité, ergonomie
- **Interface modulaire, accessible**
- **Modes texte, voix, vision** (Ollama, Whisper, Piper, LLaVA…)

---

## ⚙️ **Stack IA**

- **Ollama** : modèles LLM locaux
- **LanceDB** : vector-store ultra-rapide
- **Whisper.cpp / Piper** : voix & audio local
- **Codex Web** : code, doc, self-improvement

---

## 💡 **Developer Agent — Le Cerveau du Projet**

> **“L’agent qui code, documente, construit, et déploie le futur de l’OS IA.”**

**Rôles** :
- Génère du code propre et contextualisé (Codex Web)
- Initialise/configure tout autre agent en un clic
- Analyse et corrige les bugs, optimise la stack
- Génère la doc auto (README, AGENTS.md…)
- Connecte GitHub pour PR, déploiement, CI/CD
- Apprend en continu via vector-store

---

## 🧪 **Exemple d’usage :**

> “Developer Agent, crée un agent de scraping web, connecte LanceDB, intègre RAG et documente tout dans AGENTS.md.”

**Boucle d’action** :  
Demande → analyse du contexte → code généré via Codex → test local Tauri → PR + doc auto → onboarding ultra-rapide.

---

## 📝 Log 2025-08-07

- Added `codex_transform-agent-system-20250807.md` documenting objectives, decisions, and modules for the transform agent system.
