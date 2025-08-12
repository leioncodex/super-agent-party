# API Endpoints

Les points d'accès HTTP exposés par l'application Tauri.

Base URL: `http://localhost:3001`

## GET /agents

Retourne la liste des agents en mémoire.

```bash
curl http://localhost:3001/agents
```

## POST /agents

Crée un nouvel agent.

```bash
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

## DELETE /agents/{id}

Supprime l'agent correspondant à l'identifiant.

```bash
curl -X DELETE http://localhost:3001/agents/1
```

Le serveur est configuré avec CORS permissif pour accepter les requêtes depuis `localhost`.
