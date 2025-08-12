# Agent: Server Imports Refactor

## Objectif
Encapsuler les importations optionnelles, retirer les imports inutiles et séparer les dépendances obligatoires/facultatives.

## Contexte
- Dépôt actuel: super-agent-party.
- Les imports dans `server.py` incluent des modules optionnels chargés globalement.

## Capacités activées
- Édition des fichiers `server.py` et `requirements.txt`.
- Gestion Git et exécution des tests.

## Contraintes
- Pas de nouvelle branche.
- Préserver la compatibilité existante du serveur.

## Tâches
1. Déplacer `aiohttp`, `httpx`, `scipy.wavfile` et `numpy` dans les fonctions qui les utilisent.
2. Encapsuler `edge_tts` et `websockets` dans des blocs `try/except`.
3. Supprimer l'import `requests` et le doublon `asyncio`.
4. Séparer dépendances obligatoires et facultatives dans `requirements.txt`.

## Mémoire
- Fichier: `codex_server-imports-2025-08-07.md`.
