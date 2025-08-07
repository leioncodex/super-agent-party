# Traduction des commentaires

## Objectif
Traduire automatiquement tous les commentaires du code vers le français afin d'harmoniser la base avec la langue du projet.

## Décisions
- Utilisation du module `googletrans` pour la traduction automatique.
- Préservation de l'indentation et des symboles de commentaire existants.
- Les commentaires contenant `TODO` ou `FIXME` sont ignorés pour une validation manuelle ultérieure.
- Script disponible sous `tools/translate_comments.py` et cible `server.py`, `src/`, `src-tauri/`, `tests/`.
