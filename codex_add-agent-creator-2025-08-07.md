Objectif
--------
Créer un composant React `AgentCreator` permettant d'appeler les commandes Tauri `create_agent` et `list_agents`, d'intégrer `AgentCard`, d'uploader des connaissances et de choisir un modèle.

Contexte
--------
Le projet `super-agent-party` manque d'une interface pour créer et lister des agents via Tauri. Le composant devra initialiser le formulaire de création, afficher les agents existants et gérer l'upload de fichiers de connaissance.

Capacités activées
------------------
- React + TypeScript
- API Tauri (`invoke`)
- Gestion d'état avec `useState` / `useEffect`
- Intégration d'un composant `AgentCard` pour l'affichage des agents
- Support d'upload de fichiers et sélection de modèles via `<select>`

Contraintes
-----------
- Fichier à créer : `src/components/AgentCreator.tsx`
- Utiliser `invoke('create_agent', {...})` et `invoke('list_agents')`
- Rafraîchir la liste des agents après création
- Upload : convertir les fichiers en base64 ou envoyer leur chemin à `create_agent`
- Modèles : exposer un tableau local de modèles (`llama3`, `mistral`, etc.)
- Affichage : chaque agent renvoyé par `list_agents` est rendu via `AgentCard`
- Fournir gestion d'erreurs basique (logs console)

Mémoire
-------
- Ajouter `AgentCreator.tsx`
- Prévoir un composant `AgentCard` si absent
- Documenter toute évolution future dans ce journal
