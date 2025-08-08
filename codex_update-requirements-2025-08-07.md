# Mise à jour des dépendances

## Objectif
Ajouter `httpx` et `websockets` autour de `aiohttp` dans `requirements.txt`.

## Contexte
Les dépendances réseau nécessitent `httpx` et `websockets` en plus de `aiohttp`.

## Actions
- Ajout des nouvelles lignes dans `requirements.txt`
- Installation des dépendances via `pip install -r requirements.txt`

## Résultat
Installation validée, tests exécutés (`pytest`) sans cas.
