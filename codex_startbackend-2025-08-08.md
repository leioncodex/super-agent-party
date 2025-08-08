# Agent: startBackend Logging

## Objectif
Expose le journal du processus backend et notifier en cas d'arrêt anormal.

## Contexte
- Fichier modifié : `main.js`.
- `stdio` doit ignorer l'entrée standard tout en exposant `stdout` et `stderr`.
- Les sorties doivent être dirigées vers `backend.log` et la console.
- L'utilisateur doit être averti si le processus se termine avec un code non nul.

## Capacités activées
- Édition de code JavaScript pour la gestion de `child_process`.
- Création et écriture dans un fichier de log.
- Affichage de notifications d'erreur via `dialog`.

## Contraintes
- Utiliser `stdio: ['ignore','pipe','pipe']` dans `spawn`.
- Enregistrer les sorties dans `backend.log`.
- Sur `exit` ou `close` non nul, informer l'utilisateur.

## Mémoire
- Demande consignée le 2025-08-08 dans `codex_startbackend-2025-08-08.md`.
