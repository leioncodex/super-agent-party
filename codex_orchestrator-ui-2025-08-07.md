# agent.md

## Objective
Integrate Orchestrator and AgentCreator into the application UI.

## Steps
1. **src/App.tsx**
   - Import `Orchestrator` and `AgentCreator`.
   - Initialize orchestrator state: `const [orchestrator] = useState(() => new Orchestrator())`.
   - Add `setInterval` in `useEffect` to periodically call `orchestrator.autoSuggestNextStep()` and clear it on unmount.
   - Render `<OrchestratorPanel orchestrator={orchestrator} />` and integrate `AgentCreator` entrypoint.

2. **src/components/OrchestratorPanel.tsx**
   - Create component with a text input for the user goal and a submit button.
   - On submit, call `orchestrator.setGoal(goal)` then `orchestrator.runTask()`.
   - Display the resulting response below the form.

3. **main.js / main.ts**
   - Import and expose `AgentCreator` to enable agent creation from the UI.

## Constraints
- TypeScript + React functional components.
- Ensure intervals are cleared on component unmount.
- Maintain existing code style and formatting.

## Testing
- Run `npm test` after implementation.
