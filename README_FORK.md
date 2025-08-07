## 🚀 **Démarrage rapide**

**Prérequis** :
- [Ollama](https://ollama.com  )
- `llama3` ou `phi3` (`ollama pull llama3`)

**Installation :**
```bash
git clone https://github.com/leioncodex/super-agent-party.git  
cd super-agent-party
npm install
npm run tauri dev
Usage :

Lance ollama run llama3

Lance l’app : npm run tauri dev

“Créer un agent” > “Developer Agent”

Upload AGENTS.md, README.md

Demande “Crée un nouvel agent reviewer automatisé.”

🧩 Architecture technique
bash
Copier
Modifier
/super-agent-party
├── src-tauri/        # Backend Rust/Tauri
│   └── src/commands.rs
├── src/              # Frontend React/TS
│   ├── agents/
│   ├── core/
│   └── components/
├── docs/
│   └── AGENTS.md, README.md
└── ...
🌐 Écosystème
Outil	Rôle
Ollama	Inférence LLM locale
LanceDB	Vector-store performant
Codex Web	Génération/Amélioration code
Whisper/Piper	Voix IA locale

🤝 Contribuer
Fork

Branche (git checkout -b feat/ma-feature)

Commit (git commit -m 'feat: ajoute feature')

Push, PR

Voir CONTRIBUTING.md

📄 License
MIT – See LICENSE

“Super-Agent-Party : l’OS IA qui fait de vous un créateur d’intelligences collectives.”
— Le Developer Agent, 2025
