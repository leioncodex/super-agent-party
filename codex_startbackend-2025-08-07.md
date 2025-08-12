# Agent: startBackend Logging

## Objectif
Mettre à jour `startBackend()` pour exposer les sorties du processus backend et notifier l'utilisateur en cas d'arrêt anormal.

## Contexte
- Fichier ciblé : `main.js`.
- `stdio` actuel redirige stdout/stderr vers `ignore`, empêchant tout log.
- Aucun message n'est remonté si le backend se termine avec un code non nul.

## Capacités activées
- Édition de code JavaScript/Node pour processus enfant.
- Création de flux via `fs.createWriteStream` ou utilisation de la console.
- Gestion des événements `exit`/`close` sur `child_process`.

## Contraintes
- Remplacer `stdio: ['ignore','ignore','ignore']` par `stdio: ['ignore','pipe','pipe']` dans `startBackend()`.
- Raccorder `backendProcess.stdout` et `backendProcess.stderr` à `fs.createWriteStream('backend.log', { flags: 'a' })` **ou** à `console.log`/`console.error`.
- Si le backend se termine avec un code différent de `0`, afficher un message d'erreur pour l'utilisateur (console, boîte de dialogue, notification).

## Tâches
1. Modifier la configuration `spawn` dans `startBackend()` pour utiliser les pipes.
2. Créer un `fs.createWriteStream` vers `backend.log` et y connecter `backendProcess.stdout` et `backendProcess.stderr` (ou rediriger vers la console).
3. Écouter l'événement `close` ou `exit` de `backendProcess` et, si le `code` est non nul, afficher une erreur utilisateur.
4. Tester l'exécution en lançant l'application et en simulant un arrêt forcé du backend pour valider l'affichage du message et la création des logs.

## Mémoire
- Demande enregistrée dans `codex_startbackend-2025-08-07.md`.
