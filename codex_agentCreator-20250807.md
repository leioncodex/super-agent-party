# Agent Task: Implement AgentCreator and related components

## Objective
Implement a React/TypeScript UI for managing agents in `src/components/AgentCreator.tsx` with support for agent creation, knowledge upload, and model configuration. Include visual status indicators via a `StatusDot` component.

## Context
- The project currently lacks the `src/components` directory and the `AgentCreator`/`AgentCard` components.
- Tauri's `invoke` must be used to communicate with backend commands (`create_agent`, `list_agents`).
- Knowledge files are vectorized via POST `/api/vectorize`.
- Agent model settings are saved via POST `/api/agent/config`.

## Implementation Steps
1. **Project structure**
   - Create `src/components` if it doesn't exist.
   - Within it, add `AgentCreator.tsx` and `StatusDot.tsx`.
2. **StatusDot component**
   - Export a `StatusDot` functional component.
   - Props: `status: 'online' | 'offline'` (extendable).
   - Render a small colored circle (`green` for online, `gray` for offline) using Tailwind or inline styles.
3. **AgentCard component inside AgentCreator.tsx**
   - Displays agent name, model, and current status via `StatusDot`.
   - Includes buttons:
     - "Upload Knowledge" → file input; POST selected files to `/api/vectorize`.
     - "Connect Model" → prompt for provider/model then POST to `/api/agent/config`.
4. **AgentCreator component**
   - On mount, load existing agents by `invoke('list_agents')` and store them in local state.
   - Provide "Create Agent" button:
     - Prompt for agent name.
     - Call `invoke('create_agent', { name })`.
     - Refresh agent list via `invoke('list_agents')`.
   - Render a grid/list of `AgentCard` for each agent.
5. **Tauri integration**
   - Import `invoke` from `@tauri-apps/api/tauri`.
   - Ensure all async calls handle errors with try/catch and give basic user feedback (e.g., `alert`).
6. **TypeScript & TSX**
   - Use functional React components with hooks (`useState`, `useEffect`).
   - Define interfaces for agent data: `{ name: string; model?: string; status: 'online' | 'offline' }`.
7. **Export**
   - Default export `AgentCreator`.
   - Named export `AgentCard` if needed elsewhere.

## Verification
- Run `npm test` (currently expected to show "no test specified" error).
- Future TODO: Add unit tests for components.

## Memory
- File created: `src/components/AgentCreator.tsx` (to be implemented by Codex).
- File created: `src/components/StatusDot.tsx` (to be implemented by Codex).
- Track in this doc for cross-agent awareness.
